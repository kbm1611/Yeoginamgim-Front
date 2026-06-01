import { Archive, Home, MapPinned, Plus, User } from 'lucide-react'

function BottomNavigation() {
  return (
    <nav className="bottom-nav">
      <button type="button" className="nav-item is-active">
        <span className="active-chip">
          <Home className="nav-icon" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span>홈</span>
      </button>
      <button type="button" className="nav-item">
        <MapPinned className="nav-icon" strokeWidth={1.5} aria-hidden="true" />
        <span>지도</span>
      </button>
      <button type="button" className="plus-item" aria-label="장소 남기기">
        <span className="plus-circle">
          <Plus className="plus-icon" strokeWidth={1.85} aria-hidden="true" />
        </span>
      </button>
      <button type="button" className="nav-item">
        <Archive className="nav-icon" strokeWidth={1.5} aria-hidden="true" />
        <span>보관함</span>
      </button>
      <button type="button" className="nav-item">
        <User className="nav-icon" strokeWidth={1.5} aria-hidden="true" />
        <span>마이</span>
      </button>
    </nav>
  )
}

export default BottomNavigation
