import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Script, createContext } from 'node:vm'

const root = process.cwd()
const source = readFileSync(join(root, 'src/api/client.js'), 'utf8')
  .replace('import.meta.env.VITE_API_BASE_URL', 'undefined')
  .replaceAll('export ', '')

const context = createContext({
  URL,
  Headers,
  FormData: class FormData {},
})

new Script(`${source}
globalThis.clientExports = {
  API_BASE_URL,
}`).runInContext(context)

assert.equal(context.clientExports.API_BASE_URL, 'https://d2a908jq2crel3.cloudfront.net')
