import { apiClient, pathSegment } from './client'

// 내 흔적 전체 조회
export function fetchMyTraces() {
  return apiClient.get('/api/me/traces')
}

// 내 특정 흔적 조회
export function fetchMyTrace(traceId) {
  return apiClient.get(`/api/me/traces/${pathSegment(traceId)}`)
}

// 월별 달력 아카이브 조회
export function fetchArchiveCalendar({ year, month } = {}) {
  return apiClient.get('/api/me/archive/calendar', { year, month })
}

// 장소/보드별 아카이브 조회
export function fetchArchiveBoards() {
  return apiClient.get('/api/me/archive/boards')
}

// 내가 받은 좋아요 흔적 조회
export function fetchReceivedLikeTraces() {
  return apiClient.get('/api/me/received-likes')
}

// 내가 즐겨찾기한 장소 목록 조회
export function fetchFavoritePlaces() {
  return apiClient.get('/api/me/archive/favorite-places')
}

// 장소 즐겨찾기 등록
export function addFavoritePlace(kakaoPlaceId, placeRequest = {}) {
  return apiClient.post(`/api/me/archive/favorite-places/${pathSegment(kakaoPlaceId)}`, placeRequest)
}

// 장소 즐겨찾기 취소
export function removeFavoritePlace(kakaoPlaceId) {
  return apiClient.delete(`/api/me/archive/favorite-places/${pathSegment(kakaoPlaceId)}`)
}
