const FAILURE_STATUS_VALUES = new Set(['fail', 'failed', 'failure', 'error', 'invalid', 'rejected'])
const SUCCESS_STATUS_VALUES = new Set(['ok', 'success', 'succeeded', 'sent'])

const FAILURE_MESSAGE_PATTERNS = [
  /실패/,
  /오류/,
  /찾을 수 없/,
  /보낼 수 없/,
  /전송할 수 없/,
  /failed?/i,
  /failure/i,
  /error/i,
  /invalid/i,
  /undeliver/i,
  /not\s+found/i,
  /cannot/i,
  /could\s+not/i,
  /domain/i,
]

const SUCCESS_MESSAGE_PATTERNS = [
  /발송되었습니다/,
  /발송됐습니다/,
  /보냈습니다/,
  /전송되었습니다/,
  /sent/i,
  /success/i,
  /succeeded/i,
]

export function isValidSignupEmail(email) {
  const value = String(email ?? '').trim()
  if (!value || value.length > 255) return false
  if (/\s/.test(value)) return false

  const parts = value.split('@')
  if (parts.length !== 2) return false

  const [localPart, domain] = parts
  if (!localPart || !domain || localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false

  const domainLabels = domain.split('.')
  if (domainLabels.some((label) => !/^[a-z0-9-]+$/i.test(label) || label.startsWith('-') || label.endsWith('-'))) {
    return false
  }

  const topLevelDomain = domainLabels.at(-1)
  return topLevelDomain.length >= 2
}

export function isEmailVerificationSendSucceeded(response) {
  if (!response) return false

  if (typeof response === 'string') {
    return isSuccessText(response)
  }

  if (typeof response !== 'object') return false

  if (hasExplicitFailureFlag(response)) return false
  if (hasExplicitSuccessFlag(response)) return true

  const responseText = [
    response.code,
    response.status,
    response.result,
    response.message,
    response.error,
  ].filter(Boolean).join(' ')

  return isSuccessText(responseText)
}

function hasExplicitFailureFlag(response) {
  if (response.success === false || response.sent === false || response.ok === false) return true

  return [response.status, response.result, response.code]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .some((value) => FAILURE_STATUS_VALUES.has(value) || FAILURE_MESSAGE_PATTERNS.some((pattern) => pattern.test(value)))
}

function hasExplicitSuccessFlag(response) {
  if (response.success === true || response.sent === true || response.ok === true) return true

  return [response.status, response.result]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .some((value) => SUCCESS_STATUS_VALUES.has(value))
}

function isSuccessText(value) {
  const text = String(value ?? '').trim()
  if (!text) return false
  if (FAILURE_MESSAGE_PATTERNS.some((pattern) => pattern.test(text))) return false
  return SUCCESS_MESSAGE_PATTERNS.some((pattern) => pattern.test(text))
}
