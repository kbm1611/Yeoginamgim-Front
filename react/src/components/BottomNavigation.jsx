import { Archive, Home, MapPinned, Plus, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { key: 'home', label: '홈', icon: Home, path: '/home' },
  { key: 'map', label: '지도', icon: MapPinned, path: '/map' },
  { key: 'add', label: '추가', icon: Plus },
  { key: 'archive', label: '보관함', icon: Archive },
  { key: 'my', label: '마이', icon: User },
]

const APP_BG = '#F7F2EA'

function BottomNavigation({ className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (item) => {
    if (!item.path) return false
    return location.pathname === item.path
  }

  const handleClick = (item) => {
    if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <nav className={`rounded-t-[30px] border-t border-[#efe7dc] px-5 pb-6 pt-3 ${className}`} style={{ backgroundColor: APP_BG }}>
      <ul className="grid grid-cols-5 items-end">
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.key === 'add') {
            return (
              <li key={item.key} className="flex justify-center">
                <button
                  type="button"
                  aria-label="장소 남기기"
                  className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[#3D2415] text-white shadow-[0_3px_8px_rgba(61,36,21,0.18)]"
                >
                  <Icon size={24} strokeWidth={1.9} />
                </button>
              </li>
            )
          }

          return (
            <li key={item.key} className="flex justify-center">
              <button
                type="button"
                onClick={() => handleClick(item)}
                className={`flex flex-col items-center gap-1 ${isActive(item) ? 'text-[#3D2415]' : 'text-[#7A6857]'}`}
              >
                <Icon size={19} strokeWidth={1.5} />
                <span className="font-body-sans text-[13px] font-medium">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNavigation
