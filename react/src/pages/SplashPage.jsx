import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getAuthToken } from '../api/client'
import { ONBOARDING_SEEN_STORAGE_KEY } from './OnboardingPage'
import splend from '../assets/splend.png'

function hasSeenOnboarding() {
  try {
    return window.localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasSeenOnboarding()) {
        navigate('/onboarding', { replace: true })
        return
      }

      navigate(getAuthToken() ? '/home' : '/login', { replace: true })
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <motion.main
      className="app-device"
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.025 }}
      transition={{ duration: 0.72, ease: 'easeInOut' }}
    >
      <motion.img
        className="screen-bg"
        src={splend}
        alt=""
        initial={{ opacity: 0, scale: 1.035 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.82, ease: 'easeInOut' }}
      />
    </motion.main>
  )
}

export default SplashPage
