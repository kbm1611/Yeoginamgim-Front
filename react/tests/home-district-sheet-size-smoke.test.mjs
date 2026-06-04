import assert from 'node:assert/strict'
import fs from 'node:fs'

const homeFilters = fs.readFileSync(new URL('../src/components/HomeFilters.jsx', import.meta.url), 'utf8')

assert.match(homeFilters, /REGION_GROUPS\.map/)
assert.match(homeFilters, /filterRegionDistricts/)
assert.match(homeFilters, />지역 선택</)
assert.match(homeFilters, /placeholder="지역명 검색"/)
assert.match(homeFilters, /fixed inset-0/)
assert.match(homeFilters, /sm:items-center/)
assert.match(homeFilters, /sm:h-\[78vh\]/)
assert.doesNotMatch(homeFilters, /sm:h-auto/)
assert.match(homeFilters, /overflow-x-auto/)
assert.match(homeFilters, /sm:grid/)
assert.match(homeFilters, /sm:grid-cols-5/)
assert.doesNotMatch(homeFilters, /sm:flex-1/)
assert.doesNotMatch(homeFilters, /sm:basis-/)
assert.match(homeFilters, /sm:grid-cols-3/)
assert.match(homeFilters, /auto-rows-\[58px\]/)
assert.match(homeFilters, /className="flex-1 overflow-y-auto px-5 py-4"/)
