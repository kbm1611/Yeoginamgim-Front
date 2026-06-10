import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Bookmark, ChevronLeft, ChevronRight, Heart, MapPin, MoreHorizontal, Pencil, StickyNote, Camera, Trash2, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { addTraceLike, deleteTrace, fetchTrace, removeTraceLike } from '../api/traces'
import { fetchMyInfo } from '../api/users'
import { traceToPost } from './tracePost.utils'

function TapeStrip() {
  return (
    <div
      className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 -rotate-2"
      style={{
        width: 56, height: 22,
        backgroundColor: 'rgba(220, 210, 180, 0.75)',
        borderRadius: 2,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    />
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
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
  const [myStats, setMyStats] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isLoadingTrace, setIsLoadingTrace] = useState(!location.state?.post)
  const [traceError, setTraceError] = useState('')
  const [isLikePending, setIsLikePending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const isMyPost = myNickname && post?.nickname && myNickname === post.nickname

  const handleLike = async () => {
    if (isLikePending || isMyPost) return
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
  const POSTIT_COLORS = { yellow: '#F7E58A', cream: '#F0EAD6', pink: '#FFD6DC', green: '#D2ECC8', blue: '#C8E0F4', white: '#FFFFFF' }
  const postitBg = post.style?.backgroundColor ?? POSTIT_COLORS[post.style?.paperColor] ?? '#F7E58A'
  const postitFont = post.style?.fontFamily ?? "'Gaegu', cursive"

  // 작성자 통계 — 내 포스트면 내 통계, 남의 포스트면 post에서 가져옴
  const authorStats = isMyPost ? myStats : (post.authorStats ?? null)

  return (
    <motion.div
      className="app-device flex flex-col overflow-hidden bg-white"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22 }}
    >
      {/* ── 헤더 (투명 오버레이) ── */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
        >
          <ChevronLeft size={20} strokeWidth={2.2} color="#3B2A1E" />
        </button>
        <p className="text-[15px] font-bold text-[#2A1A0E] drop-shadow-sm">흔적 상세</p>
        <button
          type="button"
          onClick={() => setShowMenu(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
        >
          <MoreHorizontal size={20} strokeWidth={2} color="#3B2A1E" />
        </button>
      </header>

      {/* ── 상단: 포스트잇/폴라로이드 + 배경 ── */}
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{
          minHeight: 340,
          background: 'linear-gradient(160deg, #EEE4D0 0%, #E0D4C0 100%)',
          paddingTop: 72,
          paddingBottom: 52,
        }}
      >
        <div className="relative">
          <TapeStrip />
          {post.capturedImage ? (
            <img
              src={post.capturedImage}
              alt=""
              style={{
                width: 240, height: 240,
                objectFit: 'fill',
                borderRadius: 6,
                boxShadow: '3px 6px 0 rgba(0,0,0,0.08), 4px 18px 36px rgba(0,0,0,0.18)',
                display: 'block',
              }}
            />
          ) : isPolaroid ? (
            <div style={{
              width: 220, background: '#fff', borderRadius: 4,
              padding: '10px 10px 42px',
              boxShadow: '3px 6px 0 rgba(0,0,0,0.08), 4px 18px 36px rgba(0,0,0,0.18)',
            }}>
              {post.media?.image
                ? <img src={post.media.image} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 }} />
                : <div style={{ width: '100%', height: 180, background: '#EEE7DC', borderRadius: 2 }} />
              }
              {post.content && (
                <p style={{ textAlign: 'center', marginTop: 10, fontFamily: "'Gaegu', cursive", fontSize: 18, color: '#2A1A0E', lineHeight: 1.4 }}>
                  {post.content}
                </p>
              )}
            </div>
          ) : (
            <div style={{
              width: 230, height: 230,
              background: postitBg,
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
              boxShadow: '3px 6px 0 rgba(0,0,0,0.08), 4px 18px 36px rgba(0,0,0,0.18)',
            }}>
              <p style={{ fontFamily: postitFont, fontSize: 22, color: '#2A1A0E', textAlign: 'center', lineHeight: 1.5 }}>
                {post.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 정보 영역 (흰 카드 느낌) ── */}
      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-3xl bg-white" style={{ marginTop: -20, zIndex: 10 }}>
        <div className="mx-auto mt-2 mb-4 h-1 w-10 rounded-full bg-[#E0D4C8]" />

        {/* 작성자 행 */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4C4B0] text-[16px] font-bold text-[#5C4030]">
            {post.nickname?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#2A1A0E] truncate">{post.nickname ?? '알 수 없음'}</p>
            <p className="text-[12px] text-[#9B8B7B]">{formatTimeAgo(post.createdAt)}</p>
          </div>
          {isMyPost ? (
            <button
              type="button"
              onClick={handleEdit}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#D8CEC2] px-4 py-1.5 text-[12px] font-semibold text-[#5C4030]"
            >
              <Pencil size={12} strokeWidth={2} />
              수정
            </button>
          ) : (
            <button
              type="button"
              className="flex shrink-0 items-center gap-1 rounded-full border border-[#D8CEC2] px-3 py-1.5 text-[12px] font-semibold text-[#5C4030]"
            >
              <span>작성자 흔적 더 보기</span>
              <ChevronRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="h-px bg-[#F0E8DF] mx-5" />

        {/* 장소 행 */}
        {(post.placeName || post.boardName) && (
          <>
            <button
              type="button"
              onClick={() => boardId && navigate(`/board/${boardId}`)}
              className="flex items-center gap-3 px-5 py-4 active:bg-[#FAF5EF]"
            >
              <MapPin size={17} strokeWidth={1.8} color="#9B8B7B" />
              <span className="flex-1 text-left text-[14px] font-semibold text-[#3B2A1E]">
                {post.placeName || post.boardName}
              </span>
              <ChevronRight size={16} strokeWidth={2} color="#C4B8A8" />
            </button>
            <div className="h-px bg-[#F0E8DF] mx-5" />
          </>
        )}

        {/* 좋아요 + 북마크 행 */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLikePending || !!isMyPost}
            className="flex items-center gap-2 disabled:opacity-60"
          >
            <Heart
              size={22}
              strokeWidth={1.8}
              fill={liked ? '#E84855' : 'none'}
              color={liked ? '#E84855' : '#9B8B7B'}
            />
            <span className="text-[14px] font-semibold text-[#3B2A1E]">{likes}명이 좋아해요</span>
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[#FAF5EF]"
          >
            <Bookmark size={20} strokeWidth={1.8} color="#9B8B7B" />
          </button>
        </div>

        {/* 에러 */}
        {actionError && (
          <div className="mx-5 mb-2 rounded-xl bg-[#FFF0EE] px-4 py-3 text-center text-[13px] font-semibold text-[#C0392B]">
            {actionError}
          </div>
        )}

        <div className="h-px bg-[#F0E8DF] mx-5" />

        {/* 신고하기 */}
        {!isMyPost && (
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-4 text-[13px] font-semibold text-[#C0392B]/80"
          >
            <AlertTriangle size={14} strokeWidth={2} />
            신고하기
          </button>
        )}

        {/* 작성자 흔적 통계 카드 */}
        {post.nickname && (
          <div className="mx-4 mt-3 mb-6 overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#FAF6F0]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EDE5D8]">
              <p className="text-[14px] font-bold text-[#2A1A0E]">
                {isMyPost ? '내가 남긴 다른 흔적' : `${post.nickname}이 남긴 다른 흔적`}
              </p>
              <ChevronRight size={15} strokeWidth={2} color="#C4B8A8" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#EDE5D8] py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EFE6]">
                  <StickyNote size={18} color="#8B6E5A" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold text-[#2A1A0E]">
                    {isMyPost ? (myStats?.traceCount ?? 0) : (authorStats?.postitCount ?? '-')}
                  </p>
                  <p className="text-[11px] text-[#9B8B7B]">포스트잇</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EFE6]">
                  <Camera size={18} color="#8B6E5A" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold text-[#2A1A0E]">
                    {isMyPost ? (myStats?.polaroidCount ?? 0) : (authorStats?.polaroidCount ?? '-')}
                  </p>
                  <p className="text-[11px] text-[#9B8B7B]">폴라로이드</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EFE6]">
                  <MapPin size={18} color="#8B6E5A" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold text-[#2A1A0E]">
                    {isMyPost ? (myStats?.archiveBoardCount ?? 0) : (authorStats?.boardCount ?? '-')}
                  </p>
                  <p className="text-[11px] text-[#9B8B7B]">방문 장소</p>
                </div>
              </div>
            </div>
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
    </motion.div>
  )
}

export default TraceDetail
