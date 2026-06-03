export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
export const AUTH_TOKEN_STORAGE_KEY = 'yeoginamgim.authToken'

// Api 에러 표준 클래스
export class ApiError extends Error {
  constructor({ status, message, body, url, path }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.url = url
    this.path = path
  }
}

// localStorage에서 토큰 가져오기
export function getAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

// localStorage에 토큰 저장
export function setAuthToken(token) {
  if (!token) return

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

// 토큰 비우기(로그아웃)
export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

// api url 생성, undefined, null, 빈문자열 query param은 제외
export function buildApiUrl(path, params = {}) {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (shouldSkipQueryValue(value)) return

    if (Array.isArray(value)) {
      value.filter((item) => !shouldSkipQueryValue(item)).forEach((item) => {
        url.searchParams.append(key, item)
      })
      return
    }

    url.searchParams.set(key, value)
  })

  return url
}

// 다양한 경로를 안전하게 인코딩
export function pathSegment(value) {
  return encodeURIComponent(String(value))
}

// 실제 fetch 실행 핵심 함수, 토큰 자동 첨부, Json/FormData 분기, 에러 처리
async function request(path, { method = 'GET', params, body, headers = {} } = {}) {
  const url = buildApiUrl(path, params)
  const requestHeaders = new Headers(headers)
  const token = getAuthToken()
  let requestBody = body

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  })

  if (response.status === 204) {
    return null
  }

  const parsedBody = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: extractErrorMessage(parsedBody, response),
      body: parsedBody,
      url: url.toString(),
      path,
    })
  }

  return parsedBody
}

// 응답이 Json이면 json() 아니면 text()로 파싱
async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text === '' ? null : text
}

// 실패 응답에서 표시할 메시지 추출
function extractErrorMessage(body, response) {
  if (body && typeof body === 'object') {
    return body.message ?? body.error ?? response.statusText
  }

  if (typeof body === 'string' && body.trim() !== '') {
    return body
  }

  return response.statusText || `Request failed with status ${response.status}`
}

// query param에 넣지 않을 값 판별
function shouldSkipQueryValue(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

// get 요청 helper
export function get(path, params, options = {}) {
  return request(path, { ...options, method: 'GET', params })
}

// post 요청 helper
export function post(path, body, options = {}) {
  return request(path, { ...options, method: 'POST', body })
}

// patch 요청 helper
export function patch(path, body, options = {}) {
  return request(path, { ...options, method: 'PATCH', body })
}

// delete 요청 helper
export function deleteRequest(path, params, options = {}) {
  return request(path, { ...options, method: 'DELETE', params })
}

// multipart/FormData 요청 helper
export function upload(path, formData, options = {}) {
  return request(path, { ...options, method: options.method ?? 'POST', body: formData })
}

// FormData 요청 alias
export function formData(path, formDataBody, options = {}) {
  return upload(path, formDataBody, options)
}

// 위 helper들을 객체로 묶은 export
export const apiClient = {
  get,
  post,
  patch,
  delete: deleteRequest,
  upload,
  formData,
}
