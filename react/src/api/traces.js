import { apiClient, pathSegment } from './client'

// 보드의 흔적 목록 조회
export function fetchBoardTraces(boardId, { sort, limit, before } = {}) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}/traces`, { sort, limit, before })
}

// 보드 내 특정 좌표 영역 흔적 조회
export function fetchBoardAreaTraces(
  boardId,
  { minX, maxX, minY, maxY, sort, limit, before } = {}
) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}/traces/area`, {
    minX,
    maxX,
    minY,
    maxY,
    sort,
    limit,
    before,
  })
}

// 흔적 생성, 토큰 자동 첨부
export function createTrace(boardId, traceRequest) {
  return apiClient.post(`/api/boards/${pathSegment(boardId)}/traces`, traceRequest)
}

// 흔적 상세 조회
export function fetchTrace(traceId) {
  return apiClient.get(`/api/traces/${pathSegment(traceId)}`)
}

// 이미지파일 업로더
export function uploadTraceImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.upload('/api/traces/images', formData)
}

// 흔적 수정
export function updateTrace(traceId, traceRequest) {
  return apiClient.patch(`/api/traces/${pathSegment(traceId)}`, traceRequest)
}

// 흔적 삭제
export function deleteTrace(traceId) {
  return apiClient.delete(`/api/traces/${pathSegment(traceId)}`)
}

// 흔적 좋아요 추가
export function addTraceLike(traceId) {
  return apiClient.post(`/api/traces/${pathSegment(traceId)}/likes`)
}

// 흔적 좋아요 취소
export function removeTraceLike(traceId) {
  return apiClient.delete(`/api/traces/${pathSegment(traceId)}/likes`)
}
