import { apiClient, pathSegment } from './client'

// 보드 조회
export function fetchBoardByKakaoPlaceId(kakaoPlaceId) {
  return apiClient.get(`/api/places/${pathSegment(kakaoPlaceId)}/board`)
}

// 보드 상세 조회
export function fetchBoardDetail(boardId) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}`)
}

// 보드 생성 요청
export function createBoard(boardRequest) {
  return apiClient.post('/api/boards', boardRequest)
}
