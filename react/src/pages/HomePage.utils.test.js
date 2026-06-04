import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildHomePlaceParams,
  buildHomeTraceParams,
  DEFAULT_HOME_PERIOD,
  HOME_PERIOD_OPTIONS,
  normalizeHomeDistrict,
  SEOUL_DISTRICTS,
} from './HomePage.utils.js'

test('home period options default to today and expose four filters', () => {
  assert.equal(DEFAULT_HOME_PERIOD, 'today')
  assert.deepEqual(
    HOME_PERIOD_OPTIONS.map((option) => option.value),
    ['today', 'week', 'month', 'year']
  )
})

test('normalizeHomeDistrict keeps Seoul districts and falls back to all', () => {
  assert.equal(normalizeHomeDistrict({ district: '성동구' }), '성동구')
  assert.equal(normalizeHomeDistrict({ district: '부산진구' }), '전체')
  assert.equal(normalizeHomeDistrict(null), '전체')
  assert.equal(SEOUL_DISTRICTS.includes('강동구'), true)
})

test('home API params include period and omit all-district filters', () => {
  assert.deepEqual(buildHomePlaceParams({ period: 'today', district: '전체' }), {
    period: 'today',
    limit: 5,
  })
  assert.deepEqual(buildHomeTraceParams({ period: 'month', district: '성동구' }), {
    period: 'month',
    district: '성동구',
    limit: 5,
  })
})
