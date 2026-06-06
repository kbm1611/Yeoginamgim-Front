import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getApiErrorMessage,
  getApiErrorStatus,
  handleUnauthorizedApiError,
  isApiErrorStatus,
  isUnauthorizedApiError,
} from './errors.js'

test('isApiErrorStatus and getApiErrorStatus read numeric API status codes', () => {
  const error = { status: 403 }

  assert.equal(getApiErrorStatus(error), 403)
  assert.equal(isApiErrorStatus(error, 403), true)
  assert.equal(isApiErrorStatus(error, 401), false)
  assert.equal(getApiErrorStatus({ status: '403' }), null)
})

test('getApiErrorMessage prefers server body message before status defaults', () => {
  const message = getApiErrorMessage({
    status: 409,
    message: 'Conflict',
    body: { message: '이미 처리된 요청입니다.' },
  })

  assert.equal(message, '이미 처리된 요청입니다.')
})

test('getApiErrorMessage supports screen status overrides when server message is absent', () => {
  const message = getApiErrorMessage(
    { status: 404, message: 'Not Found', body: {} },
    {
      statusMessages: {
        404: '장소 정보를 찾을 수 없습니다.',
      },
    },
  )

  assert.equal(message, '장소 정보를 찾을 수 없습니다.')
})

test('getApiErrorMessage returns a network message for fetch failures without status', () => {
  const message = getApiErrorMessage(new TypeError('Failed to fetch'))

  assert.equal(message, '네트워크 연결을 확인해 주세요.')
})

test('getApiErrorMessage uses the map-wide default status messages', () => {
  assert.equal(getApiErrorMessage({ status: 401, body: {} }), '로그인이 필요합니다.')
  assert.equal(getApiErrorMessage({ status: 403, body: {} }), '권한이 없습니다.')
  assert.equal(getApiErrorMessage({ status: 404, body: {} }), '데이터를 찾을 수 없습니다.')
  assert.equal(getApiErrorMessage({ status: 409, body: {} }), '이미 처리된 요청입니다.')
  assert.equal(getApiErrorMessage({ status: 500, body: {} }), '서버 문제가 발생했습니다.')
})

test('handleUnauthorizedApiError clears auth and redirects only when requested', () => {
  const calls = []
  const location = { pathname: '/archive' }
  const error = { status: 401 }

  assert.equal(isUnauthorizedApiError(error), true)
  assert.equal(
    handleUnauthorizedApiError(error, {
      clearToken: () => calls.push(['clearToken']),
      navigate: (...args) => calls.push(['navigate', ...args]),
      location,
    }),
    true,
  )
  assert.deepEqual(calls, [['clearToken']])

  calls.length = 0

  assert.equal(
    handleUnauthorizedApiError(error, {
      clearToken: () => calls.push(['clearToken']),
      navigate: (...args) => calls.push(['navigate', ...args]),
      location,
      redirect: true,
    }),
    true,
  )
  assert.deepEqual(calls, [
    ['clearToken'],
    ['navigate', '/login', { replace: true, state: { from: location } }],
  ])
})
