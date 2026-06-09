import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Script, createContext } from 'node:vm'

const root = process.cwd()
const source = readFileSync(join(root, 'src/api/client.js'), 'utf8')
  .replace("import.meta.env.VITE_API_BASE_URL ?? 'https://dh7p4gzv38x71.cloudfront.net'", "'https://dh7p4gzv38x71.cloudfront.net'")
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

const client = loadClient(async () => ({
  ok: false,
  status: 400,
  statusText: 'Bad Request',
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({
    code: 'INVALID_IMAGE_FILE',
    message: 'Only JPEG, PNG, and WebP images can be uploaded.',
    status: 400,
  }),
  text: async () => '',
}))

await assert.rejects(
  () => client.get('/api/traces/images'),
  (error) => {
    assert.equal(error.name, 'ApiError')
    assert.equal(error.status, 400)
    assert.equal(error.message, 'Only JPEG, PNG, and WebP images can be uploaded.')
    assert.deepEqual(error.body, {
      code: 'INVALID_IMAGE_FILE',
      message: 'Only JPEG, PNG, and WebP images can be uploaded.',
      status: 400,
    })
    return true
  }
)
