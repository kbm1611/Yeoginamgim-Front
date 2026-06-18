import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const errors = read('src/api/errors.js')
const boardDetail = read('src/pages/BoardDetail.jsx')
const traceDetail = read('src/pages/TraceDetail.jsx')
const traceBottomSheet = read('src/components/board/TraceBottomSheet.jsx')
const notificationPage = read('src/pages/NotificationPage.jsx')

test('activity restriction server message is mapped to a user-friendly frontend message', () => {
  assert.match(errors, /ACTIVITY_RESTRICTION_MESSAGE/)
  assert.match(errors, /활동이 제한되어 일반 보드 활동을 할 수 없습니다/)
  assert.match(errors, /활동이 제한된 사용자입니다/)
})

test('place board trace creation shows activity restriction message but custom board path remains untouched', () => {
  assert.match(boardDetail, /ACTIVITY_RESTRICTION_MESSAGE/)
  assert.match(boardDetail, /messageMatchers:\s*ACTIVITY_RESTRICTION_MATCHERS/)
  assert.match(boardDetail, /const isCustomBoard = board\.boardType === BOARD_TYPE\.CUSTOM/)
  assert.match(boardDetail, /\? await createCustomBoardTrace\(boardId, tracePayload\)/)
})

test('trace detail reports and actions show activity restriction errors', () => {
  assert.match(traceDetail, /ACTIVITY_RESTRICTION_MESSAGE/)
  assert.match(traceDetail, /setReportError/)
  assert.match(traceDetail, /messageMatchers:\s*ACTIVITY_RESTRICTION_MATCHERS/)
})

test('bottom sheet like and delete actions expose server errors instead of swallowing them', () => {
  assert.match(traceBottomSheet, /actionError/)
  assert.match(traceBottomSheet, /getApiErrorMessage/)
  assert.match(traceBottomSheet, /ACTIVITY_RESTRICTION_MESSAGE/)
  assert.match(traceBottomSheet, /createTraceReport\(post\.id,\s*\{\s*reportKind:\s*selectedReportReason\s*\}\)/)
})

test('notification page explicitly recognizes report hidden notification types', () => {
  assert.match(notificationPage, /TRACE_HIDDEN_BY_REPORT_FOR_AUTHOR/)
  assert.match(notificationPage, /TRACE_HIDDEN_BY_REPORT_FOR_REPORTER/)
})
