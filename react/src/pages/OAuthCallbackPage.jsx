import { useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../api/auth'

function OAuthCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = useMemo(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(location.search)
    return hashParams.get('token') ?? queryParams.get('token')
  }, [location.hash, location.search])

  useEffect(() => {
    if (!token) {
      return
    }

    setAuthToken(token)
    navigate('/home', { replace: true })
  }, [navigate, token])

  const error = token ? '' : '소셜 로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.'

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
