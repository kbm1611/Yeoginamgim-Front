import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getPlaceDetailRows,
  getTraceCountText,
  mergeBoardDetailIntoPlace,
  resolveBoardNavigationId,
} from './PlaceDetail.utils.js'

test('mergeBoardDetailIntoPlace uses board place info and traceCount for place detail card', () => {
  const place = {
    name: 'Mock Cafe',
    address: 'Mock Address',
    category: 'Mock Category',
    stats: { traces: 0, todayVisit: 37, likes: '2.4k' },
  }

  const merged = mergeBoardDetailIntoPlace(place, {
    boardId: 11,
    kakaoPlaceId: 'kakao-123',
    traceCount: '12',
    place: {
      placeName: 'Seongsu Cafe',
      address: 'Seoul Seongsu',
      groupName: 'Cafe',
      kakaoPlaceId: 'kakao-123',
      latitude: 37.5447,
      longitude: 127.0559,
    },
  })

  assert.equal(merged.name, 'Seongsu Cafe')
  assert.equal(merged.address, 'Seoul Seongsu')
  assert.equal(merged.category, 'Cafe')
  assert.equal(merged.kakaoPlaceId, 'kakao-123')
  assert.equal(merged.latitude, 37.5447)
  assert.equal(merged.longitude, 127.0559)
  assert.equal(merged.stats.traces, 12)
})

test('mergeBoardDetailIntoPlace keeps existing trace count when board traceCount is missing', () => {
  const place = {
    name: 'Mock Cafe',
    stats: { traces: 4, todayVisit: 37, likes: '2.4k' },
  }

  assert.deepEqual(mergeBoardDetailIntoPlace(place, { traceCount: null }), place)
})

test('getPlaceDetailRows formats missing and coordinate values safely', () => {
  assert.deepEqual(
    getPlaceDetailRows({
      kakaoPlaceId: 'kakao-123',
      latitude: 37.544712,
      longitude: 127.055912,
      phone: '',
    }),
    [
      { label: 'Kakao place id', value: 'kakao-123' },
      { label: '좌표', value: '37.544712, 127.055912' },
      { label: '전화', value: '정보 없음' },
    ],
  )
})

test('getTraceCountText handles loading, error, missing, and zero states', () => {
  assert.equal(getTraceCountText(null, 'loading'), '확인 중')
  assert.equal(getTraceCountText(null, 'error'), '확인 필요')
  assert.equal(getTraceCountText(null, 'ready'), '0개')
  assert.equal(getTraceCountText(0, 'ready'), '0개')
  assert.equal(getTraceCountText(12, 'ready'), '12개')
})

test('resolveBoardNavigationId prefers response boardId', () => {
  assert.equal(resolveBoardNavigationId('kakao-123', { boardId: 11 }), 11)
  assert.equal(resolveBoardNavigationId('kakao-123', null), 'kakao-123')
})
