import { apiClient } from './client'

// 회원가입
export function signupUser(formData) {
  return apiClient.formData('/api/user/signup', formData)
}

// 내 정보 조회
export function fetchMyInfo() {
  return apiClient.get('/api/user/myinfo')
}

// 내 정보 수정
export function updateMyInfo(formData) {
  return apiClient.formData('/api/user/update', formData, { method: 'PATCH' })
}

// 회원 탈퇴
export function deleteMyAccount(payload) {
  return apiClient.delete('/api/user/me', undefined, { body: payload })
}
