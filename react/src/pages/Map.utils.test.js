import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildBoardRequestFromPlace,
  buildNearbyPlaceRequests,
  MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX,
  MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX,
  MAP_BOTTOM_SHEET_CONTENT_CLASSES,
  MAP_BOTTOM_SHEET_TRANSITION_CLASSES,
  MAP_FLOATING_CONTROLS_GAP_PX,
  MAP_FLOATING_CONTROLS_TRANSITION_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getCurrentPositionMarkerTitle,
  getFloatingControlsBottom,
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

test('bottom sheet helpers keep the sheet height fixed and toggle by transform', () => {
  assert.equal(getBottomSheetTransform(true), 'translateY(0)')
  assert.equal(getBottomSheetTransform(false), 'translateY(calc(100% - 56px))')
})

test('bottom sheet toggle label reflects the next action', () => {
  assert.equal(getBottomSheetToggleLabel(false), '\uC8FC\uBCC0 \uC778\uAE30 \uACF5\uAC04 \uC5F4\uAE30')
  assert.equal(getBottomSheetToggleLabel(true), '\uC8FC\uBCC0 \uC778\uAE30 \uACF5\uAC04 \uB2EB\uAE30')
})

test('place list scroll classes enable smooth horizontal snapping', () => {
  assert.match(MAP_PLACE_LIST_SCROLL_CLASSES, /scroll-smooth/)
  assert.match(MAP_PLACE_LIST_SCROLL_CLASSES, /snap-x/)
  assert.match(MAP_PLACE_LIST_SCROLL_CLASSES, /snap-mandatory/)
  assert.match(MAP_PLACE_CARD_SCROLL_CLASSES, /snap-start/)
})

test('bottom sheet animation classes use a slower eased transform with reduced motion support', () => {
  assert.match(MAP_BOTTOM_SHEET_TRANSITION_CLASSES, /transition-transform/)
  assert.match(MAP_BOTTOM_SHEET_TRANSITION_CLASSES, /duration-\[480ms\]/)
  assert.match(MAP_BOTTOM_SHEET_TRANSITION_CLASSES, /ease-\[cubic-bezier\(0\.22,1,0\.36,1\)\]/)
  assert.match(MAP_BOTTOM_SHEET_TRANSITION_CLASSES, /motion-reduce:duration-\[1ms\]/)
})

test('bottom sheet content fades in after the panel starts opening', () => {
  assert.match(MAP_BOTTOM_SHEET_CONTENT_CLASSES, /transition-opacity/)
  assert.match(MAP_BOTTOM_SHEET_CONTENT_CLASSES, /duration-\[220ms\]/)
  assert.match(MAP_BOTTOM_SHEET_CONTENT_CLASSES, /delay-\[120ms\]/)
  assert.match(MAP_BOTTOM_SHEET_CONTENT_CLASSES, /motion-reduce:delay-0/)
})

test('floating controls bottom follows the bottom sheet visible edge', () => {
  assert.equal(MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX, 90)
  assert.equal(MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX, 56)
  assert.equal(MAP_FLOATING_CONTROLS_GAP_PX, 12)
  assert.equal(getFloatingControlsBottom(false), 'calc(90px + 56px + 12px)')
  assert.equal(getFloatingControlsBottom(true), 'calc(90px + min(420px, 58%) + 12px)')
})

test('floating controls animate with the same timing as the bottom sheet', () => {
  assert.match(MAP_FLOATING_CONTROLS_TRANSITION_CLASSES, /transition-\[bottom\]/)
  assert.match(MAP_FLOATING_CONTROLS_TRANSITION_CLASSES, /duration-\[480ms\]/)
  assert.match(MAP_FLOATING_CONTROLS_TRANSITION_CLASSES, /ease-\[cubic-bezier\(0\.22,1,0\.36,1\)\]/)
  assert.match(MAP_FLOATING_CONTROLS_TRANSITION_CLASSES, /motion-reduce:duration-\[1ms\]/)
})
