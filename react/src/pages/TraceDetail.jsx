import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, Flag, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { addTraceLike, removeTraceLike, deleteTrace } from '../api/traces'
import { createTraceReport } from '../api/reports'

function TraceDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { boardId } = useParams()
  const post = location.state?.post

  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 임시로 내 카드 여부 판단 (나중에 로그인 유저 ID와 비교)
  const isMyPost = post?.id?.startsWith('postit-') || post?.id?.startsWith('polaroid-') || post?.id?.startsWith('local-')

  if (!post) {
    return (
      <div className="app-device flex flex-col items-center justify-center">
        <p className="text-[#5C4030]">흔적을 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-[#3B2A1E] underline">
          돌아가기
        </button>
      </div>
    )
  }

  const handleLike = async () => {
    const next = !liked
    setLiked(next)
    setLikes((prev) => prev + (next ? 1 : -1))
    try {
      next ? await addTraceLike(post.id) : await removeTraceLike(post.id)
    } catch {
      // 실패 시 롤백
      setLiked(!next)
      setLikes((prev) => prev + (next ? -1 : 1))
    }
  }

  const handleEdit = () => {
    navigate(`/board/${boardId}/postit`, {
      state: { editPost: post, initialTab: post.type === 'polaroid' ? 'polaroid' : 'postit' },
    })
  }

  const handleDelete = async () => {
    try {
      await deleteTrace(post.id)
    } catch {
      // 로컬에서만 삭제 (서버 실패해도 UI 반영)
    }
    navigate(-1, { state: { deletedPostId: post.id } })
  }

  return (
    <motion.div
      className="app-device flex flex-col bg-[#F5EFE6]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.22 }}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center">
          <ChevronLeft size={24} strokeWidth={1.8} color="#3B2A1E" />
        </button>
        <span className="text-[15px] font-bold text-[#3B2A1E]">흔적 보기</span>
        {isMyPost ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-9 w-9 items-center justify-center"
          >
            <Trash2 size={20} strokeWidth={1.8} color="#C0392B" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </header>

      {/* 카드 크게 보기 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 gap-6">
        {post.capturedImage ? (
          <img
            src={post.capturedImage}
            alt=""
            style={{
              width: '100%',
              maxWidth: 320,
              height: 'auto',
              borderRadius: 8,
              boxShadow: '0 12px 40px rgba(42,28,20,0.2)',
            }}
          />
        ) : post.type === 'polaroid' ? (
          <div
            style={{
              width: '100%',
              maxWidth: 280,
              background: '#fff',
              borderRadius: 8,
              padding: '12px 12px 48px',
              boxShadow: '0 12px 40px rgba(42,28,20,0.2)',
            }}
          >
            {post.media?.image ? (
              <img src={post.media.image} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div style={{ width: '100%', height: 220, background: '#EEE7DC', borderRadius: 4 }} />
            )}
            <p style={{ textAlign: 'center', marginTop: 12, fontFamily: "'Nanum Pen Script', cursive", fontSize: 20, color: '#2A1A0E' }}>
              {post.content}
            </p>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              maxWidth: 280,
              aspectRatio: '1/1',
              background: 'linear-gradient(135deg, #FFE89A 0%, #FFD966 100%)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              boxShadow: '0 12px 40px rgba(42,28,20,0.2)',
            }}
          >
            <p style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 28, color: '#2A1A0E', textAlign: 'center', lineHeight: 1.4 }}>
              {post.content}
            </p>
          </div>
        )}

        {/* 작성자 / 날짜 */}
        <div className="text-center">
          {post.nickname && (
            <p className="text-[14px] font-semibold text-[#3B2A1E]">{post.nickname}</p>
          )}
          {post.createdAt && (
            <p className="text-[12px] text-[#8B7A6B] mt-0.5">
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-center gap-4 px-6 pb-10 pt-4">
        {isMyPost ? (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-full bg-[#3B2A1E] px-6 py-3 text-[14px] font-semibold text-white shadow-md"
          >
            <Pencil size={16} strokeWidth={2} />
            수정하기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#3B2A1E] shadow-md"
            >
              <Heart size={16} fill={liked ? '#E84855' : 'none'} color={liked ? '#E84855' : '#3B2A1E'} strokeWidth={2} />
              {likes}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#6B5344] shadow-md"
            >
              <Flag size={16} strokeWidth={2} />
              신고
            </button>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="mx-6 rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[16px] font-bold text-[#2A1A0E] text-center">흔적을 삭제할까요?</p>
            <p className="text-[13px] text-[#8B7A6B] text-center mt-1">삭제된 흔적은 복구할 수 없어요.</p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-[#D8CEC2] py-2.5 text-[14px] font-semibold text-[#6B5344]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-full bg-[#C0392B] py-2.5 text-[14px] font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default TraceDetail
