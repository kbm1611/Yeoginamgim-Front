import { apiClient, pathSegment } from './client'

export function followUser(userId) {
  return apiClient.post(`/api/users/${pathSegment(userId)}/follow`)
}

export function unfollowUser(userId) {
  return apiClient.delete(`/api/users/${pathSegment(userId)}/follow`)
}

export function fetchFollowers(userId) {
  return apiClient.get(`/api/users/${pathSegment(userId)}/followers`)
}

export function fetchFollowings(userId) {
  return apiClient.get(`/api/users/${pathSegment(userId)}/followings`)
}
