import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { fetchFollowStatus, followUser, unfollowUser } from '../api/follows'

function FollowButton({ targetUserId, currentUserId, className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const isSameUser = targetUserId === currentUserId || String(targetUserId) === String(currentUserId)
  const isSelf = targetUserId != null && currentUserId != null && isSameUser

  useEffect(() => {
    if (!targetUserId || isSelf) return

    let ignore = false

    async function loadStatus() {
      setStatus('loading')
      setError('')

      try {
        const data = await fetchFollowStatus(targetUserId)
        if (ignore) return

        setFollowing(data?.following === true)
        setFollowerCount(Number.isFinite(Number(data?.followerCount)) ? Number(data.followerCount) : null)
        setStatus('ready')
      } catch (apiError) {
        if (ignore) return
        if (handleUnauthorizedApiError(apiError, { clearToken: clearAuthToken, navigate, location, redirect: true })) return

        setError(getApiErrorMessage(apiError, { fallback: '팔로우 상태를 불러오지 못했습니다.' }))
        setStatus('error')
      }
    }

    loadStatus()

    return () => {
      ignore = true
    }
  }, [isSelf, location, navigate, targetUserId])

  if (!targetUserId || isSelf) return null

  const isPending = status === 'loading' || status === 'saving'

  const handleClick = async () => {
    if (isPending) return

    const nextFollowing = !following
    setStatus('saving')
    setError('')
    setFollowing(nextFollowing)
    setFollowerCount((count) => {
      if (count == null) return count
      return Math.max(0, count + (nextFollowing ? 1 : -1))
    })

    try {
      const data = nextFollowing ? await followUser(targetUserId) : await unfollowUser(targetUserId)
      setFollowing(data?.following === true)
      setFollowerCount(Number.isFinite(Number(data?.followerCount)) ? Number(data.followerCount) : null)
      setStatus('ready')
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, { clearToken: clearAuthToken, navigate, location, redirect: true })) return

      setFollowing(!nextFollowing)
      setFollowerCount((count) => {
        if (count == null) return count
        return Math.max(0, count + (nextFollowing ? -1 : 1))
      })
      setError(getApiErrorMessage(apiError, { fallback: '팔로우를 처리하지 못했습니다.' }))
      setStatus('error')
    }
  }

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`min-w-[72px] rounded-full px-3 py-2 text-[12px] font-bold transition disabled:opacity-60 ${
          following
            ? 'border border-[#D8CEC2] bg-white text-[#5C4030]'
            : 'bg-[#3B2A1E] text-white'
        }`}
      >
        {isPending ? '처리 중' : following ? '팔로잉' : '팔로우'}
      </button>
      {followerCount != null && (
        <span className="text-[11px] font-medium text-[#9B8B7B]">팔로워 {followerCount}</span>
      )}
      {error && <span className="max-w-[130px] text-right text-[11px] font-medium text-[#C0392B]">{error}</span>}
    </div>
  )
}

export default FollowButton
