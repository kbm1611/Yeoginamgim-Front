import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const app = read('src/App.jsx')
assert.match(app, /import SignupPage from '\.\/pages\/SignupPage'/)
assert.match(app, /import OAuthCallbackPage from '\.\/pages\/OAuthCallbackPage'/)
assert.match(app, /<Route path="\/signup" element={<SignupPage \/>} \/>/)
assert.match(app, /<Route path="\/oauth\/callback" element={<OAuthCallbackPage \/>} \/>/)
assert.match(app, /RequireAuth/)

const loginPage = read('src/pages/LoginPage.jsx')
assert.match(loginPage, /import \{ login/)
assert.match(loginPage, /to="\/signup"/)
assert.match(loginPage, /name="email"/)
assert.match(loginPage, /name="password"/)
assert.match(loginPage, /redirectToKakaoOAuth/)
assert.match(loginPage, /redirectToGoogleOAuth/)
assert.doesNotMatch(loginPage, /navigate\('\/home'\)/)

const signupPage = read('src/pages/SignupPage.jsx')
assert.match(signupPage, /import \{ signupUser \}/)
assert.match(signupPage, /name="email"/)
assert.match(signupPage, /name="password"/)
assert.match(signupPage, /name="nickname"/)
assert.match(signupPage, /name="birthDate"/)
assert.match(signupPage, /inputMode="numeric"/)
assert.match(signupPage, /maxLength=\{6\}/)
assert.match(signupPage, /signupData\.append\('birthDate'/)
assert.doesNotMatch(signupPage, /fetch\(/)

const myPage = read('src/pages/MyPage.jsx')
assert.match(myPage, /birthDate/)
assert.match(myPage, /formData\.append\('birthDate'/)

const usersApi = read('src/api/users.js')
assert.match(usersApi, /\/api\/user\/signup/)

const oauthCallbackPage = read('src/pages/OAuthCallbackPage.jsx')
assert.match(oauthCallbackPage, /setAuthToken/)
assert.match(oauthCallbackPage, /URLSearchParams/)
assert.match(oauthCallbackPage, /navigate\('\/home'/)
