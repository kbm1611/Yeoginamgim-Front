import { apiClient } from './client'

export function signupUser(formData) {
  return apiClient.formData('/api/user/signup', formData)
}

export function fetchMyInfo() {
  return apiClient.get('/api/user/myinfo')
}

export function updateMyInfo(formData) {
  return apiClient.formData('/api/user/update', formData, { method: 'PATCH' })
}
