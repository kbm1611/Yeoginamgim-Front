import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getAuthToken } from './api/client'
import MainLayout from './layouts/MainLayout'
import BoardDetail from './pages/BoardDetail'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Map from './pages/Map'
import OnboardingPage from './pages/OnboardingPage'
import PlaceDetail from './pages/PlaceDetail'
import PostItEditor from './pages/PostItEditor'
import SignupPage from './pages/SignupPage'
import SplashPage from './pages/SplashPage'

function RequireAuth({ children }) {
  const location = useLocation()

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/map" element={<Map />} />
        </Route>

        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="/board/:id">
          <Route index element={<BoardDetail />} />
          <Route
            path="postit"
            element={
              <RequireAuth>
                <PostItEditor />
              </RequireAuth>
            }
          />
        </Route>

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
