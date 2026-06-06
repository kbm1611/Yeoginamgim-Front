import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeTraceCell } from './BoardDetail.utils.js'

test('normalizeTraceCell keeps frontend grid coordinates as-is', () => {
  assert.deepEqual(normalizeTraceCell({ traceX: 1, traceY: 3 }), { col: 1, row: 3 })
})

test('normalizeTraceCell maps backend sample coordinates into valid board cells', () => {
  assert.deepEqual(normalizeTraceCell({ traceX: 63, traceY: 64 }), { col: 1, row: 1 })
  assert.deepEqual(normalizeTraceCell({ traceX: 30, traceY: 50 }), { col: 0, row: 1 })
})
