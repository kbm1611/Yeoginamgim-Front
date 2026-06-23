import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const currentDir = dirname(fileURLToPath(import.meta.url))
const traceDetailSource = readFileSync(join(currentDir, '../../src/pages/TraceDetail.jsx'), 'utf8')

test('TraceDetail sends the selected report kind expected by the backend DTO', () => {
  assert.match(traceDetailSource, /createTraceReport\(post\.id,\s*\{\s*reportKind:\s*selectedReason\s*\}\)/)
  assert.doesNotMatch(traceDetailSource, /createTraceReport\(post\.id,\s*\{\s*reason:\s*selectedReason\s*\}\)/)
})
