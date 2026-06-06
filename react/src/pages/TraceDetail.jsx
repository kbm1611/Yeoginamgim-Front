import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Flag, Heart, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { addTraceLike, deleteTrace, fetchTrace, removeTraceLike } from '../api/traces'
import { fetchMyInfo } from '../api/users'
import { traceToPost } from './tracePost.utils'

function TraceDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: boardId, traceId } = useParams()
  const [post, setPost] = useState(location.state?.post ?? null)

  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [myNickname, setMyNickname] = useState(null)
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

        if (handleUnauthorizedApiError(error, {
          clearToken: clearAuthToken,
          navigate,
          location,
          redirect: true,
        })) return

        setTraceError(getApiErrorMessage(error, {
          fallback: '흔적을 불러오지 못했습니다. 다시 시도해주세요.',
          statusMessages: {
            403: '흔적을 볼 권한이 없습니다.',
            404: '흔적을 찾을 수 없습니다.',
            500: '흔적을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
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
        if (!ignore) setMyNickname(info.nickname)
      } catch (error) {
        if (ignore) return
        handleUnauthorizedApiError(error, {
          clearToken: clearAuthToken,
          navigate,
          location,
        })
      }
    }

    loadMyInfo()
    return () => { ignore = true }
  }, [location, navigate])

  // 내 닉네임과 흔적 작성자 닉네임 비교
  const isMyPost = myNickname && post?.nickname && myNickname === post.nickname

  if (isLoadingTrace) {
    return (
      <div className="app-device flex flex-col items-center justify-center">
        <p className="text-[#5C4030]">흔적을 불러오는 중입니다.</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app-device flex flex-col items-center justify-center">
        <p className="text-[#5C4030]">{traceError || '흔적을 찾을 수 없습니다.'}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-[#3B2A1E] underline">
          돌아가기
        </button>
      </div>
    )
  }

  const handleLike = async () => {
    if (isLikePending) return

    const next = !liked
    setIsLikePending(true)
    setActionError('')
    setLiked(next)
    setLikes((prev) => prev + (next ? 1 : -1))

    try {
      next ? await addTraceLike(post.id) : await removeTraceLike(post.id)
    } catch (error) {
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setLiked(!next)
      setLikes((prev) => prev + (next ? -1 : 1))
      setActionError(getApiErrorMessage(error, {
        fallback: '좋아요를 처리하지 못했습니다. 다시 시도해주세요.',
        statusMessages: {
          403: '좋아요를 변경할 권한이 없습니다.',
          404: '흔적을 찾을 수 없습니다.',
          409: '좋아요 상태가 이미 변경되었습니다. 다시 확인해주세요.',
          500: '좋아요를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
        },
      }))
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
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setActionError(getApiErrorMessage(error, {
        fallback: '흔적을 삭제하지 못했습니다. 다시 시도해주세요.',
        statusMessages: {
          403: '이 흔적을 삭제할 권한이 없습니다.',
          404: '이미 삭제되었거나 찾을 수 없는 흔적입니다.',
          409: '흔적 상태가 변경되었습니다. 다시 확인해주세요.',
          500: '흔적을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
        },
      }))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      className="app-device flex flex-col bg-[#F5EFE6]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.22 }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center">
          <ChevronLeft size={24} strokeWidth={1.8} color="#3B2A1E" />
        </button>
        <span className="text-[15px] font-bold text-[#3B2A1E]">흔적 보기</span>
        {isMyPost ? (
          <button
            type="button"
            onClick={() => {
              setActionError('')
              setShowDeleteConfirm(true)
            }}
            className="flex h-9 w-9 items-center justify-center"
          >
            <Trash2 size={20} strokeWidth={1.8} color="#C0392B" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
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

        <div className="text-center">
          {post.nickname && (
            <p className="text-[14px] font-semibold text-[#3B2A1E]">{post.nickname}</p>
          )}
          {post.createdAt && (
            <p className="mt-0.5 text-[12px] text-[#8B7A6B]">
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>

        {actionError ? (
          <p className="rounded-lg bg-[#FFF7F2] px-4 py-3 text-center text-[13px] font-semibold text-[#A74831]">
            {actionError}
          </p>
        ) : null}
      </div>

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
              disabled={isLikePending}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#3B2A1E] shadow-md disabled:opacity-60"
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

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="mx-6 rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-center text-[16px] font-bold text-[#2A1A0E]">흔적을 삭제할까요?</p>
            <p className="mt-1 text-center text-[13px] text-[#8B7A6B]">삭제한 흔적은 복구할 수 없어요.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-[#D8CEC2] py-2.5 text-[14px] font-semibold text-[#6B5344] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-[#C0392B] py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default TraceDetail
