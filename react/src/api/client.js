export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
export const AUTH_TOKEN_STORAGE_KEY = 'yeoginamgim.authToken'

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

export function getAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  if (!token) return

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

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

export function pathSegment(value) {
  return encodeURIComponent(String(value))
}

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

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text === '' ? null : text
}

function extractErrorMessage(body, response) {
  if (body && typeof body === 'object') {
    return body.message ?? body.error ?? response.statusText
  }

  if (typeof body === 'string' && body.trim() !== '') {
    return body
  }

  return response.statusText || `Request failed with status ${response.status}`
}

function shouldSkipQueryValue(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

export function get(path, params, options = {}) {
  return request(path, { ...options, method: 'GET', params })
}

export function post(path, body, options = {}) {
  return request(path, { ...options, method: 'POST', body })
}

export function patch(path, body, options = {}) {
  return request(path, { ...options, method: 'PATCH', body })
}

export function deleteRequest(path, params, options = {}) {
  return request(path, { ...options, method: 'DELETE', params })
}

export function upload(path, formData, options = {}) {
  return request(path, { ...options, method: options.method ?? 'POST', body: formData })
}

export function formData(path, formDataBody, options = {}) {
  return upload(path, formDataBody, options)
}

export const apiClient = {
  get,
  post,
  patch,
  delete: deleteRequest,
  upload,
  formData,
}
