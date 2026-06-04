import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ALL_DISTRICTS_LABEL,
  buildHomePlaceParams,
  buildHomeTraceParams,
  DEFAULT_HOME_PERIOD,
  filterRegionDistricts,
  filterSupportedDistricts,
  findRegionIdByDistrict,
  GYEONGGI_DISTRICTS,
  HOME_PERIOD_OPTIONS,
  isSupportedDistrict,
  normalizeHomeDistrict,
  REGION_GROUPS,
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
    ['오늘', '주간', '월간', '연간']
  )
})

test('region groups expose soft two-step tabs and combined district strings', () => {
  assert.equal(ALL_DISTRICTS_LABEL, '전체')
  assert.deepEqual(
    REGION_GROUPS.map((group) => group.label),
    ['전체', '서울', '경기', '부산', '강원', '충청', '전라', '경상', '제주']
  )
  assert.equal(SEOUL_DISTRICTS.includes('마포구'), true)
  assert.equal(GYEONGGI_DISTRICTS.includes('성남시 분당구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('부산진구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('청주시 상당구'), true)
  assert.equal(SUPPORTED_DISTRICTS.includes('제주시'), true)
})

test('filterSupportedDistricts matches partial district names across region groups', () => {
  assert.deepEqual(filterSupportedDistricts('마포'), ['마포구'])
  assert.deepEqual(filterSupportedDistricts('송파'), ['송파구'])
  assert.deepEqual(filterSupportedDistricts('분당'), ['성남시 분당구'])
  assert.deepEqual(filterSupportedDistricts('수원'), [
    '수원시 장안구',
    '수원시 권선구',
    '수원시 팔달구',
    '수원시 영통구',
  ])
  assert.deepEqual(filterSupportedDistricts('부산진'), ['부산진구'])
  assert.deepEqual(filterSupportedDistricts('제주'), ['제주시'])
  assert.deepEqual(filterSupportedDistricts('없는구'), [])
  assert.equal(filterSupportedDistricts('').length, SUPPORTED_DISTRICTS.length)
})

test('filterRegionDistricts uses the selected tab until search becomes global', () => {
  assert.deepEqual(filterRegionDistricts({ activeRegionId: 'seoul', query: '' }).slice(0, 3), [
    '전체',
    '강남구',
    '강동구',
  ])
  assert.deepEqual(filterRegionDistricts({ activeRegionId: 'gyeonggi', query: '' }).slice(0, 4), [
    '전체',
    '수원시 장안구',
    '수원시 권선구',
    '수원시 팔달구',
  ])
  assert.deepEqual(filterRegionDistricts({ activeRegionId: 'gyeonggi', query: '마포' }), ['마포구'])
  assert.deepEqual(filterRegionDistricts({ activeRegionId: 'all', query: '분당' }), ['성남시 분당구'])
})

test('findRegionIdByDistrict returns the group that owns a selected district', () => {
  assert.equal(findRegionIdByDistrict('전체'), 'all')
  assert.equal(findRegionIdByDistrict('성동구'), 'seoul')
  assert.equal(findRegionIdByDistrict('성남시 분당구'), 'gyeonggi')
  assert.equal(findRegionIdByDistrict('부산진구'), 'busan')
  assert.equal(findRegionIdByDistrict('없는구'), 'all')
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
