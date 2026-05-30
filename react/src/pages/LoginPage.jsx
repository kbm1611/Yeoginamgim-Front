import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import loginBgImage from '../assets/auth/login-bg.png'
import '../css/login.css'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="svg-icon google">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.29h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.18 3.56-8.64z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3A7.18 7.18 0 0 1 12 19.27a7.2 7.2 0 0 1-6.76-4.98H1.24v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.24 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.24a12 12 0 0 0 0 10.76l4-3.09z" />
      <path fill="#EA4335" d="M12 4.73c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.45 11.45 0 0 0 12 0 12 12 0 0 0 1.24 6.62l4 3.09A7.2 7.2 0 0 1 12 4.73z" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="svg-icon kakao">
      <circle cx="12" cy="12" r="10.5" fill="#2F2218" />
      <path fill="#FEE500" d="M12 6.8c-3.12 0-5.65 1.95-5.65 4.35 0 1.52 1 2.84 2.51 3.61l-.64 2.3c-.06.21.19.38.38.26l2.79-1.86c.2.02.41.03.61.03 3.12 0 5.65-1.95 5.65-4.36S15.12 6.8 12 6.8z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="svg-icon email">
      <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.6 7.2 12 12.6l7.4-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const providers = [
  { key: 'kakao', label: '카카오로 로그인', icon: KakaoIcon },
  { key: 'google', label: '구글로 로그인', icon: GoogleIcon },
  { key: 'email', label: '이메일로 로그인', icon: EmailIcon },
]

function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/home')
  }

  return (
    <motion.main
      className="app-device login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <img className="screen-bg" src={loginBgImage} alt="" />
      <motion.section
        className="login-sheet"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        <p className="sheet-caption">로그인 방법을 선택해주세요</p>

        <div className="login-methods">
          {providers.map((provider) => {
            const Icon = provider.icon
            return (
              <motion.button
                key={provider.key}
                type="button"
                className={`login-method ${provider.key}`}
                whileTap={{ scale: 0.988 }}
                transition={{ duration: 0.12 }}
                onClick={handleLogin}
              >
                <span className="method-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="method-label">{provider.label}</span>
              </motion.button>
            )
          })}
        </div>

        <p className="sheet-agreement">
          로그인하면 서비스 이용약관 및 개인정보처리방침에
          <br />
          동의한 것으로 간주됩니다.
        </p>
      </motion.section>
    </motion.main>
  )
}

export default LoginPage
