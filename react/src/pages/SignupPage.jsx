import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { signupUser } from '../api/users'
import '../css/signup.css'

const initialForm = {
  email: '',
  password: '',
  nickname: '',
}

const signupErrorMessages = [
  ['email is required', '이메일을 입력해주세요.'],
  ['email must be valid', '올바른 이메일 형식으로 입력해주세요.'],
  ['email must be 255', '이메일은 255자 이하로 입력해주세요.'],
  ['password is required', '비밀번호를 입력해주세요.'],
  ['password must be between', '비밀번호는 8자 이상 255자 이하로 입력해주세요.'],
  ['nickname is required', '닉네임을 입력해주세요.'],
  ['nickname must be 255', '닉네임은 255자 이하로 입력해주세요.'],
  ['duplicate', '이미 사용 중인 이메일입니다.'],
  ['already', '이미 사용 중인 이메일입니다.'],
]

function getFriendlySignupError(error) {
  const message = String(error?.message ?? '').trim()
  const normalized = message.toLowerCase()
  const matched = signupErrorMessages.find(([key]) => normalized.includes(key))

  if (matched) return matched[1]
  if (error?.status === 409) return '이미 사용 중인 이메일입니다.'
  if (error?.status >= 500) return '서버에 문제가 생겼습니다. 잠시 후 다시 시도해주세요.'
  if (message) return message

  return '회원가입에 실패했습니다. 입력한 정보를 다시 확인해주세요.'
}

function SignupPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!form.email.trim()) return '이메일을 입력해주세요.'
    if (!form.email.includes('@')) return '올바른 이메일 형식으로 입력해주세요.'
    if (form.password.length < 8) return '비밀번호는 8자 이상 입력해주세요.'
    if (!form.nickname.trim()) return '닉네임을 입력해주세요.'
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

    const signupData = new FormData()
    const email = form.email.trim()
    signupData.append('email', email)
    signupData.append('password', form.password)
    signupData.append('nickname', form.nickname.trim())

    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      await signupUser(signupData)
      const message = '회원가입이 완료되었습니다. 로그인해주세요.'
      setSuccess(message)
      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { signupEmail: email, message },
        })
      }, 500)
    } catch (signupError) {
      setError(getFriendlySignupError(signupError))
      setIsSubmitting(false)
    }
  }

  return (
    <motion.main
      className="app-device signup-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <section className="signup-panel">
        <Link className="signup-back-link" to="/login" aria-label="로그인으로 돌아가기">
          로그인으로 돌아가기
        </Link>

        <div className="signup-copy">
          <p>여기남김 시작하기</p>
          <h1>기억을 남길 계정을 만들어요</h1>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="signup-field">
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

          <label className="signup-field">
            <span>비밀번호</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={form.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <label className="signup-field">
            <span>닉네임</span>
            <input
              name="nickname"
              type="text"
              autoComplete="nickname"
              placeholder="남길 이름"
              value={form.nickname}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <div className="signup-status" aria-live="polite">
            {success && <p className="signup-success">{success}</p>}
            {error && <p className="signup-error">{error}</p>}
          </div>

          <motion.button
            type="submit"
            className="signup-submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.988 }}
            transition={{ duration: 0.12 }}
          >
            {isSubmitting ? '가입 중...' : '회원가입'}
          </motion.button>
        </form>
      </section>
    </motion.main>
  )
}

export default SignupPage
