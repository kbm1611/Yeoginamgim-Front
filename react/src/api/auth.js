import { apiClient, buildApiUrl, clearAuthToken, setAuthToken } from './client'

export async function login(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials)

  if (response?.token) {
    setAuthToken(response.token)
  }

  return response
}

export async function logout() {
  const response = await apiClient.get('/api/auth/logout')
  clearAuthToken()
  return response
}

export function getKakaoOAuthUrl() {
  return buildApiUrl('/api/auth/oauth/kakao').toString()
}

export function getGoogleOAuthUrl() {
  return buildApiUrl('/api/auth/oauth/google').toString()
}

export function redirectToKakaoOAuth() {
  window.location.assign(getKakaoOAuthUrl())
}

export function redirectToGoogleOAuth() {
  window.location.assign(getGoogleOAuthUrl())
}

export { clearAuthToken, setAuthToken }
