import { apiClient, buildApiUrl, clearAuthToken, setAuthToken } from './client'

// 로그인
export async function login(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials)

  if (response?.token) {
    setAuthToken(response.token)
  }

  return response
}

// 로그아웃
export async function logout() {
  const response = await apiClient.get('/api/auth/logout')
  clearAuthToken()
  return response
}

// 백엔드 Kakao OAuth 시작 URL 생성
export function getKakaoOAuthUrl() {
  return buildApiUrl('/api/auth/oauth/kakao').toString()
}

// 백엔드 Google OAuth 시작 URL 생성
export function getGoogleOAuthUrl() {
  return buildApiUrl('/api/auth/oauth/google').toString()
}

// Kakao OAuth URL로 브라우저 이동
export function redirectToKakaoOAuth() {
  window.location.assign(getKakaoOAuthUrl())
}

// Google OAuth URL로 브라우저 이동
export function redirectToGoogleOAuth() {
  window.location.assign(getGoogleOAuthUrl())
}

// client의 토큰 helper 재 export
export { clearAuthToken, setAuthToken }
