import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const signupPage = readFileSync(join(root, 'src/pages/SignupPage.jsx'), 'utf8')

test('signup submit stays clickable so missing email verification can show a validation message', () => {
  assert.match(signupPage, /if \(!isEmailVerified\) return '이메일 인증을 완료해주세요\.'/)
  assert.doesNotMatch(signupPage, /const canSubmitSignup = isEmailVerified/)
  assert.match(
    signupPage,
    /<motion\.button[\s\S]*type="submit"[\s\S]*disabled=\{isSubmitting \|\| emailVerification\.isSending \|\| emailVerification\.isVerifying\}/,
  )
})
