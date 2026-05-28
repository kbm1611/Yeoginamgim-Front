import { motion } from 'framer-motion'
import onboarding3 from '../assets/onboarding/onbording3.png'

function MainPage() {
  return (
    <motion.main
      className="app-device main-page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.65, ease: 'easeInOut' }}
    >
      <img className="screen-bg" src={onboarding3} alt="" />
    </motion.main>
  )
}

export default MainPage
