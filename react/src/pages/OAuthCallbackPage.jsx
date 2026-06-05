import { useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../api/auth'

function getFriendlyOAuthError(error) {
  const message = String(error ?? '').trim()
  const normalized = message.toLowerCase()

  if (!message) return '소셜 로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.'
  if (normalized.includes('access_denied') || normalized.includes('consent')) {
    return '소셜 로그인이 취소되었습니다. 다시 시도해주세요.'
  }
  if (message.includes('이미 존재') || normalized.includes('duplicate')) {
    return '이미 가입된 이메일입니다. 기존 로그인 방식으로 로그인해주세요.'
  }
  if (message.includes('탈퇴') || normalized.includes('withdraw')) {
    return '탈퇴 처리된 소셜 계정은 사용할 수 없습니다.'
  }
  if (message.includes('소셜 로그인') || normalized.includes('oauth') || normalized.includes('server_error')) {
    return '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }

  return message
}

function OAuthCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, oauthError } = useMemo(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(location.search)
    return {
      token: hashParams.get('token') ?? queryParams.get('token'),
      oauthError: hashParams.get('error') ?? queryParams.get('error'),
    }
  }, [location.hash, location.search])

  useEffect(() => {
    if (!token) {
      return
    }

    setAuthToken(token)
    navigate('/home', { replace: true })
  }, [navigate, token])

  const error = token ? '' : getFriendlyOAuthError(oauthError)

  return (
    <main className="app-device flex items-center justify-center bg-[#F7F2EA] px-6 text-center text-[#3b2a21]">
      <section>
        {!error ? (
          <>
            <Loader2 className="mx-auto animate-spin text-[#7a4218]" size={30} />
            <p className="mt-4 text-[16px] font-bold">로그인 중입니다</p>
          </>
        ) : (
          <>
            <p className="text-[17px] font-bold">{error}</p>
            <Link
              to="/login"
              replace
              className="mt-5 inline-flex rounded-full bg-[#7a4218] px-5 py-3 text-[14px] font-bold text-white"
            >
              로그인으로 돌아가기
            </Link>
          </>
        )}
      </section>
    </main>
  )
}

export default OAuthCallbackPage
