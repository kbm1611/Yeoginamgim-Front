import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const signupPage = readFileSync(join(root, 'src/pages/SignupPage.jsx'), 'utf8')
const sendVerificationBlock = /const handleSendVerification = async \(\) => \{([\s\S]*?)\n  const handleVerifyEmail/.exec(
  signupPage,
)?.[1] ?? ''
const handleChangeBlock = /const handleChange = \(event\) => \{([\s\S]*?)\n  const handleVerificationCodeChange/.exec(
  signupPage,
)?.[1] ?? ''

test('verification code input only renders after email send succeeds', () => {
  assert.match(signupPage, /codeSent:\s*false/)
  assert.match(signupPage, /codeSent:\s*true/)
  assert.match(signupPage, /const EMAIL_VERIFICATION_SEND_SUCCESS_MESSAGE = /)
  assert.match(signupPage, /const canShowVerificationCode = /)
  assert.match(signupPage, /isEmailVerificationSendSucceeded\(response\)/)
  assert.match(sendVerificationBlock, /success:\s*EMAIL_VERIFICATION_SEND_SUCCESS_MESSAGE/)
  assert.doesNotMatch(sendVerificationBlock, /success:\s*response\?\.message \|\|/)
  assert.match(signupPage, /\{canShowVerificationCode && \(/)
  assert.match(signupPage, /name="verificationCode"/)
})

test('unconfirmed send responses delegate failure state handling', () => {
  assert.match(
    sendVerificationBlock,
    /if \(!isEmailVerificationSendSucceeded\(response\)\) \{[\s\S]*codeSent:\s*false[\s\S]*error:\s*EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/,
  )
})

test('failed email send keeps verification code input hidden', () => {
  const catchBlock = /catch(?: \(verificationError\))? \{([\s\S]*?)\n    \}/.exec(sendVerificationBlock)

  assert.ok(catchBlock, 'send verification catch block should exist')
  assert.match(catchBlock[1], /codeSent:\s*false/)
  assert.match(catchBlock[1], /error:\s*EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/)
  assert.doesNotMatch(catchBlock[1], /codeSent:\s*true/)
})

test('email format and send failure messages stay distinct', () => {
  assert.match(signupPage, /const EMAIL_FORMAT_ERROR_MESSAGE = /)
  assert.match(signupPage, /const EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE = /)
  assert.match(signupPage, /isValidSignupEmail\(normalizedEmail\)/)
  assert.doesNotMatch(signupPage, /normalizedEmail\.includes\('@'\)/)
  assert.doesNotMatch(signupPage, /form\.email\.includes\('@'\)/)

  const catchBlock = /catch(?: \(verificationError\))? \{([\s\S]*?)\n    \}/.exec(sendVerificationBlock)
  assert.ok(catchBlock, 'send verification catch block should exist')
  assert.match(catchBlock[1], /error:\s*EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/)
  assert.doesNotMatch(catchBlock[1], /getFriendlyVerificationError\(verificationError\)/)
})

test('email changes reset verification state and code input', () => {
  assert.match(handleChangeBlock, /if \(name === 'email'\) \{[\s\S]*setVerificationCode\(''\)[\s\S]*setEmailVerification\(initialEmailVerification\)/)
})

test('email send button is disabled after a code has been sent for the current email', () => {
  assert.match(signupPage, /const canShowVerificationCode = /)
  assert.match(signupPage, /disabled=\{[\s\S]*canShowVerificationCode[\s\S]*\}/)
})
