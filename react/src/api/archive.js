import { apiClient, pathSegment } from './client'

export function fetchMyTraces() {
  return apiClient.get('/api/me/traces')
}

export function fetchMyTrace(traceId) {
  return apiClient.get(`/api/me/traces/${pathSegment(traceId)}`)
}

export function fetchArchiveCalendar({ year, month } = {}) {
  return apiClient.get('/api/me/archive/calendar', { year, month })
}

export function fetchArchiveBoards() {
  return apiClient.get('/api/me/archive/boards')
}

export function fetchReceivedLikeTraces() {
  return apiClient.get('/api/me/received-likes')
}
