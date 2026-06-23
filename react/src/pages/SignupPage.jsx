import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification, verifyEmailVerification } from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import { signupUser } from '../api/users'
import { isEmailVerificationSendSucceeded, isValidSignupEmail } from '../utils/pages/SignupPage.emailVerification'
import '../css/signup.css'

const initialForm = {
  email: '',
  password: '',
  nickname: '',
  birthDate: '',
}

const initialEmailVerification = {
  codeSent: false,
  email: '',
  error: '',
  isSending: false,
  isVerifying: false,
  success: '',
  verified: false,
}

const SIGNUP_SUCCESS_MESSAGE = '회원가입이 완료되었습니다. 로그인해주세요.'
const EMAIL_FORMAT_ERROR_MESSAGE = '올바른 이메일 형식으로 입력해주세요.'
const EMAIL_VERIFICATION_SEND_SUCCESS_MESSAGE = '인증번호를 이메일로 보냈습니다.'
const EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE = '인증번호를 보낼 수 없어요. 이메일 주소를 다시 확인해주세요.'

const signupErrorMessages = [
  ['email is required', '이메일을 입력해주세요.'],
  ['email must be valid', EMAIL_FORMAT_ERROR_MESSAGE],
  ['email must be 255', '이메일은 255자 이하로 입력해주세요.'],
  ['password is required', '비밀번호를 입력해주세요.'],
  ['password must be between', '비밀번호는 8자 이상 255자 이하로 입력해주세요.'],
  ['nickname is required', '닉네임을 입력해주세요.'],
  ['nickname must be 255', '닉네임은 255자 이하로 입력해주세요.'],
  ['birthdate', '생일은 YYMMDD 형식의 6자리 숫자로 입력해주세요.'],
  ['duplicate', '이미 사용 중인 이메일입니다.'],
  ['already', '이미 사용 중인 이메일입니다.'],
]

const verificationErrorMessages = [
  ['email_verification_cooldown', '인증번호 재발송은 잠시 후 다시 시도해주세요.'],
  ['email_verification_expired', '인증번호가 만료되었습니다. 다시 요청해주세요.'],
  ['email_verification_invalid_code', '인증번호가 일치하지 않습니다.'],
  ['email_verification_attempts_exceeded', '인증번호 입력 횟수를 초과했습니다. 다시 요청해주세요.'],
  ['duplicate', '이미 사용 중인 이메일입니다.'],
  ['already', '이미 사용 중인 이메일입니다.'],
]

function getFriendlySignupError(error) {
  return getApiErrorMessage(error, {
    fallback: '회원가입에 실패했습니다. 입력한 정보를 다시 확인해주세요.',
    messageMatchers: signupErrorMessages,
    statusMessages: {
      409: '이미 사용 중인 이메일입니다.',
      500: '서버에 문제가 생겼습니다. 잠시 후 다시 시도해주세요.',
    },
  })
}

function getFriendlyVerificationError(error) {
  return getApiErrorMessage(error, {
    fallback: '이메일 인증을 처리하지 못했습니다. 다시 시도해주세요.',
    messageMatchers: verificationErrorMessages,
    statusMessages: {
      409: '이미 사용 중인 이메일입니다.',
      429: '요청이 많습니다. 잠시 후 다시 시도해주세요.',
      500: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    },
  })
}

function SignupPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [emailVerification, setEmailVerification] = useState(initialEmailVerification)
  const navigate = useNavigate()
  const normalizedEmail = form.email.trim().toLowerCase()
  const isEmailVerified = emailVerification.verified && emailVerification.email === normalizedEmail
  const canShowVerificationCode = emailVerification.codeSent && emailVerification.email === normalizedEmail

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'birthDate' ? onlySixDigits(value) : value
    setForm((current) => ({ ...current, [name]: nextValue }))
    setError('')

    if (name === 'email') {
      setVerificationCode('')
      setEmailVerification(initialEmailVerification)
    }
  }

  const handleVerificationCodeChange = (event) => {
    setVerificationCode(onlySixDigits(event.target.value))
    setEmailVerification((current) => ({
      ...current,
      error: '',
      success: '',
      verified: false,
    }))
  }

  const handleProfileImageChange = (event) => {
    setProfileImageFile(event.target.files?.[0] ?? null)
    setError('')
  }

  const validateEmailForVerification = () => {
    if (!normalizedEmail) return '이메일을 입력해주세요.'
    if (!isValidSignupEmail(normalizedEmail)) return EMAIL_FORMAT_ERROR_MESSAGE
    return ''
  }

  const handleSendVerification = async () => {
    const validationError = validateEmailForVerification()

    if (validationError) {
      setEmailVerification((current) => ({
        ...current,
        codeSent: false,
        error: validationError,
        success: '',
        verified: false,
      }))
      return
    }

    setError('')
    setEmailVerification({
      codeSent: canShowVerificationCode,
      email: normalizedEmail,
      error: '',
      isSending: true,
      isVerifying: false,
      success: '',
      verified: false,
    })

    try {
      const response = await sendEmailVerification(normalizedEmail)
      if (!isEmailVerificationSendSucceeded(response)) {
        setEmailVerification({
          codeSent: false,
          email: normalizedEmail,
          error: EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE,
          isSending: false,
          isVerifying: false,
          success: '',
          verified: false,
        })
        return
      }

      setVerificationCode('')
      setEmailVerification({
        codeSent: true,
        email: normalizedEmail,
        error: '',
        isSending: false,
        isVerifying: false,
        success: EMAIL_VERIFICATION_SEND_SUCCESS_MESSAGE,
        verified: false,
      })
    } catch (verificationError) {
      setEmailVerification({
        codeSent: canShowVerificationCode,
        email: normalizedEmail,
        error: getFriendlyVerificationError(verificationError) || EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE,
        isSending: false,
        isVerifying: false,
        success: '',
        verified: false,
      })
    }
  }

  const handleVerifyEmail = async () => {
    const validationError = validateEmailForVerification()

    if (validationError) {
      setEmailVerification((current) => ({
        ...current,
        error: validationError,
        success: '',
        verified: false,
      }))
      return
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setEmailVerification((current) => ({
        ...current,
        email: normalizedEmail,
        error: '인증번호 6자리를 입력해주세요.',
        success: '',
        verified: false,
      }))
      return
    }

    setError('')
    setEmailVerification((current) => ({
      ...current,
      email: normalizedEmail,
      error: '',
      isSending: false,
      isVerifying: true,
      success: '',
      verified: false,
    }))

    try {
      const response = await verifyEmailVerification(normalizedEmail, verificationCode)
      setEmailVerification({
        codeSent: true,
        email: normalizedEmail,
        error: '',
        isSending: false,
        isVerifying: false,
        success: response?.message || '이메일 인증이 완료되었습니다.',
        verified: response?.verified !== false,
      })
    } catch (verificationError) {
      setEmailVerification({
        codeSent: true,
        email: normalizedEmail,
        error: getFriendlyVerificationError(verificationError),
        isSending: false,
        isVerifying: false,
        success: '',
        verified: false,
      })
    }
  }

  const validateForm = () => {
    if (!form.email.trim()) return '이메일을 입력해주세요.'
    if (!isValidSignupEmail(normalizedEmail)) return EMAIL_FORMAT_ERROR_MESSAGE
    if (!isEmailVerified) return '이메일 인증을 완료해주세요.'
    if (form.password.length < 8) return '비밀번호는 8자 이상 입력해주세요.'
    if (!form.nickname.trim()) return '닉네임을 입력해주세요.'
    if (form.birthDate && !/^\d{6}$/.test(form.birthDate)) {
      return '생일은 YYMMDD 형식의 6자리 숫자로 입력해주세요.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setEmailVerification((current) => ({ ...current, success: '' }))
      setError(validationError)
      return
    }

    const signupData = new FormData()
    const email = normalizedEmail
    signupData.append('email', email)
    signupData.append('password', form.password)
    signupData.append('nickname', form.nickname.trim())
    if (profileImageFile) {
      signupData.append('profileUploadFile', profileImageFile)
    }
    if (form.birthDate) {
      signupData.append('birthDate', form.birthDate)
    }

    setError('')
    setEmailVerification((current) => ({ ...current, success: '' }))
    setIsSubmitting(true)

    try {
      await signupUser(signupData)
      navigate('/login', {
        replace: true,
        state: { signupEmail: email, signupMessage: SIGNUP_SUCCESS_MESSAGE },
      })
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
            <div className="signup-inline-control">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={isSubmitting || emailVerification.isSending || emailVerification.isVerifying}
              />
              <button
                type="button"
                className="signup-secondary-button"
                onClick={handleSendVerification}
                disabled={
                  isSubmitting ||
                  emailVerification.isSending ||
                  emailVerification.isVerifying ||
                  !normalizedEmail ||
                  isEmailVerified
                }
              >
                {emailVerification.isSending ? '발송 중' : canShowVerificationCode ? '인증번호 재발송' : '인증번호 발송'}
              </button>
            </div>
          </label>

          {canShowVerificationCode && (
            <label className="signup-field signup-verification-field">
              <span>인증번호</span>
              <div className="signup-inline-control">
                <input
                  name="verificationCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6자리 숫자"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  disabled={isSubmitting || emailVerification.isSending || emailVerification.isVerifying || isEmailVerified}
                />
                <button
                  type="button"
                  className="signup-secondary-button"
                  onClick={handleVerifyEmail}
                  disabled={
                    isSubmitting ||
                    emailVerification.isSending ||
                    emailVerification.isVerifying ||
                    isEmailVerified ||
                    verificationCode.length !== 6
                  }
                >
                  {emailVerification.isVerifying ? '확인 중' : '인증 확인'}
                </button>
              </div>
            </label>
          )}

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

          <div className="signup-field signup-profile-field">
            <span>프로필 사진</span>
            <input
              id="profileUploadFile"
              className="signup-file-input"
              name="profileUploadFile"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              disabled={isSubmitting}
            />
            <label className="signup-file-selector" htmlFor="profileUploadFile" aria-disabled={isSubmitting}>
              <span className="signup-file-action">프로필 사진 선택</span>
              <span className="signup-file-name">
                {profileImageFile ? `${profileImageFile.name} 선택됨` : '선택하지 않아도 가입할 수 있어요'}
              </span>
            </label>
          </div>

          <label className="signup-field">
            <span>생일</span>
            <input
              name="birthDate"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              maxLength={6}
              placeholder="생년월일 6자리"
              value={form.birthDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <div className="signup-status" aria-live="polite">
            {emailVerification.success && <p className="signup-success">{emailVerification.success}</p>}
            {emailVerification.error && <p className="signup-error">{emailVerification.error}</p>}
            {error && <p className="signup-error">{error}</p>}
          </div>

          <motion.button
            type="submit"
            className="signup-submit"
            disabled={isSubmitting || emailVerification.isSending || emailVerification.isVerifying}
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

function onlySixDigits(value) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export default SignupPage
