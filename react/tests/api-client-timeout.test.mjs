import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Script, createContext } from 'node:vm'

const root = process.cwd()
const source = readFileSync(join(root, 'src/api/client.js'), 'utf8')
  .replace("import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'", "'http://localhost:8080'")
  .replaceAll('export ', '')

function createStorage() {
  return {
    getItem() {
      return null
    },
    setItem() {},
    removeItem() {},
  }
}

function loadClient(fetchImpl) {
  const sandbox = {
    AbortController,
    DOMException,
    Headers,
    URL,
    FormData: class FormData {},
    clearTimeout,
    fetch: fetchImpl,
    setTimeout,
    window: {
      localStorage: createStorage(),
      sessionStorage: createStorage(),
    },
    document: { cookie: '' },
  }
  const context = createContext(sandbox)
  new Script(`${source}
globalThis.clientExports = {
  ApiError,
  get,
}`).runInContext(context)
  return context.clientExports
}

const client = loadClient((url, options = {}) =>
  new Promise((resolve, reject) => {
    options.signal?.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    })
  })
)

await assert.rejects(
  Promise.race([
    client.get('/api/auth/email/send', undefined, { timeoutMs: 10 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('request did not time out')), 100)),
  ]),
  (error) => {
    assert.equal(error.name, 'ApiError')
    assert.equal(error.status, 0)
    assert.equal(error.message, '요청 시간이 초과되었습니다. 서버 상태를 확인한 뒤 다시 시도해주세요.')
    return true
  }
)
