import { useState, useEffect } from 'react'
import { Heart, Flag, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addTraceLike, removeTraceLike, deleteTrace } from '../../api/traces'
import { createTraceReport } from '../../api/reports'
import { fetchMyInfo } from '../../api/users'
import { useNavigate, useParams } from 'react-router-dom'
import FollowButton from '../FollowButton'
import { ACTIVITY_RESTRICTION_MATCHERS, ACTIVITY_RESTRICTION_MESSAGE, getApiErrorMessage } from '../../api/errors'

function TapeStrip() {
  return (
    <div
      className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 -rotate-2"
      style={{
        width: 52,
        height: 20,
        backgroundColor: 'rgba(210, 198, 168, 0.8)',
        borderRadius: 2,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
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

const REPORT_REASONS = [
  { id: 'SPAM', label: '스팸/광고' },
  { id: 'INAPPROPRIATE', label: '부적절한 콘텐츠' },
  { id: 'HATE', label: '혐오/차별 발언' },
  { id: 'PRIVACY', label: '개인정보 침해' },
  { id: 'ETC', label: '기타' },
]

export default function TraceBottomSheet({ post, onClose, onDeleted }) {
  const navigate = useNavigate()
  const { id: boardId } = useParams()
  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [isMyPost, setIsMyPost] = useState(false)
  const [myUserId, setMyUserId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState('')
  const [showReportConfirm, setShowReportConfirm] = useState(false)
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_REASONS[0].id)
  const [isReporting, setIsReporting] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  useEffect(() => {
    fetchMyInfo()
      .then(info => {
        const currentUserId = info.userId ?? null
        setMyUserId(currentUserId)
        setIsMyPost(
          currentUserId && post?.userId
            ? String(currentUserId) === String(post.userId)
            : info.nickname === post?.nickname
        )
      })
      .catch(() => {})
  }, [post?.nickname, post?.userId])

  const handleLike = async () => {
    const next = !liked
    setActionError('')
    setLiked(next)
    setLikes(p => p + (next ? 1 : -1))
    try {
      next ? await addTraceLike(post.id) : await removeTraceLike(post.id)
    } catch (error) {
      setLiked(!next)
      setLikes(p => p + (next ? -1 : 1))
      setActionError(getApiErrorMessage(error, {
        fallback: '좋아요를 처리하지 못했습니다.',
        messageMatchers: ACTIVITY_RESTRICTION_MATCHERS,
        statusMessages: { 403: ACTIVITY_RESTRICTION_MESSAGE },
      }))
    }
  }

  const handleDelete = async () => {
    setActionError('')
    try {
      await deleteTrace(post.id)
      onDeleted?.(post.id)
      onClose()
    } catch (error) {
      setActionError(getApiErrorMessage(error, {
        fallback: '삭제하지 못했습니다.',
        messageMatchers: ACTIVITY_RESTRICTION_MATCHERS,
        statusMessages: { 403: ACTIVITY_RESTRICTION_MESSAGE },
      }))
    }
  }

  const closeReportConfirm = () => {
    if (isReporting) return
    setShowReportConfirm(false)
    setSelectedReportReason(REPORT_REASONS[0].id)
    setReportDone(false)
  }

  const handleReport = async () => {
    if (isReporting) return
    setIsReporting(true)
    setActionError('')
    try {
      await createTraceReport(post.id, { reportKind: selectedReportReason })
      setReportDone(true)
    } catch (error) {
      setActionError(getApiErrorMessage(error, {
        fallback: '신고를 접수하지 못했습니다.',
        messageMatchers: ACTIVITY_RESTRICTION_MATCHERS,
        statusMessages: {
          403: ACTIVITY_RESTRICTION_MESSAGE,
          409: '이미 신고했거나 숨김 처리된 흔적입니다.',
        },
      }))
      setShowReportConfirm(false)
    } finally {
      setIsReporting(false)
    }
  }

  const handleEdit = () => {
    onClose()
    navigate(`/board/${boardId}/postit`, {
      state: { editPost: post, initialTab: post.type === 'polaroid' ? 'polaroid' : 'postit' }
    })
  }

  if (!post) return null

  return (
    <AnimatePresence>
      <div
        className="absolute inset-0 z-50"
        onClick={onClose}
      >
        {/* 배경 딤 */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />

        {/* 바텀시트 — app-device 컨테이너 기준 */}
        <motion.div
          className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-3xl bg-[#F5EFE6]"
          style={{ maxHeight: '85%' }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
        >
          {/* 핸들 */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-9 rounded-full bg-[#D0C4B8]" />
          </div>

          {/* 포스트잇 이미지 영역 — 베이지 배경 */}
          <div
            className="relative flex items-center justify-center py-10"
            style={{ background: 'linear-gradient(160deg, #EEE4D0 0%, #E4D8C4 100%)' }}
          >
            <div className="relative">
              <TapeStrip />
              {post.capturedImage ? (
                <img
                  src={post.capturedImage}
                  alt=""
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'fill',
                    borderRadius: 4,
                    boxShadow: '2px 4px 0 rgba(0,0,0,0.08), 4px 12px 28px rgba(0,0,0,0.15)',
                    display: 'block',
                  }}
                />
              ) : post.type === 'polaroid' ? (
                <div style={{
                  width: 190,
                  background: '#fff',
                  borderRadius: 4,
                  padding: '10px 10px 36px',
                  boxShadow: '2px 4px 0 rgba(0,0,0,0.08), 4px 12px 28px rgba(0,0,0,0.15)',
                }}>
                  {post.media?.image
                    ? <img src={post.media.image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 2 }} />
                    : <div style={{ width: '100%', height: 160, background: '#EEE7DC', borderRadius: 2 }} />
                  }
                </div>
              ) : (
                <div style={{
                  width: 200, height: 200,
                  background: post.style?.backgroundColor ?? (() => {
                    const COLORS = { yellow: '#F7E58A', cream: '#F0EAD6', pink: '#FFD6DC', green: '#D2ECC8', blue: '#C8E0F4', white: '#FFFFFF' }
                    return COLORS[post.style?.paperColor] ?? '#F7E58A'
                  })(),
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 20,
                  boxShadow: '2px 4px 0 rgba(0,0,0,0.08), 4px 12px 28px rgba(0,0,0,0.15)',
                }}>
                  <p style={{ fontFamily: (post.style?.fontFamily ?? "'Gaegu', cursive").replace('YiSeoYun', 'Gaegu'), fontSize: 22, color: '#2A1A0E', textAlign: 'center', lineHeight: 1.4 }}>
                    {post.content}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 작성자 */}
          <div className="flex items-center gap-3 border-b border-[#EDE5D8] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4C4B0] text-[14px] font-bold text-[#6B5344]">
              {post.nickname?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#2A1A0E]">{post.nickname ?? '알 수 없음'}</p>
              <p className="text-[12px] text-[#9B8B7B]">{formatTimeAgo(post.createdAt)}</p>
            </div>
            {isMyPost && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-1.5 rounded-full border border-[#D8CEC2] px-4 py-1.5 text-[12px] font-semibold text-[#5C4030]"
              >
                <Pencil size={12} strokeWidth={2} />
                수정
              </button>
            )}
            {myUserId && !isMyPost && post.userId && (
              <FollowButton targetUserId={post.userId} currentUserId={myUserId} />
            )}
          </div>

          {/* 좋아요 */}
          <div className="flex items-center border-b border-[#EDE5D8] px-5 py-4">
            <button
              type="button"
              onClick={!isMyPost ? handleLike : undefined}
              disabled={isMyPost}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              <Heart
                size={20} strokeWidth={1.8}
                fill={liked ? '#E84855' : 'none'}
                color={liked ? '#E84855' : '#9B8B7B'}
              />
              <span className="text-[14px] font-semibold text-[#3B2A1E]">{likes}명이 좋아해요</span>
            </button>
          </div>

          {/* 신고 / 삭제 */}
          <div className="px-5 py-2 pb-8">
            {actionError && (
              <p className="mb-2 rounded-xl bg-[#FFF0EE] px-4 py-3 text-center text-[13px] font-semibold text-[#C0392B]">
                {actionError}
              </p>
            )}
            {isMyPost ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-2 py-3 text-[14px] font-semibold text-[#C0392B]"
              >
                <Trash2 size={16} strokeWidth={1.8} />
                삭제하기
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setActionError(''); setShowReportConfirm(true) }}
                className="flex w-full items-center gap-2 py-3 text-[14px] font-semibold text-[#C0392B]/70"
              >
                <Flag size={16} strokeWidth={1.8} />
                신고하기
              </button>
            )}
          </div>
        </motion.div>

        {/* 삭제 확인 */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20"
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
                    className="flex-1 rounded-full border border-[#D8CEC2] py-3 text-[14px] font-semibold text-[#6B5344]"
                  >취소</button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 rounded-full bg-[#C0392B] py-3 text-[14px] font-semibold text-white"
                  >삭제</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 신고 확인 */}
        <AnimatePresence>
          {showReportConfirm && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeReportConfirm}
            >
              <motion.div
                className="mx-6 w-full rounded-2xl bg-white p-6 shadow-xl"
                initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                onClick={e => e.stopPropagation()}
              >
                {reportDone ? (
                  <>
                    <p className="text-center text-[16px] font-bold text-[#2A1A0E]">신고가 접수됐어요</p>
                    <p className="mt-1 text-center text-[13px] text-[#8B7A6B]">검토 후 필요한 조치를 진행할게요.</p>
                    <button
                      type="button"
                      onClick={closeReportConfirm}
                      className="mt-5 w-full rounded-full bg-[#3B2A1E] py-3 text-[14px] font-semibold text-white"
                    >
                      확인
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-center text-[16px] font-bold text-[#2A1A0E]">신고 사유를 선택해주세요</p>
                    <div className="mt-4 space-y-1">
                      {REPORT_REASONS.map(reason => (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() => setSelectedReportReason(reason.id)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left active:bg-[#FAF5EF]"
                        >
                          <span className="text-[14px] font-semibold text-[#2A1A0E]">{reason.label}</span>
                          <span className={`h-5 w-5 rounded-full border-2 ${selectedReportReason === reason.id ? 'border-[#C0392B] bg-[#C0392B]' : 'border-[#D8CEC2]'}`} />
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={closeReportConfirm}
                        disabled={isReporting}
                        className="flex-1 rounded-full border border-[#D8CEC2] py-3 text-[14px] font-semibold text-[#6B5344] disabled:opacity-60"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleReport}
                        disabled={isReporting}
                        className="flex-1 rounded-full bg-[#C0392B] py-3 text-[14px] font-semibold text-white disabled:opacity-60"
                      >
                        {isReporting ? '신고 중...' : '신고'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  )
}
