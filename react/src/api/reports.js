import { apiClient, pathSegment } from './client'

export function createTraceReport(traceId, reportRequest) {
  return apiClient.post(`/api/traces/${pathSegment(traceId)}/reports`, reportRequest)
}
