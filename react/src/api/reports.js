import { apiClient, pathSegment } from './client'

// 특정 흔적 신고 생성
export function createTraceReport(traceId, reportRequest) {
  return apiClient.post(`/api/traces/${pathSegment(traceId)}/reports`, reportRequest)
}
