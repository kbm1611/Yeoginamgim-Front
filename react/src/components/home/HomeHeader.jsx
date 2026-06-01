import { MapPin } from 'lucide-react'

function HomeHeader() {
  return (
    <header className="home-header" aria-label="여기남김 로고">
      <div className="brand-lockup" role="img" aria-label="여기남김">
        <MapPin className="brand-pin-icon" strokeWidth={1.8} />
        <span className="brand-wordmark">여기남김</span>
      </div>
    </header>
  )
}

export default HomeHeader
