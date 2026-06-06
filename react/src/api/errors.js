export const API_ERROR_MESSAGES = {
  400: '요청 내용을 다시 확인해 주세요.',
  401: '로그인이 필요합니다.',
  403: '권한이 없습니다.',
  404: '데이터를 찾을 수 없습니다.',
  409: '이미 처리된 요청입니다.',
  429: '요청이 많습니다. 잠시 뒤 다시 시도해 주세요.',
  500: '서버 문제가 발생했습니다.',
}

export const NETWORK_ERROR_MESSAGE = '네트워크 연결을 확인해 주세요.'
export const UNKNOWN_API_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'

export function getApiErrorStatus(error) {
  return Number.isInteger(error?.status) ? error.status : null
}

export function isApiErrorStatus(error, status) {
  return getApiErrorStatus(error) === status
}

export function isUnauthorizedApiError(error) {
  return isApiErrorStatus(error, 401)
}

export function isNetworkError(error) {
  return !Number.isInteger(error?.status) && (
    error instanceof TypeError ||
    String(error?.name ?? '').toLowerCase() === 'typeerror' ||
    String(error?.message ?? '').toLowerCase().includes('failed to fetch')
  )
}

export function getServerErrorMessage(error) {
  const body = error?.body

  if (body && typeof body === 'object') {
    const message = firstNonEmptyString(body.message, body.error)
    if (message) return message
  }

  return ''
}

export function getApiErrorMessage(error, {
  fallback = UNKNOWN_API_ERROR_MESSAGE,
  statusMessages = {},
  messageMatchers = [],
  preferServerMessage = true,
} = {}) {
  const status = getApiErrorStatus(error)
  const serverMessage = getServerErrorMessage(error)
  const rawMessage = firstNonEmptyString(error?.message)
  const matchedMessage = getMatchedMessage(error, messageMatchers)

  if (matchedMessage) return matchedMessage
  if (preferServerMessage && serverMessage) return serverMessage
  if (status && statusMessages[status]) return statusMessages[status]
  if (!preferServerMessage && serverMessage) return serverMessage
  if (status && API_ERROR_MESSAGES[status]) return API_ERROR_MESSAGES[status]
  if (status && status >= 500) return API_ERROR_MESSAGES[500]
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE
  if (rawMessage) return rawMessage

  return fallback
}

export function handleUnauthorizedApiError(error, {
  clearToken,
  navigate,
  location,
  redirect = false,
  redirectTo = '/login',
  replace = true,
  state,
} = {}) {
  if (!isUnauthorizedApiError(error)) return false

  clearToken?.()

  if (redirect) {
    navigate?.(redirectTo, {
      replace,
      state: state ?? { from: location },
    })
  }

  return true
}

function getMatchedMessage(error, messageMatchers) {
  if (!Array.isArray(messageMatchers) || messageMatchers.length === 0) return ''

  const body = error?.body && typeof error.body === 'object' ? error.body : {}
  const source = [
    body.code,
    body.message,
    body.error,
    error?.message,
  ]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ')

  if (!source) return ''

  const matched = messageMatchers.find(([matcher]) => {
    if (matcher instanceof RegExp) return matcher.test(source)
    return source.includes(String(matcher ?? '').toLowerCase())
  })

  return matched?.[1] ?? ''
}

function firstNonEmptyString(...values) {
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) ?? ''
}
