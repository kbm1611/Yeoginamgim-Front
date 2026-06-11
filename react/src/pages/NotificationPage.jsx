import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications'
import { clearAuthToken, getAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'

function NotificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [readingId, setReadingId] = useState(null)
  const [isReadingAll, setIsReadingAll] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    setStatus('loading')
    setError('')

    try {
      const data = await fetchNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setError(getApiErrorMessage(apiError, { fallback: '알림을 불러오지 못했습니다.' }))
      setStatus('error')
    }
  }, [location, navigate])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadNotifications()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadNotifications])

  const handleRead = async (notification) => {
    if (!notification?.notificationId || notification.read || readingId) return

    setReadingId(notification.notificationId)

    try {
      const updated = await markNotificationAsRead(notification.notificationId)
      setNotifications((current) => current.map((item) => (
        item.notificationId === updated.notificationId ? updated : item
      )))
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setError(getApiErrorMessage(apiError, { fallback: '알림 읽음 처리에 실패했습니다.' }))
    } finally {
      setReadingId(null)
    }
  }

  const handleReadAll = async () => {
    if (isReadingAll || notifications.every((item) => item.read)) return

    setIsReadingAll(true)
    setError('')

    try {
      const updatedUnreadItems = await markAllNotificationsAsRead()
      const updatedMap = new Map(updatedUnreadItems.map((item) => [item.notificationId, item]))
      setNotifications((current) => current.map((item) => (
        updatedMap.get(item.notificationId) ?? item
      )))
    } catch (apiError) {
      if (handleUnauthorizedApiError(apiError, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setError(getApiErrorMessage(apiError, { fallback: '전체 읽음 처리에 실패했습니다.' }))
    } finally {
      setIsReadingAll(false)
    }
  }

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <motion.div
      className="h-full overflow-y-auto px-5 pb-5 pt-2 scrollbar-hide"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[#2B1810]">알림</h1>
          <p className="mt-1 text-[13px] font-medium text-[#7A6857]">읽지 않은 알림 {unreadCount}개</p>
        </div>
        <button
          type="button"
          onClick={handleReadAll}
          disabled={isReadingAll || unreadCount === 0}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3D2415] text-white disabled:opacity-40"
          aria-label="모두 읽음"
          title="모두 읽음"
        >
          {isReadingAll ? <Loader2 size={17} className="animate-spin" /> : <CheckCheck size={18} />}
        </button>
      </header>

      {status === 'loading' && (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-[#5f412b]">
          <Loader2 size={28} className="animate-spin" />
          <p className="mt-3 text-[14px] font-semibold">알림을 불러오는 중입니다.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-lg border border-[#eadfce] bg-white/80 p-4 text-center">
          <p className="text-[14px] font-semibold text-[#a43d30]">{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="mt-4 rounded-full bg-[#3D2415] px-4 py-2 text-[13px] font-bold text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {status === 'ready' && notifications.length === 0 && (
        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-[#eadfce] bg-white/80 p-6 text-center">
          <Bell size={28} className="text-[#8a6a4f]" />
          <p className="mt-3 text-[15px] font-bold text-[#2B1810]">새 알림이 없습니다.</p>
        </div>
      )}

      {status === 'ready' && notifications.length > 0 && (
        <ul className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <li key={notification.notificationId}>
              <button
                type="button"
                onClick={() => handleRead(notification)}
                className={`w-full rounded-lg border p-4 text-left shadow-[0_8px_18px_rgba(78,52,32,0.06)] ${
                  notification.read
                    ? 'border-[#eadfce] bg-white/75'
                    : 'border-[#d8b997] bg-[#fff8ed]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7D7C5] text-[#3D2415]">
                    <Bell size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold leading-relaxed text-[#2B1810]">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#8a7767]">
                      {formatNotificationMeta(notification)}
                    </p>
                    {notification.traceId && (
                      <p className="mt-2 text-[12px] font-semibold text-[#5f412b]">
                        관련 흔적 #{notification.traceId}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

function formatNotificationMeta(notification) {
  const sender = notification.senderNickname || '사용자'
  const createdAt = notification.createdAt ? new Date(notification.createdAt) : null
  const createdText = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
    : ''

  return [sender, createdText].filter(Boolean).join(' · ')
}

export default NotificationPage
