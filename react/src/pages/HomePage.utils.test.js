import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ALL_DISTRICTS_LABEL,
  AREA_REGIONS,
  buildHomePlaceParams,
  buildHomeTraceParams,
  DEFAULT_HOME_PERIOD,
  filterSupportedDistricts,
  GYEONGGI_DISTRICTS,
  HOME_PERIOD_OPTIONS,
  isSupportedDistrict,
  normalizeHomeDistrict,
  SEOUL_DISTRICTS,
  SUPPORTED_DISTRICTS,
} from './HomePage.utils.js'

test('home period options default to today and expose four Korean filters', () => {
  assert.equal(DEFAULT_HOME_PERIOD, 'today')
  assert.deepEqual(
    HOME_PERIOD_OPTIONS.map((option) => option.value),
    ['today', 'week', 'month', 'year']
  )
  assert.deepEqual(
    HOME_PERIOD_OPTIONS.map((option) => option.label),
    ['오늘', '주간', '월간', '년간']
  )
})

test('supported districts include nationwide area groups', () => {
  assert.equal(ALL_DISTRICTS_LABEL, '전체')
  assert.equal(AREA_REGIONS.수도권.서울특별시.includes('성동구'), true)
  assert.equal(SEOUL_DISTRICTS.includes('성동구'), true)
  assert.equal(GYEONGGI_DISTRICTS.includes('성남시 분당구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('부산진구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('청주시 상당구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('제주시'), true)
})

test('filterSupportedDistricts matches district names as the query changes', () => {
  assert.deepEqual(filterSupportedDistricts('마포'), ['마포구'])
  assert.deepEqual(filterSupportedDistricts('송파'), ['송파구'])
  assert.deepEqual(filterSupportedDistricts('분당'), ['성남시 분당구'])
  assert.deepEqual(filterSupportedDistricts('수원'), ['수원시 장안구', '수원시 권선구', '수원시 팔달구', '수원시 영통구'])
  assert.deepEqual(filterSupportedDistricts('부산진'), ['부산진구'])
  assert.deepEqual(filterSupportedDistricts('제주'), ['제주시'])
  assert.deepEqual(filterSupportedDistricts('없는구'), [])
  assert.equal(filterSupportedDistricts('').length, SUPPORTED_DISTRICTS.length)
})

test('normalizeHomeDistrict keeps supported districts and falls back to all', () => {
  assert.equal(normalizeHomeDistrict({ district: '성동구' }), '성동구')
  assert.equal(normalizeHomeDistrict({ district: '성남시 분당구' }), '성남시 분당구')
  assert.equal(normalizeHomeDistrict({ district: '부산진구' }), '부산진구')
  assert.equal(normalizeHomeDistrict({ district: '없는구' }), '전체')
  assert.equal(normalizeHomeDistrict(null), '전체')
  assert.equal(isSupportedDistrict('강동구'), true)
  assert.equal(isSupportedDistrict('제주시'), true)
})

test('home API params include period and omit all-district filters', () => {
  assert.deepEqual(buildHomePlaceParams({ period: 'today', district: '전체' }), {
    period: 'today',
    limit: 5,
  })
  assert.deepEqual(buildHomeTraceParams({ period: 'month', district: '성남시 분당구' }), {
    period: 'month',
    district: '성남시 분당구',
    limit: 5,
  })
})
