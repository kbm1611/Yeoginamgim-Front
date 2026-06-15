import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Search, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL, clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { fetchMyInfo, searchUsers } from '../api/users'
import FollowButton from '../components/FollowButton'

function FriendSearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadCurrentUser() {
      try {
        const info = await fetchMyInfo()
        if (!ignore) {
          setCurrentUserId(info.userId ?? null)
        }
      } catch (apiError) {
        if (ignore) return
        handleUnauthorizedApiError(apiError, { clearToken: clearAuthToken, navigate, location, redirect: true })
      }
    }

    loadCurrentUser()

    return () => {
      ignore = true
    }
  }, [location, navigate])

  const handleSearch = useCallback(async (event) => {
    event.preventDefault()

    const trimmedKeyword = keyword.trim()
    if (!trimmedKeyword) {
      setUsers([])
      setStatus('idle')
      setError('')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const data = await searchUsers(trimmedKeyword)
      setUsers(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, { clearToken: clearAuthToken, navigate, location, redirect: true })) return

      setUsers([])
      setStatus('error')
      setError(getApiErrorMessage(apiError, { fallback: '사용자 검색에 실패했습니다.' }))
    }
  }, [keyword, location, navigate])

  return (
    <motion.div
      className="h-full overflow-y-auto px-5 pb-5 pt-3 scrollbar-hide"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <header>
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => navigate(-1)}
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#3D2415] shadow-[0_4px_12px_rgba(78,52,32,0.08)] active:bg-[#F0E8DF]"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <h1 className="text-[24px] font-bold text-[#2B1810]">친구 찾기</h1>
        <p className="mt-1 text-[13px] font-medium text-[#7A6857]">
          닉네임 또는 사용자 ID로 검색하세요.
        </p>
      </header>

      <form className="mt-5 flex gap-2" onSubmit={handleSearch}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">닉네임 또는 사용자 ID</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="닉네임 또는 사용자 ID"
            className="h-12 w-full rounded-full border border-[#eadfce] bg-white/90 px-4 text-[14px] font-semibold text-[#2B1810] outline-none placeholder:text-[#A39180] focus:border-[#8a5c3a]"
          />
        </label>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3D2415] text-white disabled:opacity-60"
          aria-label="검색"
        >
          {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </form>

      {status === 'idle' && (
        <EmptyState
          title="검색어를 입력해 주세요."
          description="친구의 닉네임 일부나 사용자 ID 숫자를 입력하면 검색할 수 있습니다."
        />
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-lg border border-[#eadfce] bg-white/80 p-4 text-center">
          <p className="text-[14px] font-semibold text-[#a43d30]">{error}</p>
        </div>
      )}

      {status === 'ready' && users.length === 0 && (
        <EmptyState
          title="검색 결과가 없습니다."
          description="닉네임이나 사용자 ID를 다시 확인해 주세요."
        />
      )}

      {status === 'ready' && users.length > 0 && (
        <ul className="mt-5 space-y-3">
          {users.map((user) => {
            const profileImageUrl = getProfileImageUrl(user.profileImageUrl)

            return (
              <li
                key={user.userId}
                className="flex items-center gap-3 rounded-lg border border-[#eadfce] bg-white/80 p-4 shadow-[0_8px_18px_rgba(78,52,32,0.06)]"
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={user.nickname}
                    className="h-11 w-11 rounded-full border border-[#eadfce] object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E7D7C5] text-[#3D2415]">
                    <UserRound size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-[#2B1810]">{user.nickname}</p>
                  <p className="mt-1 text-[12px] font-medium text-[#8a7767]">ID {user.userId}</p>
                </div>
                <FollowButton targetUserId={user.userId} currentUserId={currentUserId} />
              </li>
            )
          })}
        </ul>
      )}
    </motion.div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="mt-6 flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-[#eadfce] bg-white/80 p-6 text-center">
      <UserRound size={28} className="text-[#8a6a4f]" />
      <p className="mt-3 text-[15px] font-bold text-[#2B1810]">{title}</p>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#8a7767]">{description}</p>
    </div>
  )
}

function getProfileImageUrl(profileImageUrl) {
  if (!profileImageUrl) return ''
  if (/^https?:\/\//i.test(profileImageUrl)) return profileImageUrl

  return new URL(profileImageUrl, API_BASE_URL).toString()
}

export default FriendSearchPage
