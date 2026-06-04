import assert from 'node:assert/strict'
import fs from 'node:fs'

const homeFilters = fs.readFileSync(new URL('../src/components/HomeFilters.jsx', import.meta.url), 'utf8')

assert.doesNotMatch(homeFilters, /\bBell\b/)
assert.doesNotMatch(homeFilters, /<h1\b/)
assert.doesNotMatch(homeFilters, /aria-label="알림"|aria-label="\?뚮┝"/)
assert.match(homeFilters, /<section className="px-5 pb-2 pt-1">/)
