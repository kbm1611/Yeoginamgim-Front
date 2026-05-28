import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import splend from '../assets/splend.png'

function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding', { replace: true })
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
