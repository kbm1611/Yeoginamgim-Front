import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import onboarding1 from '../assets/1.png.png'
import onboarding2 from '../assets/2.png.png'
import onboarding3 from '../assets/3.png.png'
import onboarding4 from '../assets/4.png.png'
import '../css/onboarding.css'

const slides = [onboarding1, onboarding2, onboarding3, onboarding4]
const transition = { duration: 0.62, ease: 'easeInOut' }

function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(null)
  const didSwipe = useRef(false)
  const navigate = useNavigate()
  const isLast = currentIndex === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate('/login')
      return
    }

    setCurrentIndex((index) => index + 1)
  }

  const handleTapAdvance = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }

    handleNext()
  }

  const handlePointerDown = (event) => {
    touchStartX.current = event.clientX
    didSwipe.current = false
  }

  const handlePointerUp = (event) => {
    if (touchStartX.current === null) {
      return
    }

    const deltaX = event.clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(deltaX) > 36) {
      didSwipe.current = true
      handleNext()
    }
  }

  return (
    <motion.main
      className="app-device onboarding-page"
      onClick={handleTapAdvance}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      initial={{ opacity: 0, x: 18, scale: 1.01 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -18, scale: 1.01 }}
      transition={transition}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          className="screen-bg"
          src={slides[currentIndex]}
          alt=""
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={transition}
        />
      </AnimatePresence>

      <div className="onboarding-indicator" aria-label="onboarding progress">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`onboarding-dot${idx === currentIndex ? ' is-active' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </motion.main>
  )
}

export default OnboardingPage
