import {
  AUTH_TOKEN_STORAGE_ERROR_MESSAGE,
  apiClient,
  buildApiUrl,
  clearAuthToken,
  setAuthToken,
} from './client'

export class AuthTokenStorageError extends Error {
  constructor() {
    super(AUTH_TOKEN_STORAGE_ERROR_MESSAGE)
    this.name = 'AuthTokenStorageError'
    this.code = 'AUTH_TOKEN_STORAGE_UNAVAILABLE'
  }
}

// 로그인
export async function login(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials)

  if (response?.token) {
    const saved = setAuthToken(response.token)
    if (!saved) {
      throw new AuthTokenStorageError()
    }
  }

  return response
}

// 로그아웃
export async function logout() {
  const response = await apiClient.get('/api/auth/logout')
  clearAuthToken()
  return response
}

export function sendEmailVerification(email) {
  return apiClient.post('/api/auth/email/send', { email })
}

export function verifyEmailVerification(email, code) {
  return apiClient.post('/api/auth/email/verify', { email, code })
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
export { AUTH_TOKEN_STORAGE_ERROR_MESSAGE, clearAuthToken, setAuthToken }
