import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'

function MainLayout() {
  const location = useLocation()
  const isMap = location.pathname === '/map'

  return (
    <main className="app-device relative flex flex-col bg-[#FAF6F0]">
      {!isMap && (
        <header className="logo-area flex items-center justify-center py-4">
          <h1 className="font-brand-serif text-[52px] leading-none tracking-[-0.02em] text-[#4A2E1A]">여기남김</h1>
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
