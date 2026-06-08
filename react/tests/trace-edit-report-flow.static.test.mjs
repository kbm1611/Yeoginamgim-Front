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
const boardCanvas = read('src/components/board/BoardCanvas.jsx')

function getSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)

  assert.notEqual(start, -1, `${startMarker} should exist`)
  assert.notEqual(end, -1, `${endMarker} should exist after ${startMarker}`)

  return source.slice(start, end)
}

test('trace API exposes updateTrace but no frontend edit flow calls it yet', () => {
  assert.match(tracesApi, /export function updateTrace\(traceId, traceRequest\)/)
  assert.match(tracesApi, /apiClient\.patch\(`\/api\/traces\/\$\{pathSegment\(traceId\)\}`/)

  assert.doesNotMatch(postItEditor, /\bupdateTrace\s*\(/)
  assert.doesNotMatch(boardDetail, /\bupdateTrace\s*\(/)
  assert.doesNotMatch(traceDetail, /\bupdateTrace\s*\(/)
  assert.doesNotMatch(traceBottomSheet, /\bupdateTrace\s*\(/)
})

test('edit buttons enter PostItEditor with editPost state, but completion still returns a placement draft', () => {
  const traceDetailEdit = getSourceBetween(traceDetail, 'const handleEdit = () => {', 'const handleDelete')
  const bottomSheetEdit = getSourceBetween(traceBottomSheet, 'const handleEdit = () => {', 'if (!post) return null')
  const completeFlow = getSourceBetween(postItEditor, 'const handleComplete = async () => {', 'const renderPanelContent')

  assert.match(traceDetailEdit, /navigate\(`\/board\/\$\{boardId\}\/postit`/)
  assert.match(traceDetailEdit, /state:\s*\{\s*editPost:\s*post/)
  assert.match(bottomSheetEdit, /navigate\(`\/board\/\$\{boardId\}\/postit`/)
  assert.match(bottomSheetEdit, /state:\s*\{\s*editPost:\s*post/)

  assert.match(postItEditor, /location\.state\?\.initialTab/)
  assert.doesNotMatch(postItEditor, /location\.state\?\.editPost/)
  assert.match(completeFlow, /placementDraft:\s*\{/)
  assert.doesNotMatch(completeFlow, /\bupdateTrace\s*\(/)
})

test('BoardDetail saves returned placement drafts through createTrace, so current edit flow creates a new trace', () => {
  const placeFlow = getSourceBetween(boardDetail, 'const handlePlace = useCallback(async (cell) => {', 'const handleToggleLike')

  assert.match(boardDetail, /const \[placementDraft, setPlacementDraft\] = useState\(\(\) => location\.state\?\.placementDraft/)
  assert.match(placeFlow, /if \(!placementDraft \|\| isSaving\) return/)
  assert.match(placeFlow, /const createdTrace = await createTrace\(boardId, \{/)
  assert.doesNotMatch(placeFlow, /\bupdateTrace\s*\(/)
})

test('Board canvas report flow is wired from BoardDetail to createTraceReport with reportKind', () => {
  const reportHandler = getSourceBetween(boardDetail, 'const handleCreateReport = useCallback(async (post, reportKind) => {', 'const handleCopyInvite')
  const reportAction = getSourceBetween(boardCanvas, 'function ReportAction({ post, onReport })', 'function EmptyBoard')

  assert.match(reportsApi, /export function createTraceReport\(traceId, reportRequest\)/)
  assert.match(reportHandler, /const result = await createTraceReport\(postId, \{ reportKind \}\)/)
  assert.match(boardDetail, /onReport=\{handleCreateReport\}/)
  assert.match(boardCanvas, /\{onReport \? <ReportAction post=\{post\} onReport=\{onReport\} \/> : null\}/)
  assert.match(reportAction, /const \[reportKind, setReportKind\] = useState\(REPORT_REASONS\[0\]\.value\)/)
  assert.match(reportAction, /await onReport\(post, reportKind\)/)
})

test('BoardCanvas keeps the backend report reason values available to the UI', () => {
  const reasonsSource = getSourceBetween(boardCanvas, 'const REPORT_REASONS = [', ']')
  const values = [...reasonsSource.matchAll(/value:\s*'([^']+)'/g)].map((match) => match[1])

  assert.deepEqual(values, ['ABUSE', 'INAPPROPRIATE_IMAGE', 'SPAM', 'PRIVACY', 'ETC'])
})

test('TraceDetail and TraceBottomSheet render report buttons but do not call the report API yet', () => {
  assert.match(traceDetail, /<Flag\s+size=\{16\}/)
  assert.match(traceBottomSheet, /<Flag\s+size=\{16\}/)

  assert.doesNotMatch(traceDetail, /createTraceReport/)
  assert.doesNotMatch(traceDetail, /\bhandleReport/)
  assert.doesNotMatch(traceDetail, /\breportKind\b/)

  assert.doesNotMatch(traceBottomSheet, /createTraceReport/)
  assert.doesNotMatch(traceBottomSheet, /\bhandleReport/)
  assert.doesNotMatch(traceBottomSheet, /\breportKind\b/)
})
