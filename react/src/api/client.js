export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
export const DEFAULT_API_TIMEOUT_MS = 15000
export const API_TIMEOUT_ERROR_MESSAGE = '요청 시간이 초과되었습니다. 서버 상태를 확인한 뒤 다시 시도해주세요.'
export const AUTH_TOKEN_STORAGE_KEY = 'yeoginamgim.authToken'
export const AUTH_TOKEN_STORAGE_ERROR_MESSAGE =
  '\ube0c\ub77c\uc6b0\uc800 \uc800\uc7a5\uc18c\ub97c \uc0ac\uc6a9\ud560 \uc218 \uc5c6\uc5b4 \ub85c\uadf8\uc778\uc744 \uc644\ub8cc\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. \uc2dc\ud06c\ub9bf \ubaa8\ub4dc\ub098 \uc800\uc7a5\uc18c \ucc28\ub2e8 \uc124\uc815\uc744 \ud574\uc81c\ud55c \ub4a4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.'

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
  const localToken = readStorageToken(() => window.localStorage)
  if (localToken) return localToken

  return readStorageToken(() => window.sessionStorage)
}

function readStorageToken(getStorage) {
  try {
    const storage = getStorage()
    return storage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

// localStorage에 토큰 저장
export function setAuthToken(token) {
  if (!token) return false

  if (writeStorageToken(() => window.localStorage, token)) {
    removeStorageToken(() => window.sessionStorage)
    return true
  }

  return writeStorageToken(() => window.sessionStorage, token)
}

function writeStorageToken(getStorage, token) {
  try {
    const storage = getStorage()
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    return true
  } catch {
    return false
  }
}

function removeStorageToken(getStorage) {
  try {
    const storage = getStorage()
    storage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

// 토큰 비우기(로그아웃)
export function clearAuthToken() {
  removeStorageToken(() => window.localStorage)
  removeStorageToken(() => window.sessionStorage)

  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_TOKEN_STORAGE_KEY}=; Max-Age=0; path=/`
  }
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
async function request(
  path,
  { method = 'GET', params, body, headers = {}, timeoutMs = DEFAULT_API_TIMEOUT_MS } = {}
) {
  const url = buildApiUrl(path, params)
  const requestHeaders = new Headers(headers)
  const token = getAuthToken()
  let requestBody = body
  const abortController = new AbortController()
  const timeoutId = timeoutMs > 0
    ? setTimeout(() => {
      abortController.abort()
    }, timeoutMs)
    : null

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
    requestBody = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: abortController.signal,
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
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError({
        status: 0,
        message: API_TIMEOUT_ERROR_MESSAGE,
        body: null,
        url: url.toString(),
        path,
      })
    }

    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
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
