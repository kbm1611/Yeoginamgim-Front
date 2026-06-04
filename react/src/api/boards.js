import { apiClient, pathSegment } from './client'
import {
  buildBoardRequestFromPlace,
  normalizeBoardDetail,
  resolveBoardDetailForRouteId,
  resolveBoardForPlace,
} from './boards.utils'

export { buildBoardRequestFromPlace }

// 보드 조회
export function fetchBoardByKakaoPlaceId(kakaoPlaceId) {
  return apiClient.get(`/api/places/${pathSegment(kakaoPlaceId)}/board`).then(normalizeBoardDetail)
}

// 보드 상세 조회
export function fetchBoardDetail(boardId) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}`).then(normalizeBoardDetail)
}

// 보드 생성 요청
export function createBoard(boardRequest) {
  return apiClient.post('/api/boards', boardRequest).then(normalizeBoardDetail)
}

export function fetchOrCreateBoardForPlace(place) {
  return resolveBoardForPlace(place, {
    fetchBoardByKakaoPlaceId,
    createBoard,
  })
}

export function fetchBoardDetailForRouteId(routeId) {
  return resolveBoardDetailForRouteId(routeId, {
    fetchBoardDetail,
    fetchBoardByKakaoPlaceId,
  })
}
