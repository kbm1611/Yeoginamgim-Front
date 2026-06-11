import { apiClient, pathSegment } from './client'

export function fetchNotifications() {
  return apiClient.get('/api/notifications')
}

export function fetchUnreadNotificationCount() {
  return apiClient.get('/api/notifications/unread-count')
}

export function markNotificationAsRead(notificationId) {
  return apiClient.patch(`/api/notifications/${pathSegment(notificationId)}/read`)
}

export function markAllNotificationsAsRead() {
  return apiClient.patch('/api/notifications/read-all')
}
