import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import BoardDetail from './pages/BoardDetail'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Map from './pages/Map'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import HomePage from './pages/HomePage'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/home" element={<HomePage />} />
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
