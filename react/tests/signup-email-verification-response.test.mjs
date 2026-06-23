import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const helpers = await import(pathToFileURL(join(root, 'src/utils/pages/SignupPage.emailVerification.js')).href)

test('signup email format requires a domain suffix', () => {
  assert.equal(helpers.isValidSignupEmail('user@example.com'), true)
  assert.equal(helpers.isValidSignupEmail('USER@EXAMPLE.CO.KR'), true)
  assert.equal(helpers.isValidSignupEmail('kang8250696@gmail.com222'), true)
  assert.equal(helpers.isValidSignupEmail('2221@11'), false)
  assert.equal(helpers.isValidSignupEmail('not-an-email'), false)
  assert.equal(helpers.isValidSignupEmail('user@example'), false)
})

test('email verification send succeeds only when the response confirms delivery', () => {
  assert.equal(helpers.isEmailVerificationSendSucceeded({ success: true }), true)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ sent: true }), true)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ status: 'SENT' }), true)
})

test('email verification send treats 200 failure bodies as failed delivery', () => {
  assert.equal(helpers.isEmailVerificationSendSucceeded({ success: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ sent: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ status: 'FAILED' }), false)
  assert.equal(
    helpers.isEmailVerificationSendSucceeded({
      code: 'EMAIL_VERIFICATION_MAIL_ERROR',
      message: 'Email verification mail failed.',
    }),
    false,
  )
})

test('email verification send does not assume an ambiguous 200 body is success', () => {
  assert.equal(helpers.isEmailVerificationSendSucceeded(null), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({}), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ verified: false }), false)
  assert.equal(helpers.isEmailVerificationSendSucceeded({ message: 'Request was processed.' }), false)
})
