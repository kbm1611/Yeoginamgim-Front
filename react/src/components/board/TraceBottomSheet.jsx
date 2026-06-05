import { useState, useEffect } from 'react'
import { Heart, Flag, Pencil, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addTraceLike, removeTraceLike, deleteTrace } from '../../api/traces'
import { fetchMyInfo } from '../../api/users'
import { useNavigate, useParams } from 'react-router-dom'

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
      console.warn('삭제 실패:', e)
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
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        onClick={onClose}
      >
        {/* 배경 딤 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
        />

        {/* 바텀시트 */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            background: '#FDF8F3',
            borderRadius: '20px 20px 0 0',
            padding: '0 0 40px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* 핸들 */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D8CEC2' }} />
          </div>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            }}
          >
            <X size={20} color="#8B7A6B" />
          </button>

          {/* 카드 미리보기 */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px 16px' }}>
            {post.capturedImage ? (
              <img
                src={post.capturedImage}
                alt=""
                style={{
                  maxWidth: 200,
                  maxHeight: 200,
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(42,28,20,0.2)',
                }}
              />
            ) : (
              <div style={{
                width: 160, height: 160,
                background: 'linear-gradient(135deg, #FFE89A, #FFD966)',
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
                boxShadow: '0 8px 24px rgba(42,28,20,0.2)',
              }}>
                <p style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 20, color: '#2A1E14', textAlign: 'center' }}>
                  {post.content}
                </p>
              </div>
            )}
          </div>

          {/* 작성자 정보 */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {post.nickname && (
              <p style={{ fontSize: 14, fontWeight: 600, color: '#3B2A1E', margin: 0 }}>{post.nickname}</p>
            )}
            {post.createdAt && (
              <p style={{ fontSize: 12, color: '#8B7A6B', margin: '4px 0 0' }}>
                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '0 24px' }}>
            {isMyPost ? (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, background: '#3B2A1E', color: '#fff',
                    border: 'none', borderRadius: 28, padding: '14px 0',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Pencil size={16} />
                  수정하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, background: '#fff', color: '#C0392B',
                    border: '1.5px solid #EDD5D2', borderRadius: 28, padding: '14px 0',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                  삭제하기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLike}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, background: '#fff',
                    border: `1.5px solid ${liked ? '#E84855' : '#E8DDD1'}`,
                    borderRadius: 28, padding: '14px 0',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    color: liked ? '#E84855' : '#3B2A1E',
                  }}
                >
                  <Heart size={16} fill={liked ? '#E84855' : 'none'} />
                  {likes}
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, background: '#fff', color: '#8B7A6B',
                    border: '1.5px solid #E8DDD1', borderRadius: 28, padding: '14px 20px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Flag size={16} />
                  신고
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              background: '#fff', borderRadius: 16, padding: 24,
              margin: '0 24px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: 320,
            }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1A0E', textAlign: 'center', margin: 0 }}>흔적을 삭제할까요?</p>
              <p style={{ fontSize: 13, color: '#8B7A6B', textAlign: 'center', margin: '8px 0 20px' }}>삭제된 흔적은 복구할 수 없어요.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 28, border: '1.5px solid #D8CEC2', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6B5344', cursor: 'pointer' }}
                >취소</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 28, border: 'none', background: '#C0392B', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >삭제</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}
