import { useState, useEffect } from 'react'
import { Heart, Flag, Pencil, Trash2, MapPin, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addTraceLike, removeTraceLike, deleteTrace } from '../../api/traces'
import { fetchMyInfo } from '../../api/users'
import { useNavigate, useParams } from 'react-router-dom'

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

export default function TraceBottomSheet({ post, onClose, onDeleted }) {
  const navigate = useNavigate()
  const { id: boardId } = useParams()
  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [isMyPost, setIsMyPost] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchMyInfo()
      .then(info => setIsMyPost(info.nickname === post?.nickname))
      .catch(() => {})
  }, [post?.nickname])

  const handleLike = async () => {
    const next = !liked
    setLiked(next)
    setLikes(p => p + (next ? 1 : -1))
    try {
      next ? await addTraceLike(post.id) : await removeTraceLike(post.id)
    } catch {
      setLiked(!next)
      setLikes(p => p + (next ? -1 : 1))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTrace(post.id)
      onDeleted?.(post.id)
      onClose()
    } catch (e) {
      void e
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
                  <p style={{ fontFamily: post.style?.fontFamily ?? "'Gaegu', cursive", fontSize: 22, color: '#2A1A0E', textAlign: 'center', lineHeight: 1.4 }}>
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
      </div>
    </AnimatePresence>
  )
}
