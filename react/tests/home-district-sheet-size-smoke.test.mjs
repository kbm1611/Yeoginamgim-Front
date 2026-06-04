import assert from 'node:assert/strict'
import fs from 'node:fs'

const homeFilters = fs.readFileSync(new URL('../src/components/HomeFilters.jsx', import.meta.url), 'utf8')

assert.match(homeFilters, /flex h-\[76%\] max-h-\[560px\] w-full flex-col overflow-hidden/)
assert.match(homeFilters, /className="flex-1 overflow-y-auto px-4 py-4"/)
