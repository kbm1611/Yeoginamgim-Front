import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchFollowers, fetchFollowings } from '../api/follows'
import { clearAuthToken, getAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'

function FollowListPage({ type }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const isFollowers = type === 'followers'

  const pageTitle = useMemo(() => (isFollowers ? '팔로워' : '팔로잉'), [isFollowers])

  const loadUsers = useCallback(async () => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    if (!userId) {
      setStatus('error')
      setError('사용자 정보를 찾을 수 없습니다.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const data = isFollowers ? await fetchFollowers(userId) : await fetchFollowings(userId)
      setUsers(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setError(getApiErrorMessage(apiError, { fallback: `${pageTitle} 목록을 불러오지 못했습니다.` }))
      setStatus('error')
    }
  }, [isFollowers, location, navigate, pageTitle, userId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadUsers])

  return (
    <motion.div
      className="h-full overflow-y-auto px-5 pb-5 pt-2 scrollbar-hide"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <header>
        <h1 className="text-[24px] font-bold text-[#2B1810]">{pageTitle}</h1>
        <p className="mt-1 text-[13px] font-medium text-[#7A6857]">총 {users.length}명</p>
      </header>

      {status === 'loading' && (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-[#5f412b]">
          <Loader2 size={28} className="animate-spin" />
          <p className="mt-3 text-[14px] font-semibold">목록을 불러오는 중입니다.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-lg border border-[#eadfce] bg-white/80 p-4 text-center">
          <p className="text-[14px] font-semibold text-[#a43d30]">{error}</p>
          <button
            type="button"
            onClick={loadUsers}
            className="mt-4 rounded-full bg-[#3D2415] px-4 py-2 text-[13px] font-bold text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {status === 'ready' && users.length === 0 && (
        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-[#eadfce] bg-white/80 p-6 text-center">
          <UserRound size={28} className="text-[#8a6a4f]" />
          <p className="mt-3 text-[15px] font-bold text-[#2B1810]">{pageTitle} 목록이 비어 있습니다.</p>
        </div>
      )}

      {status === 'ready' && users.length > 0 && (
        <ul className="mt-5 space-y-3">
          {users.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-3 rounded-lg border border-[#eadfce] bg-white/80 p-4 shadow-[0_8px_18px_rgba(78,52,32,0.06)]"
            >
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
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
                <p className="mt-1 text-[12px] font-medium text-[#8a7767]">
                  {formatFollowedAt(user.followedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

function formatFollowedAt(followedAt) {
  const date = followedAt ? new Date(followedAt) : null

  if (!date || Number.isNaN(date.getTime())) {
    return '팔로우 정보'
  }

  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

export default FollowListPage
