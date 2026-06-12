import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import test from 'node:test'

const currentDir = dirname(fileURLToPath(import.meta.url))
const boardDetailSource = readFileSync(join(currentDir, 'BoardDetail.jsx'), 'utf8')
const placeDetailSource = readFileSync(join(currentDir, 'PlaceDetail.jsx'), 'utf8')

test('BoardDetail header does not render a trace count', () => {
  assert.doesNotMatch(boardDetailSource, /흔적\s*\{traceCount\}개/)
  assert.doesNotMatch(boardDetailSource, /traceCount=\{allPosts\.length\}/)
})

test('BoardDetail uploads rendered captured images before raw local media', () => {
  const capturedUploadIndex = boardDetailSource.indexOf('if (placementDraft.capturedImage)')
  const rawPolaroidUploadIndex = boardDetailSource.indexOf('if (!imageUrl && isPolaroidDraft && isUploadableLocalImage(mediaImage))')

  assert.notEqual(capturedUploadIndex, -1)
  assert.notEqual(rawPolaroidUploadIndex, -1)
  assert.ok(capturedUploadIndex < rawPolaroidUploadIndex)
})

test('BoardDetail does not endlessly retry the same failed placement draft', () => {
  assert.match(boardDetailSource, /autoPlaceAttemptedDraftIdRef/)
  assert.match(boardDetailSource, /autoPlaceAttemptedDraftIdRef\.current === placementDraft\.id/)
})

test('BoardDetail has no unresolved merge markers or visible mojibake strings', () => {
  const mergeMarkerPattern = new RegExp(`${'<'.repeat(7)}|${'='.repeat(7)}|${'>'.repeat(7)}`)
  assert.doesNotMatch(boardDetailSource, mergeMarkerPattern)
  assert.doesNotMatch(boardDetailSource, /\?[^\s'"]*[가-힣]|[�]/)
})

test('PlaceDetail has no visible mojibake strings in user-facing labels', () => {
  assert.doesNotMatch(placeDetailSource, /alt="\?μ냼/)
  assert.doesNotMatch(placeDetailSource, />理쒓렐 \?붿쟻</)
  assert.doesNotMatch(placeDetailSource, />\?붾낫湲\?</)
  assert.doesNotMatch(placeDetailSource, />\?붿쟻 蹂대뱶 蹂닿린</)
})
