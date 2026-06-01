import { Outlet, useLocation } from 'react-router-dom'
import mainLogo from '../assets/logo/image_12-removebg-preview.png'
import BottomNavigation from '../components/BottomNavigation'

const APP_BG = '#F7F2EA'

function MainLayout() {
  const location = useLocation()
  const isMap = location.pathname === '/map'

  return (
    <main className="app-device relative flex flex-col" style={{ backgroundColor: APP_BG }}>
      {!isMap && (
        <header className="flex items-center justify-center pb-1 pt-2" style={{ backgroundColor: APP_BG }}>
          <div className="flex h-[45px] w-[120px] items-center justify-center" aria-label="main-logo-placeholder">
            <img src={mainLogo} alt="여기남김" className="block max-h-full max-w-full object-contain mix-blend-multiply" />
          </div>
        </header>
      )}

      <section className="relative flex-1 overflow-hidden" style={{ backgroundColor: APP_BG }}>
        <Outlet />
      </section>

      {isMap ? (
        <BottomNavigation className="absolute bottom-0 left-0 z-30 w-full bg-white/95 backdrop-blur-sm" />
      ) : (
        <BottomNavigation />
      )}
    </main>
  )
}

export default MainLayout

