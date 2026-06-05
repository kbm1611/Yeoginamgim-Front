import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const signupPage = read('src/pages/SignupPage.jsx')
const loginPage = read('src/pages/LoginPage.jsx')

test('signup success navigates to login without rendering a duplicate signup-page success message', () => {
  assert.match(signupPage, /const SIGNUP_SUCCESS_MESSAGE = /)
  assert.match(signupPage, /state:\s*\{\s*signupEmail:\s*email,\s*signupMessage:\s*SIGNUP_SUCCESS_MESSAGE\s*\}/)
  assert.doesNotMatch(signupPage, /setSuccess\(message\)/)
  assert.doesNotMatch(signupPage, /\{success && <p className="signup-success">\{success\}<\/p>\}/)
})

test('login page owns the one-time signup completion notice and clears stale route state', () => {
  assert.match(loginPage, /const \[signupNotice, setSignupNotice\] = useState/)
  assert.match(loginPage, /location\.state\?\.signupMessage/)
  assert.match(loginPage, /const sanitizedLocationState = /)
  assert.match(loginPage, /navigate\(location\.pathname,\s*\{\s*replace:\s*true,\s*state:\s*sanitizedLocationState\s*\}\)/)
  assert.match(loginPage, /\(success \|\| signupNotice\)/)
  assert.doesNotMatch(loginPage, /signupMessage\) &&/)
})
