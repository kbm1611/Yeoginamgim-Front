import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const helpers = await import(pathToFileURL(join(root, 'src/pages/SignupPage.emailVerification.js')).href)

test('signup email format requires a domain suffix', () => {
  assert.equal(helpers.isValidSignupEmail('user@example.com'), true)
  assert.equal(helpers.isValidSignupEmail('USER@EXAMPLE.CO.KR'), true)
  assert.equal(helpers.isValidSignupEmail('kang8250696@gmail.com222'), true)
  assert.equal(helpers.isValidSignupEmail('2221@11'), false)
  assert.equal(helpers.isValidSignupEmail('not-an-email'), false)
  assert.equal(helpers.isValidSignupEmail('user@example'), false)
})

test('email verification send succeeds only when the response confirms delivery', () => {
  assert.equal(
    helpers.isEmailVerificationSendSucceeded({ message: '인증번호가 이메일로 발송되었습니다.', verified: false }),
    true,
  )
  assert.equal(helpers.isEmailVerificationSendSucceeded({ success: true }), true)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ sent: true }), true)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ status: 'SENT' }), true)
})

test('email verification send treats 200 failure bodies as failed delivery', () => {
  assert.equal(helpers.isEmailVerificationSendSucceeded({ success: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ sent: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ status: 'FAILED' }), false)
  assert.equal(
    helpers.isEmailVerificationSendSucceeded({ code: 'EMAIL_VERIFICATION_MAIL_ERROR', message: '이메일 인증번호 발송에 실패했습니다.' }),
    false,
  )
  assert.equal(
    helpers.isEmailVerificationSendSucceeded({ message: '도메인을 찾을 수 없어 메일 전송에 실패했습니다.' }),
    false,
  )
})

test('email verification send does not assume an ambiguous 200 body is success', () => {
  assert.equal(helpers.isEmailVerificationSendSucceeded(null), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({}), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ verified: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ message: '요청을 처리했습니다.' }), false)
})
