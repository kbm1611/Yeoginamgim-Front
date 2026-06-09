import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getAuthToken } from './api/client'
import MainLayout from './layouts/MainLayout'
import ArchivePage from './pages/ArchivePage'
import BoardDetail from './pages/BoardDetail'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Map from './pages/Map'
import MyPage from './pages/MyPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import OnboardingPage from './pages/OnboardingPage'
import PlaceDetail from './pages/PlaceDetail'
import PostItEditor from './pages/PostItEditor'
import TraceDetail from './pages/TraceDetail'
import SignupPage from './pages/SignupPage'
import SplashPage from './pages/SplashPage'
import MemoryBoardCreatePage from './pages/MemoryBoardCreatePage'
import MemoryBoardSuccessPage from './pages/MemoryBoardSuccessPage'
import InviteBoardPage from './pages/InviteBoardPage'

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
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/map" element={<Map />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/my" element={<MyPage />} />
        </Route>

        <Route path="/record/new" element={<RequireAuth><MemoryBoardCreatePage /></RequireAuth>} />
        <Route path="/record/success" element={<RequireAuth><MemoryBoardSuccessPage /></RequireAuth>} />

        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route
          path="/board/join/:inviteCode"
          element={
            <RequireAuth>
              <InviteBoardPage />
            </RequireAuth>
          }
        />
        <Route path="/board/:id">
          <Route index element={<BoardDetail />} />
          <Route
            path="invite"
            element={
              <RequireAuth>
                <InviteBoardPage />
              </RequireAuth>
            }
          />
          <Route
            path="postit"
            element={
              <RequireAuth>
                <PostItEditor />
              </RequireAuth>
            }
          />
          <Route path="trace/:traceId" element={<TraceDetail />} />
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
