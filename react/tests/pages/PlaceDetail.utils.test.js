import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildPlaceDetailFromBoardDetail,
  buildRecentTraceCards,
  getPlaceDetailRows,
  getTraceCountText,
  mergeBoardDetailIntoPlace,
  resolveBoardNavigationId,
} from '../../src/utils/pages/PlaceDetail.utils.js'

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

test('buildPlaceDetailFromBoardDetail returns null instead of falling back to mock data', () => {
  assert.equal(buildPlaceDetailFromBoardDetail(null), null)
  assert.equal(buildPlaceDetailFromBoardDetail({ traceCount: 2 }), null)
})

test('buildPlaceDetailFromBoardDetail exposes only board-backed place fields', () => {
  const place = buildPlaceDetailFromBoardDetail({
    boardId: 11,
    kakaoPlaceId: 'kakao-123',
    traceCount: '7',
    place: {
      placeName: '성수 카페',
      address: '서울 성동구',
      groupName: '카페',
      kakaoPlaceId: 'kakao-123',
      latitude: 37.5447,
      longitude: 127.0559,
      phone: '02-123-4567',
      kakaoMapUrl: 'https://place.map.kakao.com/123',
    },
  })

  assert.equal(place.name, '성수 카페')
  assert.equal(place.address, '서울 성동구')
  assert.equal(place.category, '카페')
  assert.equal(place.kakaoPlaceId, 'kakao-123')
  assert.equal(place.stats.traces, 7)
  assert.equal(Object.hasOwn(place, 'intro'), false)
  assert.equal(Object.hasOwn(place, 'tags'), false)
  assert.equal(Object.hasOwn(place, 'images'), false)
})

test('buildRecentTraceCards maps board traces without mock fallback', () => {
  const cards = buildRecentTraceCards(
    {
      traces: [
        {
          traceId: 21,
          nickname: '여김이',
          createdAt: '2026-06-05T01:00:00.000Z',
          likeCount: 3,
          elements: [
            {
              contentType: 'POLAROID',
              textContent: '창가 자리',
              imageUrl: '/uploads/trace/21.png',
            },
          ],
        },
        {
          traceId: 22,
          nickname: '',
          createdAt: '2026-06-04T01:00:00.000Z',
          likeCount: null,
          elements: [{ contentType: 'TEXT', textContent: '조용한 오후', styleJson: '{"paperColor":"#F5EDD5"}' }],
        },
      ],
    },
    { now: new Date('2026-06-05T03:00:00.000Z').getTime() },
  )

  assert.deepEqual(cards, [
    {
      id: 21,
      type: 'photo',
      image: '/uploads/trace/21.png',
      text: '창가 자리',
      user: '여김이',
      time: '2시간 전',
      likes: 3,
    },
    {
      id: 22,
      type: 'note',
      noteBg: '#F5EDD5',
      text: '조용한 오후',
      date: '2026.06.04',
      user: '익명',
      time: '1일 전',
      likes: 0,
    },
  ])

  assert.deepEqual(buildRecentTraceCards({ traces: null }), [])
})
