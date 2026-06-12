import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const postItEditorSource = readFileSync('src/pages/PostItEditor.jsx', 'utf8')

test('PostItEditor exports both polaroid and postit drafts through canvas before upload', () => {
  const completeStart = postItEditorSource.indexOf('const complete = async () => {')
  const navigateStart = postItEditorSource.indexOf('navigate(`/board/${boardId}`', completeStart)
  const completeSource = postItEditorSource.slice(completeStart, navigateStart)

  assert.notEqual(completeStart, -1)
  assert.notEqual(navigateStart, -1)
  assert.match(completeSource, /const capturedImage = await exportImage\(\)/)
  assert.doesNotMatch(completeSource, /cardType === 'postit' \? await exportImage\(\) : null/)
})
