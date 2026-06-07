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
const sendVerificationButtonBlock = /<button[\s\S]*?onClick=\{handleSendVerification\}([\s\S]*?)<\/button>/.exec(
  signupPage,
)?.[1] ?? ''
const sendVerificationDisabledBlock = /disabled=\{([\s\S]*?)\n\s*\}/.exec(sendVerificationButtonBlock)?.[1] ?? ''

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
  assert.match(catchBlock[1], /codeSent:\s*canShowVerificationCode/)
  assert.match(catchBlock[1], /error:\s*getFriendlyVerificationError\(verificationError\) \|\| EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/)
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
  assert.match(catchBlock[1], /EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/)
  assert.match(catchBlock[1], /getFriendlyVerificationError\(verificationError\)/)
})

test('email changes reset verification state and code input', () => {
  assert.match(handleChangeBlock, /if \(name === 'email'\) \{[\s\S]*setVerificationCode\(''\)[\s\S]*setEmailVerification\(initialEmailVerification\)/)
})

test('email send button stays enabled for resending after a code has been sent', () => {
  assert.match(signupPage, /const canShowVerificationCode = /)
  assert.doesNotMatch(sendVerificationDisabledBlock, /canShowVerificationCode/)
  assert.match(sendVerificationButtonBlock, /canShowVerificationCode \? ['"`]인증번호 재발송['"`] : ['"`]인증번호 발송['"`]/)
})
