import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import loginImage from '../assets/login.png'
import '../css/login.css'

const loginButtons = [
  'google',
  'kakao',
  'email',
  'login',
  'signup',
]

function LoginPage() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/main')
  }

  return (
    <motion.main
      className="app-device login-page"
      initial={{ opacity: 0, x: 18, scale: 1.01 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -18, scale: 1.01 }}
      transition={{ duration: 0.72, ease: 'easeInOut' }}
    >
      <img className="screen-bg" src={loginImage} alt="" />
      {loginButtons.map((button) => (
        <button
          key={button}
          type="button"
          className={`login-hit-area ${button}`}
          onClick={handleClick}
          aria-label={button}
        />
      ))}
    </motion.main>
  )
}

export default LoginPage
