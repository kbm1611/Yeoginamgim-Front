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

test('verification code input only renders after email send succeeds', () => {
  assert.match(signupPage, /codeSent:\s*false/)
  assert.match(signupPage, /codeSent:\s*true/)
  assert.match(signupPage, /const canShowVerificationCode = /)
  assert.match(signupPage, /\{canShowVerificationCode && \(/)
  assert.match(signupPage, /name="verificationCode"/)
})

test('failed email send keeps verification code input hidden', () => {
  const catchBlock = /catch(?: \(verificationError\))? \{([\s\S]*?)\n    \}/.exec(sendVerificationBlock)

  assert.ok(catchBlock, 'send verification catch block should exist')
  assert.match(catchBlock[1], /codeSent:\s*false/)
  assert.doesNotMatch(catchBlock[1], /codeSent:\s*true/)
})

test('email format and send failure messages stay distinct', () => {
  assert.match(signupPage, /const EMAIL_FORMAT_ERROR_MESSAGE = '올바른 이메일 형식으로 입력해주세요\.'/)
  assert.match(
    signupPage,
    /const EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE = '인증번호를 보낼 수 없어요\. 이메일 주소를 다시 확인해주세요\.'/,
  )
  assert.match(signupPage, /return EMAIL_FORMAT_ERROR_MESSAGE/)

  const catchBlock = /catch \(verificationError\) \{([\s\S]*?)\n    \}/.exec(sendVerificationBlock)
    ?? /catch \{([\s\S]*?)\n    \}/.exec(sendVerificationBlock)

  assert.ok(catchBlock, 'send verification catch block should exist')
  assert.match(catchBlock[1], /error:\s*EMAIL_VERIFICATION_SEND_FAILURE_MESSAGE/)
  assert.doesNotMatch(catchBlock[1], /getFriendlyVerificationError\(verificationError\)/)
})
