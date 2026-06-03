import { apiClient, pathSegment } from './client'

export function fetchBoardTraces(boardId, { sort, limit, before } = {}) {
  return apiClient.get(`/api/boards/${pathSegment(boardId)}/traces`, { sort, limit, before })
}

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

export function createTrace(boardId, traceRequest) {
  return apiClient.post(`/api/boards/${pathSegment(boardId)}/traces`, traceRequest)
}

export function fetchTrace(traceId) {
  return apiClient.get(`/api/traces/${pathSegment(traceId)}`)
}

export function uploadTraceImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.upload('/api/traces/images', formData)
}

export function updateTrace(traceId, traceRequest) {
  return apiClient.patch(`/api/traces/${pathSegment(traceId)}`, traceRequest)
}

export function deleteTrace(traceId) {
  return apiClient.delete(`/api/traces/${pathSegment(traceId)}`)
}

export function addTraceLike(traceId) {
  return apiClient.post(`/api/traces/${pathSegment(traceId)}/likes`)
}

export function removeTraceLike(traceId) {
  return apiClient.delete(`/api/traces/${pathSegment(traceId)}/likes`)
}
