import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, redirectToGoogleOAuth, redirectToKakaoOAuth } from '../api/auth'
import loginBgImage from '../assets/auth/login-bg.png'
import '../css/login.css'

const initialForm = {
  email: '',
  password: '',
}

const loginErrorMessages = [
  ['email is required', '이메일을 입력해주세요.'],
  ['email must be valid', '올바른 이메일 형식으로 입력해주세요.'],
  ['password is required', '비밀번호를 입력해주세요.'],
  ['password', '이메일 또는 비밀번호가 일치하지 않습니다.'],
  ['login failed', '이메일 또는 비밀번호가 일치하지 않습니다.'],
]

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

function getFriendlyLoginError(error) {
  const message = String(error?.message ?? '').trim()
  const normalized = message.toLowerCase()
  const matched = loginErrorMessages.find(([key]) => normalized.includes(key))

  if (matched) return matched[1]
  if (error?.status === 401) return '이메일 또는 비밀번호가 일치하지 않습니다.'
  if (error?.status >= 500) return '서버에 문제가 생겼습니다. 잠시 후 다시 시도해주세요.'
  if (message) return message

  return '로그인에 실패했습니다. 입력한 정보를 다시 확인해주세요.'
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const intendedPath = location.state?.from?.pathname ?? '/home'
  const signupEmail = location.state?.signupEmail ?? ''
  const signupMessage = location.state?.message ?? ''
  const [form, setForm] = useState(() => ({ ...initialForm, email: signupEmail }))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!form.email.trim()) return '이메일을 입력해주세요.'
    if (!form.email.includes('@')) return '올바른 이메일 형식으로 입력해주세요.'
    if (!form.password) return '비밀번호를 입력해주세요.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setSuccess('')
      setError(validationError)
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })
      setSuccess('로그인되었습니다.')
      navigate(intendedPath, { replace: true })
    } catch (loginError) {
      setError(getFriendlyLoginError(loginError))
    } finally {
      setIsSubmitting(false)
    }
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
        <p className="sheet-caption">다시 남기러 가볼까요</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>이메일</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <label className="login-field">
            <span>비밀번호</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <div className="login-status" aria-live="polite">
            {(success || signupMessage) && <p className="login-success">{success || signupMessage}</p>}
            {error && <p className="login-error">{error}</p>}
          </div>

          <motion.button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.988 }}
            transition={{ duration: 0.12 }}
          >
            {isSubmitting ? '로그인 중...' : '이메일로 로그인'}
          </motion.button>
        </form>

        <div className="login-divider" aria-hidden="true">
          <span />
          <b>또는</b>
          <span />
        </div>

        <div className="login-methods">
          <motion.button
            type="button"
            className="login-method kakao"
            whileTap={{ scale: 0.988 }}
            transition={{ duration: 0.12 }}
            onClick={redirectToKakaoOAuth}
            disabled={isSubmitting}
          >
            <span className="method-icon" aria-hidden="true">
              <KakaoIcon />
            </span>
            <span className="method-label">카카오로 계속하기</span>
          </motion.button>

          <motion.button
            type="button"
            className="login-method google"
            whileTap={{ scale: 0.988 }}
            transition={{ duration: 0.12 }}
            onClick={redirectToGoogleOAuth}
            disabled={isSubmitting}
          >
            <span className="method-icon" aria-hidden="true">
              <GoogleIcon />
            </span>
            <span className="method-label">구글로 계속하기</span>
          </motion.button>
        </div>

        <p className="signup-prompt">
          아직 계정이 없나요?{' '}
          <Link className="signup-link" to="/signup">
            회원가입
          </Link>
        </p>
      </motion.section>
    </motion.main>
  )
}

export default LoginPage
