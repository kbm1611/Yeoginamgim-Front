import { apiClient, pathSegment } from './client'

export function createCustomBoard(data) {
  return apiClient.post('/api/custom-boards', data)
}

export function getMyCustomBoards() {
  return apiClient.get('/api/custom-boards/my')
}

export function getCustomBoard(boardId) {
  return apiClient.get(`/api/custom-boards/${pathSegment(boardId)}`)
}

export function updateCustomBoard(boardId, data) {
  return apiClient.patch(`/api/custom-boards/${pathSegment(boardId)}`, data)
}

export function deleteCustomBoard(boardId) {
  return apiClient.delete(`/api/custom-boards/${pathSegment(boardId)}`)
}

export function createInviteLink(boardId) {
  return apiClient.post(`/api/custom-boards/${pathSegment(boardId)}/invite`)
}

export function joinCustomBoard(inviteCode) {
  return apiClient.post(`/api/custom-boards/join/${pathSegment(inviteCode)}`)
}

export function getCustomBoardInviteInfo(inviteCode) {
  return apiClient.get(`/api/custom-boards/join/${pathSegment(inviteCode)}`)
}

export function getCustomBoardMembers(boardId) {
  return apiClient.get(`/api/custom-boards/${pathSegment(boardId)}/members`)
}

export function getCustomBoardTraces(boardId) {
  return apiClient.get(`/api/custom-boards/${pathSegment(boardId)}/traces`)
}

export function createCustomBoardTrace(boardId, data) {
  return apiClient.post(`/api/custom-boards/${pathSegment(boardId)}/traces`, data)
}
