import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const currentDir = dirname(fileURLToPath(import.meta.url))
const postItEditorSource = readFileSync(join(currentDir, 'PostItEditor.jsx'), 'utf8')

function getSourceBetween(startMarker, endMarker) {
  const start = postItEditorSource.indexOf(startMarker)
  const end = postItEditorSource.indexOf(endMarker, start)

  assert.notEqual(start, -1, `${startMarker} should exist`)
  assert.notEqual(end, -1, `${endMarker} should exist after ${startMarker}`)

  return postItEditorSource.slice(start, end)
}

test('PolaroidPreview renders text objects created by the text tool', () => {
  const polaroidPreviewSource = getSourceBetween('function PolaroidPreview', 'function PhotoPanel')

  assert.match(polaroidPreviewSource, /\btextObjects\b/)
  assert.match(polaroidPreviewSource, /<TextObject\b/)
})

test('PostItEditor preserves board route state when returning with a placement draft', () => {
  const completeSource = getSourceBetween('const complete = async () => {', '  return (')
  const navigateIndex = completeSource.indexOf('navigate(`/board/${boardId}`')
  const placementDraftIndex = completeSource.indexOf('placementDraft')
  const boardNameIndex = completeSource.indexOf('boardName: location.state?.boardName')
  const boardTypeIndex = completeSource.indexOf('boardType: location.state?.boardType')

  assert.notEqual(navigateIndex, -1)
  assert.ok(boardNameIndex > navigateIndex && boardNameIndex < placementDraftIndex)
  assert.ok(boardTypeIndex > navigateIndex && boardTypeIndex < placementDraftIndex)
})
