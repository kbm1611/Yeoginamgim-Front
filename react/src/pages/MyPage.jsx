import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Archive,
  Heart,
  Loader2,
  LogOut,
  Pencil,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchArchiveBoards, fetchMyTraces } from '../api/archive'
import { logout } from '../api/auth'
import { API_BASE_URL, clearAuthToken, getAuthToken } from '../api/client'
import { deleteMyAccount, fetchMyInfo, updateMyInfo } from '../api/users'
import { getVisibleProfileImageUrl, normalizeMyPageData } from './MyPage.utils'

const WITHDRAWAL_CONFIRMATION = '회원탈퇴'

const initialPageState = {
  status: 'loading',
  data: null,
  error: '',
}

function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pageState, setPageState] = useState(initialPageState)
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [profileFile, setProfileFile] = useState(null)
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawConfirmation, setWithdrawConfirmation] = useState('')
  const [withdrawStatus, setWithdrawStatus] = useState({ type: '', message: '' })
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [failedProfileImageUrl, setFailedProfileImageUrl] = useState('')
  const fileInputRef = useRef(null)

  const loadMyPage = useCallback(async () => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    setPageState({ status: 'loading', data: null, error: '' })

    try {
      const [user, myTracesResponse, archiveBoardsResponse] = await Promise.all([
        fetchMyInfo(),
        fetchMyTraces(),
        fetchArchiveBoards(),
      ])
      const data = normalizeMyPageData({
        user,
        myTracesResponse,
        archiveBoardsResponse,
      })

      setPageState({ status: 'ready', data, error: '' })
      setNickname(data.profile.nickname)
      setBirthDate(data.profile.birthDate)
    } catch (error) {
      if (error?.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true, state: { from: location } })
        return
      }

      setPageState({
        status: 'error',
        data: null,
        error: getFriendlyError(error),
      })
    }
  }, [location, navigate])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadMyPage()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadMyPage])

  const profile = pageState.data?.profile
  const stats = pageState.data?.stats
  const rawProfileImageUrl = profile?.profileImageUrl ?? ''
  const profileImageUrl = useMemo(
    () => getVisibleProfileImageUrl(rawProfileImageUrl, rawProfileImageUrl === failedProfileImageUrl, API_BASE_URL),
    [rawProfileImageUrl, failedProfileImageUrl]
  )
  const isLocalAccount = String(profile?.provider ?? 'LOCAL').toUpperCase() === 'LOCAL'

  const resetEditState = () => {
    setIsEditing(false)
    setNickname(profile?.nickname ?? '')
    setBirthDate(profile?.birthDate ?? '')
    setProfileFile(null)
    setUpdateStatus({ type: '', message: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetWithdrawState = () => {
    setWithdrawPassword('')
    setWithdrawConfirmation('')
    setWithdrawStatus({ type: '', message: '' })
  }

  const openWithdrawModal = () => {
    resetWithdrawState()
    setIsWithdrawModalOpen(true)
  }

  const closeWithdrawModal = () => {
    if (isWithdrawing) return

    resetWithdrawState()
    setIsWithdrawModalOpen(false)
  }

  const handleSubmitProfile = async (event) => {
    event.preventDefault()
    const trimmedNickname = nickname.trim()

    if (!trimmedNickname) {
      setUpdateStatus({ type: 'error', message: '닉네임을 입력해 주세요.' })
      return
    }

    if (birthDate && !/^\d{6}$/.test(birthDate)) {
      setUpdateStatus({ type: 'error', message: '생일은 YYMMDD 형식의 6자리 숫자로 입력해주세요.' })
      return
    }

    setIsUpdating(true)
    setUpdateStatus({ type: '', message: '' })

    try {
      const formData = new FormData()
      formData.append('nickname', trimmedNickname)
      formData.append('birthDate', birthDate)
      if (profileFile) {
        formData.append('profileUploadFile', profileFile)
      }

      await updateMyInfo(formData)
      setUpdateStatus({ type: 'success', message: '프로필을 저장했어요.' })
      setIsEditing(false)
      setProfileFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await loadMyPage()
    } catch (error) {
      if (error?.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true, state: { from: location } })
        return
      }

      setUpdateStatus({ type: 'error', message: getFriendlyError(error) })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } catch {
      clearAuthToken()
    } finally {
      clearAuthToken()
      navigate('/login', { replace: true })
    }
  }

  const handleWithdrawSubmit = async (event) => {
    event.preventDefault()

    if (isWithdrawing) return

    if (isLocalAccount && !withdrawPassword.trim()) {
      setWithdrawStatus({ type: 'error', message: '비밀번호를 입력해 주세요.' })
      return
    }

    if (!isLocalAccount && withdrawConfirmation.trim() !== WITHDRAWAL_CONFIRMATION) {
      setWithdrawStatus({ type: 'error', message: `확인 문구 ${WITHDRAWAL_CONFIRMATION}를 입력해 주세요.` })
      return
    }

    setIsWithdrawing(true)
    setWithdrawStatus({ type: '', message: '' })

    try {
      await deleteMyAccount(
        isLocalAccount
          ? { password: withdrawPassword }
          : { confirmation: withdrawConfirmation.trim() }
      )
      clearAuthToken()
      navigate('/login', { replace: true, state: { message: '회원 탈퇴가 완료되었습니다.' } })
    } catch (error) {
      if (error?.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setWithdrawStatus({ type: 'error', message: getFriendlyError(error) })
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <motion.div
      className="h-full overflow-y-auto px-5 pb-5 pt-2 scrollbar-hide"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {pageState.status === 'loading' && <MyPageLoading />}

      {pageState.status === 'error' && (
        <MyPageError message={pageState.error} onRetry={loadMyPage} onLogout={handleLogout} />
      )}

      {pageState.status === 'ready' && (
        <>
          <section className="rounded-lg border border-[#eadfce] bg-white/80 p-4 shadow-[0_8px_18px_rgba(78,52,32,0.07)]">
            <div className="flex items-start gap-4">
              <div className="relative">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={profile.nickname}
                    onError={() => setFailedProfileImageUrl(rawProfileImageUrl)}
                    className="h-16 w-16 rounded-full border border-[#eadfce] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7D7C5] text-[24px] font-bold text-[#3D2415]">
                    {profile.initial}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[22px] font-bold text-[#2B1810]">{profile.nickname}</p>
                <p className="mt-1 truncate text-[13px] font-medium text-[#77685c]">{profile.email}</p>
                {profile.birthDate && (
                  <p className="mt-1 truncate text-[13px] font-medium text-[#8a7767]">
                    생일 {profile.birthDate}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="프로필 수정"
                title="프로필 수정"
                onClick={() => {
                  setIsEditing(true)
                  setNickname(profile.nickname)
                  setBirthDate(profile.birthDate ?? '')
                  setUpdateStatus({ type: '', message: '' })
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4EEE5] text-[#4B3120]"
              >
                <Pencil size={17} strokeWidth={1.8} />
              </button>
            </div>

            {isEditing && (
              <form className="mt-4 border-t border-[#f0e8dd] pt-4" onSubmit={handleSubmitProfile}>
                <label className="block">
                  <span className="text-[12px] font-semibold text-[#7b6a5d]">닉네임</span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    disabled={isUpdating}
                    maxLength={255}
                    className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fffbf5] px-3 py-3 text-[15px] font-semibold text-[#2B1810] outline-none focus:border-[#8a5c3a]"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-[12px] font-semibold text-[#7b6a5d]">생일</span>
                  <input
                    type="text"
                    name="birthDate"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="생년월일 6자리"
                    value={birthDate}
                    onChange={(event) => setBirthDate(onlySixDigits(event.target.value))}
                    disabled={isUpdating}
                    className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fffbf5] px-3 py-3 text-[15px] font-semibold text-[#2B1810] outline-none focus:border-[#8a5c3a]"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-[12px] font-semibold text-[#7b6a5d]">프로필 이미지</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => setProfileFile(event.target.files?.[0] ?? null)}
                    disabled={isUpdating}
                    className="mt-2 w-full text-[13px] text-[#6f5d50] file:mr-3 file:rounded-full file:border-0 file:bg-[#3D2415] file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-white"
                  />
                </label>

                {updateStatus.message && (
                  <p
                    className={`mt-3 text-[13px] font-medium ${
                      updateStatus.type === 'success' ? 'text-[#3f6a46]' : 'text-[#a43d30]'
                    }`}
                    aria-live="polite"
                  >
                    {updateStatus.message}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#3D2415] px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={resetEditState}
                    disabled={isUpdating}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EFE8DE] text-[#4B3120] disabled:opacity-60"
                    aria-label="수정 취소"
                    title="수정 취소"
                  >
                    <X size={18} />
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="mt-5">
            <div className="grid grid-cols-3 gap-2">
              <StatItem icon={User} label="흔적" value={stats.traceCount} />
              <StatItem icon={Archive} label="장소" value={stats.archiveBoardCount} />
              <StatItem icon={Heart} label="받은 좋아요" value={stats.receivedLikeCount} />
            </div>
            <button
              type="button"
              onClick={() => navigate('/archive')}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3D2415] px-4 py-3 text-[14px] font-bold text-white"
            >
              <Archive size={17} />
              내 흔적 보관함 보기
            </button>
          </section>

          <section className="mt-6 pb-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dfd0bf] bg-[#fffaf4] px-4 py-3 text-[14px] font-bold text-[#5a3a26] disabled:opacity-60"
            >
              {isLoggingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
              로그아웃
            </button>
          </section>

          <section className="mt-3 pb-8">
            <button
              type="button"
              onClick={openWithdrawModal}
              disabled={isWithdrawing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e5c8bd] bg-[#fff7f4] px-4 py-3 text-[14px] font-bold text-[#a43d30] disabled:opacity-60"
            >
              <Trash2 size={17} />
              회원 탈퇴
            </button>
          </section>

          {isWithdrawModalOpen && (
            <WithdrawModal
              isLocalAccount={isLocalAccount}
              password={withdrawPassword}
              confirmation={withdrawConfirmation}
              status={withdrawStatus}
              isSubmitting={isWithdrawing}
              onPasswordChange={setWithdrawPassword}
              onConfirmationChange={setWithdrawConfirmation}
              onCancel={closeWithdrawModal}
              onSubmit={handleWithdrawSubmit}
            />
          )}
        </>
      )}
    </motion.div>
  )
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-[#EDE0D0] px-3 py-3 text-center">
      <Icon size={18} className="mx-auto text-[#5f412b]" />
      <p className="mt-2 text-[20px] font-bold text-[#2B1810]">{value}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-[#776353]">{label}</p>
    </div>
  )
}

function WithdrawModal({
  isLocalAccount,
  password,
  confirmation,
  status,
  isSubmitting,
  onPasswordChange,
  onConfirmationChange,
  onCancel,
  onSubmit,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-title"
    >
      <form
        className="w-full max-w-sm rounded-lg border border-[#eadfce] bg-[#fffaf4] p-5 shadow-[0_18px_45px_rgba(43,24,16,0.22)]"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="withdraw-title" className="text-[20px] font-bold text-[#2B1810]">
              회원 탈퇴
            </h2>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#7A6857]">
              탈퇴 후 현재 토큰은 사용할 수 없고, 작성한 흔적은 탈퇴한 사용자로 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE8DE] text-[#4B3120] disabled:opacity-60"
            aria-label="닫기"
            title="닫기"
          >
            <X size={17} />
          </button>
        </div>

        {isLocalAccount ? (
          <label className="mt-5 block">
            <span className="text-[12px] font-semibold text-[#7b6a5d]">비밀번호 확인</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-[#eadfce] bg-white px-3 py-3 text-[15px] font-semibold text-[#2B1810] outline-none focus:border-[#8a5c3a]"
            />
          </label>
        ) : (
          <label className="mt-5 block">
            <span className="text-[12px] font-semibold text-[#7b6a5d]">확인 문구</span>
            <input
              type="text"
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              disabled={isSubmitting}
              placeholder={WITHDRAWAL_CONFIRMATION}
              className="mt-2 w-full rounded-lg border border-[#eadfce] bg-white px-3 py-3 text-[15px] font-semibold text-[#2B1810] outline-none focus:border-[#8a5c3a]"
            />
          </label>
        )}

        {status.message && (
          <p className="mt-3 text-[13px] font-medium text-[#a43d30]" aria-live="polite">
            {status.message}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-full border border-[#dfd0bf] bg-white px-4 py-3 text-[14px] font-bold text-[#5a3a26] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#a43d30] px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            탈퇴하기
          </button>
        </div>
      </form>
    </div>
  )
}

function MyPageLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-[#5f412b]">
      <Loader2 size={28} className="animate-spin" />
      <p className="mt-3 text-[14px] font-semibold">불러오는 중</p>
    </div>
  )
}

function MyPageError({ message, onRetry, onLogout }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E3DC] text-[#a43d30]">
        <AlertCircle size={24} />
      </div>
      <p className="mt-4 text-[18px] font-bold text-[#2B1810]">마이페이지를 불러오지 못했어요</p>
      <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#7A6857]">{message}</p>
      <div className="mt-5 flex w-full gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-full bg-[#3D2415] px-4 py-3 text-[14px] font-bold text-white"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex-1 rounded-full border border-[#dfd0bf] bg-[#fffaf4] px-4 py-3 text-[14px] font-bold text-[#5a3a26]"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}

function onlySixDigits(value) {
  return value.replace(/\D/g, '').slice(0, 6)
}

function getFriendlyError(error) {
  if (error?.status === 404) return '사용자 정보를 찾을 수 없어요.'
  if (error?.status >= 500) return '서버 응답이 불안정해요. 잠시 후 다시 시도해 주세요.'
  return error?.message || '요청을 처리하지 못했어요.'
}

export default MyPage
