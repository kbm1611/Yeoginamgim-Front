import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Script, createContext } from 'node:vm'

const root = process.cwd()
const source = readFileSync(join(root, 'src/api/client.js'), 'utf8')
  .replace("import.meta.env.VITE_API_BASE_URL ?? 'https://dh7p4gzv38x71.cloudfront.net'", "'https://dh7p4gzv38x71.cloudfront.net'")
  .replaceAll('export ', '')

function createStorage({ failGet = false, failSet = false, failRemove = false } = {}) {
  const values = new Map()
  return {
    getItem(key) {
      if (failGet) throw new Error('get blocked')
      return values.get(key) ?? null
    },
    setItem(key, value) {
      if (failSet) throw new Error('set blocked')
      values.set(key, String(value))
    },
    removeItem(key) {
      if (failRemove) throw new Error('remove blocked')
      values.delete(key)
    },
    values,
  }
}

function loadClient(windowOverrides = {}) {
  const localStorage = windowOverrides.localStorage ?? createStorage()
  const sessionStorage = windowOverrides.sessionStorage ?? createStorage()
  const sandbox = {
    Headers,
    URL,
    FormData: class FormData {},
    fetch: async () => { throw new Error('fetch should not be called') },
    window: { localStorage, sessionStorage },
    document: { cookie: '' },
  }
  const context = createContext(sandbox)
  new Script(`${source}
globalThis.clientExports = {
  AUTH_TOKEN_STORAGE_KEY,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
}`).runInContext(context)
  return context.clientExports
}

const localSetBlocked = createStorage({ failSet: true })
const sessionAvailable = createStorage()
const clientWithFallback = loadClient({
  localStorage: localSetBlocked,
  sessionStorage: sessionAvailable,
})

assert.equal(clientWithFallback.setAuthToken('fallback-token'), true)
assert.equal(sessionAvailable.values.get(clientWithFallback.AUTH_TOKEN_STORAGE_KEY), 'fallback-token')
assert.equal(clientWithFallback.getAuthToken(), 'fallback-token')

const fullyBlocked = loadClient({
  localStorage: createStorage({ failSet: true }),
  sessionStorage: createStorage({ failSet: true }),
})

assert.equal(fullyBlocked.setAuthToken('blocked-token'), false)
