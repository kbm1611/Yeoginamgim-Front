import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import onboardingStart from '../assets/onbording-start.png'
import onboarding1 from '../assets/onbording1.png'
import onboarding2 from '../assets/onbording2.png'
import onboarding3 from '../assets/onbording3.png'
import '../css/onboarding.css'

const slides = [onboardingStart, onboarding1, onboarding2, onboarding3]
const transition = { duration: 0.72, ease: 'easeInOut' }

function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()
  const isIntro = currentIndex === 0
  const isLast = currentIndex === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate('/login')
      return
    }

    setCurrentIndex((index) => index + 1)
  }

  const handleSkip = () => {
    setCurrentIndex(slides.length - 1)
  }

  return (
    <motion.main
      className="app-device onboarding-page"
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
          initial={{ opacity: 0, x: 18, scale: 1.018 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -18, scale: 0.992 }}
          transition={transition}
        />
      </AnimatePresence>
      {isIntro ? (
        <button
          type="button"
          className="reference-start-hit-area"
          onClick={handleNext}
          aria-label="next"
        />
      ) : (
        <>
          <button
            type="button"
            className="reference-skip-hit-area"
            onClick={handleSkip}
            aria-label="skip"
          />
          <button
            type="button"
            className="reference-next-hit-area"
            onClick={handleNext}
            aria-label="next"
          />
        </>
      )}
    </motion.main>
  )
}

export default OnboardingPage
