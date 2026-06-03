import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildBoardRequestFromPlace,
  buildNearbyPlaceRequests,
  getCurrentPositionMarkerTitle,
  normalizePlaces,
} from './Map.utils.js'

test('buildNearbyPlaceRequests maps all filter to concrete backend categories', () => {
  const requests = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '전체',
  })

  assert.deepEqual(
    requests.map((request) => request.category),
    ['cafe', 'food', 'shop', 'park', 'culture']
  )
  assert.equal(requests.every((request) => request.limit === 5), true)
  assert.equal(requests[0].radius, 20000)
  assert.equal(requests[0].page, 1)
})

test('buildNearbyPlaceRequests maps visible category labels to backend values', () => {
  const [request] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '맛집',
  })

  assert.equal(request.category, 'food')
  assert.equal(request.limit, 15)
})

test('normalizePlaces dedupes places and sorts nearest first', () => {
  const places = normalizePlaces(
    [
      {
        kakaoPlaceId: 'far',
        placeName: 'Far Place',
        latitude: 37.5547,
        longitude: 127.0559,
        groupName: '문화',
        traceCount: 4,
      },
      {
        kakaoPlaceId: 'near',
        placeName: 'Near Place',
        latitude: 37.5447,
        longitude: 127.0559,
        groupName: '카페',
        traceCount: 1,
        boardId: 7,
      },
      {
        kakaoPlaceId: 'near',
        placeName: 'Duplicate Near Place',
        latitude: 37.5447,
        longitude: 127.0559,
        groupName: '카페',
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.equal(places.length, 2)
  assert.equal(places[0].kakaoPlaceId, 'near')
  assert.equal(places[0].distanceMeters, 0)
  assert.equal(places[0].distanceLabel, '0m')
  assert.equal(places[0].hasBoard, true)
  assert.equal(places[1].kakaoPlaceId, 'far')
})

test('buildBoardRequestFromPlace keeps the place snapshot required by board creation', () => {
  const request = buildBoardRequestFromPlace({
    kakaoPlaceId: '12345',
    placeName: 'Seongsu Cafe',
    latitude: 37.5447,
    longitude: 127.0559,
    phone: '02-000-0000',
    address: 'Seoul Seongsu',
    kakaoMapUrl: 'https://place.map.kakao.com/12345',
    groupName: '카페',
  })

  assert.deepEqual(request, {
    kakaoPlaceId: '12345',
    placeName: 'Seongsu Cafe',
    latitude: 37.5447,
    longitude: 127.0559,
    phone: '02-000-0000',
    address: 'Seoul Seongsu',
    kakaoMapUrl: 'https://place.map.kakao.com/12345',
    groupName: '카페',
  })
}
)

test('getCurrentPositionMarkerTitle describes real and fallback positions', () => {
  assert.equal(getCurrentPositionMarkerTitle('success'), '현재 위치')
  assert.equal(getCurrentPositionMarkerTitle('fallback'), '성수동 기준 위치')
  assert.equal(getCurrentPositionMarkerTitle('loading'), '위치 확인 중')
})
