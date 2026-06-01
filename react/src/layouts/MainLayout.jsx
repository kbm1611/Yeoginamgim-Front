import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'

function MainLayout() {
  const location = useLocation()
  const isMap = location.pathname === '/map'

  return (
    <main className="app-device relative flex flex-col bg-[#F7F2EA]">
      {!isMap && (
        <header className="flex items-center justify-center pb-1 pt-2">
          <div className="flex h-[40px] w-[90px] items-center justify-center text-[34px] font-semibold leading-none tracking-[-0.02em] text-[#2F2118]">
            여기남김
          </div>
        </header>
      )}

      <section className="relative flex-1 overflow-hidden">
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
