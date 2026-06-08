import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const mapPage = read('src/pages/Map.jsx')
const searchPanel = read('src/features/map/components/SearchPanel.jsx')
const indexCss = read('src/index.css')

function getSearchFormSource() {
  const formStart = searchPanel.indexOf('<form')
  const formEnd = searchPanel.indexOf('</form>', formStart)

  assert.notEqual(formStart, -1, 'SearchPanel should render a search form')
  assert.notEqual(formEnd, -1, 'SearchPanel search form should be closed')

  return searchPanel.slice(formStart, formEnd)
}

test('Map page delegates search UI to SearchPanel', () => {
  assert.match(mapPage, /import SearchPanel from '\.\.\/features\/map\/components\/SearchPanel'/)
  assert.match(mapPage, /<SearchPanel\b/)
  assert.match(mapPage, /onSubmit=\{handleRunSearch\}/)
  assert.match(mapPage, /onClear=\{handleClearSearch\}/)
})

test('SearchPanel keeps an accessible search input before the submit button', () => {
  const formSource = getSearchFormSource()
  const inputMatch = formSource.match(/<input\b[\s\S]*?\/>/)
  const submitButtonMatch = [...formSource.matchAll(/<button\b[\s\S]*?<\/button>/g)]
    .find((match) => /\btype="submit"/.test(match[0]))

  assert.ok(inputMatch, 'SearchPanel should render an input in the search form')
  assert.ok(submitButtonMatch, 'SearchPanel should render a submit button in the search form')
  assert.ok(formSource.indexOf(inputMatch[0]) < formSource.indexOf(submitButtonMatch[0]))

  assert.match(inputMatch[0], /\btype="search"/)
  assert.match(inputMatch[0], /\bvalue=\{input\}/)
  assert.match(inputMatch[0], /\bonChange=\{onInputChange\}/)
  assert.match(inputMatch[0], /\bclassName="[^"]*\bmap-search-input\b[^"]*"/)
  assert.match(inputMatch[0], /\baria-label="[^"]+"/)

  assert.match(submitButtonMatch[0], /\btype="submit"/)
  assert.match(submitButtonMatch[0], /\baria-label="[^"]+"/)
  assert.match(submitButtonMatch[0], /\bdisabled=\{status === 'loading'\}/)
})

test('SearchPanel exposes a clear button only when the search input has text', () => {
  const formSource = getSearchFormSource()
  const clearButtonStart = formSource.indexOf('{input ? (')
  const clearButtonEnd = formSource.indexOf(') : null}', clearButtonStart)

  assert.notEqual(clearButtonStart, -1, 'clear button should be conditional on input')
  assert.notEqual(clearButtonEnd, -1, 'clear button conditional should close')

  const clearButtonSource = formSource.slice(clearButtonStart, clearButtonEnd)
  assert.match(clearButtonSource, /<button\b[\s\S]*?\btype="button"/)
  assert.match(clearButtonSource, /\bonClick=\{onClear\}/)
  assert.match(clearButtonSource, /\baria-label="[^"]+"/)
  assert.match(clearButtonSource, /<X\s+size=\{15\}/)
})

test('map search input CSS hides native browser search cancel controls', () => {
  assert.match(indexCss, /\.map-search-input::-webkit-search-cancel-button/)
  assert.match(indexCss, /\.map-search-input::-webkit-search-decoration/)
  assert.match(indexCss, /\.map-search-input::-webkit-search-results-button/)
  assert.match(indexCss, /\.map-search-input::-webkit-search-results-decoration/)
  assert.match(indexCss, /\.map-search-input::-ms-clear/)
  assert.match(indexCss, /\.map-search-input::-ms-reveal/)
})
