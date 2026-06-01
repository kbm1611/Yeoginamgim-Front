import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import BoardDetail from './pages/BoardDetail'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Map from './pages/Map'
import OnboardingPage from './pages/OnboardingPage'
import PlaceDetail from './pages/PlaceDetail'
import PostItEditor from './pages/PostItEditor'
import SplashPage from './pages/SplashPage'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/map" element={<Map />} />
        </Route>

        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="/board/:id/postit" element={<PostItEditor />} />

        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
