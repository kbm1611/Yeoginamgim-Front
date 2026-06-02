import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const app = read('src/App.jsx')
assert.match(app, /import SignupPage from '\.\/pages\/SignupPage'/)
assert.match(app, /<Route path="\/signup" element={<SignupPage \/>} \/>/)

const loginPage = read('src/pages/LoginPage.jsx')
assert.match(loginPage, /to="\/signup"/)
assert.match(loginPage, /아직 계정이 없나요\?/)
assert.match(loginPage, /회원가입/)

const signupPage = read('src/pages/SignupPage.jsx')
assert.match(signupPage, /name="email"/)
assert.match(signupPage, /name="password"/)
assert.match(signupPage, /name="nickname"/)
assert.match(signupPage, /\/api\/user\/signup/)

console.log('auth ui smoke test passed')
