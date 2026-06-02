import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import '../css/signup.css'

const initialForm = {
  email: '',
  password: '',
  nickname: '',
}

function SignupPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
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
      setError(validationError)
      return
    }

    const signupData = new FormData()
    signupData.append('email', form.email.trim())
    signupData.append('password', form.password)
    signupData.append('nickname', form.nickname.trim())

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/signup', {
        method: 'POST',
        body: signupData,
      })

      if (!response.ok) {
        throw new Error('signup failed')
      }

      navigate('/login')
    } catch {
      setError('회원가입에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
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
            />
          </label>

          <label className="signup-field">
            <span>닉네임</span>
            <input
              name="nickname"
              type="text"
              autoComplete="nickname"
              placeholder="남겨질 이름"
              value={form.nickname}
              onChange={handleChange}
            />
          </label>

          {error && <p className="signup-error">{error}</p>}

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
