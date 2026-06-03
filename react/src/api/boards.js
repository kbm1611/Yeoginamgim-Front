import { apiClient, pathSegment } from './client'

export function fetchBoardByKakaoPlaceId(kakaoPlaceId) {
  return apiClient.get(`/api/places/${pathSegment(kakaoPlaceId)}/board`)
}

export function fetchBoardDetail(boardId) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}`)
}

export function createBoard(boardRequest) {
  return apiClient.post('/api/boards', boardRequest)
}
