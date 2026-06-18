import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const tracesApi = read('src/api/traces.js')
const reportsApi = read('src/api/reports.js')
const postItEditor = read('src/pages/PostItEditor.jsx')
const boardDetail = read('src/pages/BoardDetail.jsx')
const traceDetail = read('src/pages/TraceDetail.jsx')
const traceBottomSheet = read('src/components/board/TraceBottomSheet.jsx')

test('trace API exposes updateTrace but current editor completion still returns a placement draft', () => {
  assert.match(tracesApi, /export function updateTrace\(traceId, traceRequest\)/)
  assert.match(tracesApi, /apiClient\.patch\(`\/api\/traces\/\$\{pathSegment\(traceId\)\}`/)
  assert.match(postItEditor, /placementDraft:\s*\{/)
  assert.doesNotMatch(postItEditor, /\bupdateTrace\s*\(/)
})

test('edit buttons enter PostItEditor with editPost state', () => {
  assert.match(traceDetail, /navigate\(`\/board\/\$\{boardId\}\/postit`/)
  assert.match(traceDetail, /state:\s*\{\s*editPost:\s*post/)
  assert.match(traceBottomSheet, /navigate\(`\/board\/\$\{boardId\}\/postit`/)
  assert.match(traceBottomSheet, /state:\s*\{\s*editPost:\s*post/)
})

test('BoardDetail saves placement drafts through the correct board API', () => {
  assert.match(boardDetail, /const \[placementDraft, setPlacementDraft\] = useState\(\(\) => location\.state\?\.placementDraft/)
  assert.match(boardDetail, /const isCustomBoard = board\.boardType === BOARD_TYPE\.CUSTOM/)
  assert.match(boardDetail, /\? await createCustomBoardTrace\(boardId, tracePayload\)/)
  assert.match(boardDetail, /: await createTrace\(boardId, tracePayload\)/)
})

test('TraceDetail report flow sends backend reportKind and displays report errors', () => {
  assert.match(reportsApi, /export function createTraceReport\(traceId, reportRequest\)/)
  assert.match(traceDetail, /await createTraceReport\(post\.id,\s*\{\s*reportKind:\s*selectedReason\s*\}\)/)
  assert.match(traceDetail, /const \[reportError, setReportError\] = useState\(''\)/)
  assert.match(traceDetail, /setReportError\(getApiErrorMessage\(error,/)
  assert.match(traceDetail, /messageMatchers:\s*ACTIVITY_RESTRICTION_MATCHERS/)
})

test('TraceDetail keeps the backend report reason values available to the UI', () => {
  const values = [...traceDetail.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(values, ['SPAM', 'INAPPROPRIATE', 'HATE', 'PRIVACY', 'ETC'])
})

test('TraceBottomSheet exposes like and delete API errors to the user', () => {
  assert.match(traceBottomSheet, /const \[actionError, setActionError\] = useState\(''\)/)
  assert.match(traceBottomSheet, /getApiErrorMessage\(error,/)
  assert.match(traceBottomSheet, /ACTIVITY_RESTRICTION_MATCHERS/)
  assert.match(traceBottomSheet, /\{actionError && \(/)
})
