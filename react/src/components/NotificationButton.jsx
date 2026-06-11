import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchUnreadNotificationCount } from '../api/notifications'

function NotificationButton({ className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchUnreadNotificationCount()
      .then((data) => {
        if (!cancelled) {
          setUnreadCount(Number(data?.unreadCount ?? 0))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnreadCount(0)
        }
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return (
    <button
      type="button"
      onClick={() => navigate('/notifications')}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white/90 text-[#3D2415] shadow-[0_6px_14px_rgba(78,52,32,0.08)] ${className}`}
      aria-label="알림"
      title="알림"
    >
      <Bell size={18} strokeWidth={1.8} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#D94A38] px-1 text-center text-[10px] font-bold leading-4 text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default NotificationButton
