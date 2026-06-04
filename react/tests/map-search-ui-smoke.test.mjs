import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

const mapPage = read('src/pages/Map.jsx')
const indexCss = read('src/index.css')

const searchInputIndex = mapPage.indexOf('aria-label="장소 검색어"')
const searchSubmitIndex = mapPage.indexOf('aria-label="장소 검색"')
const searchInputPrefix = mapPage.slice(Math.max(0, searchInputIndex - 700), searchInputIndex)

assert.notEqual(searchInputIndex, -1)
assert.notEqual(searchSubmitIndex, -1)
assert.ok(searchSubmitIndex > searchInputIndex)
assert.doesNotMatch(searchInputPrefix, /<Search\s+size=\{17\}/)
assert.match(mapPage, /className="[^"]*\bmap-search-input\b[^"]*"/)
assert.match(indexCss, /\.map-search-input::-webkit-search-cancel-button/)
assert.match(indexCss, /\.map-search-input::-webkit-search-decoration/)
