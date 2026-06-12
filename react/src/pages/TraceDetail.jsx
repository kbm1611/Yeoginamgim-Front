import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Heart, MoreHorizontal, Pencil, X, Trash2, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { addTraceLike, deleteTrace, fetchTrace, removeTraceLike } from '../api/traces'
import { fetchMyInfo } from '../api/users'
import { createTraceReport } from '../api/reports'
import FollowButton from '../components/FollowButton'
import { traceToPost } from './tracePost.utils'

const REPORT_REASONS = [
  { id: 'SPAM', label: '스팸/광고' },
  { id: 'INAPPROPRIATE', label: '부적절한 콘텐츠' },
  { id: 'HATE', label: '혐오/차별 발언' },
  { id: 'PRIVACY', label: '개인정보 침해' },
  { id: 'ETC', label: '기타' },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function TraceDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: boardId, traceId } = useParams()
  const [post, setPost] = useState(location.state?.post ?? null)

  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [myNickname, setMyNickname] = useState(null)
  const [myUserId, setMyUserId] = useState(null)
  const [myStats, setMyStats] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isLoadingTrace, setIsLoadingTrace] = useState(!location.state?.post)
  const [traceError, setTraceError] = useState('')
  const [isLikePending, setIsLikePending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [isReporting, setIsReporting] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  useEffect(() => {
    if (location.state?.post || !traceId) return
    let ignore = false
    async function loadTrace() {
      setIsLoadingTrace(true)
      setTraceError('')
      try {
        const trace = await fetchTrace(traceId)
        if (!ignore) {
          const nextPost = traceToPost(trace)
          setPost(nextPost)
          setLiked(nextPost.liked ?? false)
          setLikes(nextPost.likes ?? 0)
        }
      } catch (error) {
        if (ignore) return
        if (handleUnauthorizedApiError(error, { clearToken: clearAuthToken, navigate, location, redirect: true })) return
        setTraceError(getApiErrorMessage(error, {
          fallback: '흔적을 불러오지 못했습니다.',
          preferServerMessage: false,
          statusMessages: { 403: '볼 권한이 없습니다.', 404: '흔적을 찾을 수 없습니다.', 500: '잠시 후 다시 시도해주세요.' },
        }))
      } finally {
        if (!ignore) setIsLoadingTrace(false)
      }
    }
    loadTrace()
    return () => { ignore = true }
  }, [location, navigate, traceId])

  useEffect(() => {
    let ignore = false
    async function loadMyInfo() {
      try {
        const info = await fetchMyInfo()
        if (!ignore) {
          setMyNickname(info.nickname)
          setMyUserId(info.userId ?? null)
          setMyStats(info.stats ?? null)
        }
      } catch (error) {
        if (ignore) return
        handleUnauthorizedApiError(error, { clearToken: clearAuthToken, navigate, location })
      }
    }
    loadMyInfo()
    return () => { ignore = true }
  }, [location, navigate])

  const isMyPost = myUserId && post?.userId
    ? myUserId === post.userId
    : myNickname && post?.nickname && myNickname === post.nickname

  const handleLike = async () => {
    if (isLikePending) return
    const next = !liked
    setIsLikePending(true)
    setActionError('')
    setLiked(next)
    setLikes(prev => prev + (next ? 1 : -1))
    try {
      next ? await addTraceLike(post.id) : await removeTraceLike(post.id)
    } catch (error) {
      if (handleUnauthorizedApiError(error, { clearToken: clearAuthToken, navigate, location, redirect: true })) return
      setLiked(!next)
      setLikes(prev => prev + (next ? -1 : 1))
      setActionError(getApiErrorMessage(error, { fallback: '좋아요를 처리하지 못했습니다.' }))
    } finally {
      setIsLikePending(false)
    }
  }

  const handleEdit = () => {
    navigate(`/board/${boardId}/postit`, {
      state: { editPost: post, initialTab: post.type === 'polaroid' ? 'polaroid' : 'postit' },
    })
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setActionError('')
    try {
      await deleteTrace(post.id)
      navigate(-1, { state: { deletedPostId: post.id } })
    } catch (error) {
      if (handleUnauthorizedApiError(error, { clearToken: clearAuthToken, navigate, location, redirect: true })) return
      setActionError(getApiErrorMessage(error, { fallback: '삭제하지 못했습니다.' }))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReport = async () => {
    if (!selectedReason || isReporting) return
    setIsReporting(true)
    try {
      await createTraceReport(post.id, { reason: selectedReason })
      setReportDone(true)
    } catch (error) {
      handleUnauthorizedApiError(error, { clearToken: clearAuthToken, navigate, location })
    } finally {
      setIsReporting(false)
    }
  }

  if (isLoadingTrace) {
    return (
      <div className="app-device flex flex-col items-center justify-center bg-[#F5EFE6]">
        <p className="text-[14px] text-[#8B7A6B]">불러오는 중...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app-device flex flex-col items-center justify-center bg-[#F5EFE6]">
        <p className="text-[14px] text-[#5C4030]">{traceError || '흔적을 찾을 수 없습니다.'}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-[13px] text-[#3B2A1E] underline">돌아가기</button>
      </div>
    )
  }

  const isPolaroid = post.type === 'polaroid'
  const POSTIT_COLOR_MAP = { yellow: '#F7E58A', cream: '#FFF0CC', pink: '#F6ABBE', green: '#B8E0A0', sky: '#A8D8F0', purple: '#D4B8F0', white: '#FFFFFF' }
  const postitBg = post.style?.paperColor
    ? (POSTIT_COLOR_MAP[post.style.paperColor] ?? '#F7E58A')
    : (post.style?.backgroundColor ?? '#F7E58A')
  const postitFont = post.style?.textObjects?.[0]?.fontFamily ?? post.style?.fontFamily ?? "'Gaegu', cursive"

  return (
    <motion.div
      className="app-device flex flex-col bg-white"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22 }}
    >
      {/* ── 헤더 ── */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
        >
          <X size={18} strokeWidth={2.2} color="#3B2A1E" />
        </button>
        <div />
      </header>

      {/* ── 포스트잇 카드 영역 ── */}
      <div className="flex flex-col overflow-y-auto">
        {/* 카드 */}
        <div className="pt-14 pb-3">
          {post.capturedImage ? (
            <div className="relative w-full" style={{ background: postitBg, borderRadius: 6 }}>
              <img
                src={post.capturedImage}
                alt=""
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: 6,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                }}
              />
              <p className="absolute left-4 top-4 text-[11px] text-[#8B7A6B]/70">
                {formatDate(post.createdAt)}
              </p>
            </div>
          ) : isPolaroid ? (
            <div style={{
              width: '100%',
              background: '#fff',
              borderRadius: 6,
              padding: '14px 14px 52px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
            }}>
              {post.media?.image
                ? <img src={post.media.image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 3 }} />
                : <div style={{ width: '100%', aspectRatio: '4/3', background: '#EEE7DC', borderRadius: 3 }} />
              }
              {post.content && (
                <p style={{ textAlign: 'center', marginTop: 14, fontFamily: "'Gaegu', cursive", fontSize: 20, color: '#2A1A0E', lineHeight: 1.4 }}>
                  {post.content}
                </p>
              )}
            </div>
          ) : (
            // 포스트잇
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                background: postitBg,
                borderRadius: 0,
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: '12% 10% 10%',
              }}
            >
              <p style={{ fontSize: 11, color: 'rgba(60,40,20,0.4)', marginBottom: 20, fontFamily: 'sans-serif', letterSpacing: 0.5 }}>
                {formatDate(post.createdAt)}
              </p>
              <p style={{
                fontFamily: postitFont,
                fontSize: 30,
                color: '#2A1A0E',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textAlign: 'left',
              }}>
                {post.content}
              </p>
            </div>
          )}
        </div>

        {/* 좋아요 */}
        <div className="flex items-center gap-2 px-5 pb-4 pt-3">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLikePending}
            className="flex items-center gap-1.5 disabled:opacity-50"
          >
            <Heart
              size={20}
              strokeWidth={1.8}
              fill={liked ? '#E84855' : 'none'}
              color={liked ? '#E84855' : '#9B8B7B'}
            />
            <span className="text-[14px] text-[#6B5B4E]">{likes}</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-[#E8E0D8] mx-5" />

        {/* 작성자 */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4C4B0] text-[15px] font-bold text-[#5C4030]">
            {post.nickname?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#2A1A0E] truncate">{post.nickname ?? '익명의 여행자'}</p>
            <p className="text-[12px] text-[#9B8B7B]">남긴 흔적 {myStats?.traceCount ?? post.cell?.traceCount ?? '-'}개</p>
          </div>
          {myUserId && !isMyPost && post.userId && (
            <FollowButton targetUserId={post.userId} currentUserId={myUserId} />
          )}
          <button
            type="button"
            onClick={() => setShowMenu(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[#F0E8DF]"
          >
            <MoreHorizontal size={20} strokeWidth={2} color="#9B8B7B" />
          </button>
        </div>

        {actionError && (
          <div className="mx-5 mb-3 rounded-xl bg-[#FFF0EE] px-4 py-3 text-center text-[13px] font-semibold text-[#C0392B]">
            {actionError}
          </div>
        )}
      </div>

      {/* ── 더보기 메뉴 ── */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="absolute inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMenu(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              className="relative mx-3 mb-3 overflow-hidden rounded-2xl bg-white shadow-xl"
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {isMyPost ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); handleEdit() }}
                    className="flex w-full items-center gap-3 px-5 py-4 text-[15px] font-semibold text-[#2A1A0E] active:bg-[#F5EFE6]"
                  >
                    <Pencil size={18} strokeWidth={1.8} />
                    수정하기
                  </button>
                  <div className="h-px bg-[#F0E8DF] mx-5" />
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                    className="flex w-full items-center gap-3 px-5 py-4 text-[15px] font-semibold text-[#C0392B] active:bg-[#FFF0EE]"
                  >
                    <Trash2 size={18} strokeWidth={1.8} />
                    삭제하기
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); setShowReportModal(true) }}
                  className="flex w-full items-center gap-3 px-5 py-4 text-[15px] font-semibold text-[#C0392B] active:bg-[#FFF0EE]"
                >
                  <Flag size={18} strokeWidth={1.8} />
                  신고하기
                </button>
              )}
              <div className="h-px bg-[#F0E8DF] mx-5" />
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full py-4 text-[15px] font-semibold text-[#9B8B7B] active:bg-[#F5EFE6]"
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 삭제 확인 ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              className="mx-6 w-full rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-center text-[16px] font-bold text-[#2A1A0E]">흔적을 삭제할까요?</p>
              <p className="mt-1 text-center text-[13px] text-[#8B7A6B]">삭제한 흔적은 복구할 수 없어요.</p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-full border border-[#D8CEC2] py-3 text-[14px] font-semibold text-[#6B5344] disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-full bg-[#C0392B] py-3 text-[14px] font-semibold text-white disabled:opacity-60"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── 신고 모달 ── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { if (!isReporting) { setShowReportModal(false); setSelectedReason(null); setReportDone(false) } }}
          >
            <motion.div
              className="w-full rounded-t-2xl bg-white pb-8 shadow-xl"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {reportDone ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0EE]">
                    <Flag size={24} color="#C0392B" strokeWidth={1.8} />
                  </div>
                  <p className="text-[16px] font-bold text-[#2A1A0E]">신고가 접수됐어요</p>
                  <p className="text-center text-[13px] text-[#9B8B7B]">검토 후 조치할게요. 불편을 드려서 죄송합니다.</p>
                  <button
                    type="button"
                    onClick={() => { setShowReportModal(false); setSelectedReason(null); setReportDone(false) }}
                    className="mt-2 w-full rounded-full bg-[#3B2A1E] py-3 text-[14px] font-bold text-white"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-4">
                    <p className="text-[16px] font-bold text-[#2A1A0E]">신고 사유 선택</p>
                    <button type="button" onClick={() => { setShowReportModal(false); setSelectedReason(null) }}>
                      <X size={20} color="#9B8B7B" />
                    </button>
                  </div>
                  <div className="h-px bg-[#F0E8DF]" />
                  {REPORT_REASONS.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReason(r.id)}
                      className="flex w-full items-center justify-between px-5 py-4 active:bg-[#FAF5EF]"
                    >
                      <span className="text-[15px] text-[#2A1A0E]">{r.label}</span>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedReason === r.id ? 'border-[#C0392B] bg-[#C0392B]' : 'border-[#D8CEC2]'}`}>
                        {selectedReason === r.id && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                  <div className="px-5 pt-3">
                    <button
                      type="button"
                      onClick={handleReport}
                      disabled={!selectedReason || isReporting}
                      className="w-full rounded-full bg-[#C0392B] py-3 text-[14px] font-bold text-white disabled:opacity-40"
                    >
                      {isReporting ? '신고 중...' : '신고하기'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TraceDetail
