import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildBoardRequestFromPlace,
  buildNearbyPlaceRequests,
  CATEGORY_FILTERS,
  MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX,
  MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX,
  MAP_BOTTOM_SHEET_CONTENT_CLASSES,
  MAP_BOTTOM_SHEET_TRANSITION_CLASSES,
  MAP_FLOATING_CONTROLS_GAP_PX,
  MAP_FLOATING_CONTROLS_TRANSITION_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  PLACE_CATEGORY_META,
  PLACE_MARKER_ICON_PATHS,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getCurrentPositionMarkerTitle,
  getFloatingControlsBottom,
  getPlaceCategoryMeta,
  inferPlaceCategoryKey,
  normalizePlaces,
} from './Map.utils.js'

const KAKAO_CATEGORY_CODES = [
  'MT1',
  'CS2',
  'PS3',
  'SC4',
  'AC5',
  'PK6',
  'OL7',
  'SW8',
  'BK9',
  'CT1',
  'AG2',
  'PO3',
  'AT4',
  'AD5',
  'FD6',
  'CE7',
  'HP8',
  'PM9',
]

test('buildNearbyPlaceRequests maps all filter to concrete backend categories', () => {
  const requests = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '전체',
  })

  assert.deepEqual(
    requests.map((request) => request.category),
    KAKAO_CATEGORY_CODES
  )
  assert.equal(requests.every((request) => request.limit === 1), true)
  assert.equal(requests[0].radius, 20000)
  assert.equal(requests[0].page, 1)
})

test('buildNearbyPlaceRequests maps visible category labels to backend values', () => {
  const [request] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '음식점',
  })

  assert.equal(request.category, 'FD6')
  assert.equal(request.limit, 15)
})

test('buildNearbyPlaceRequests maps official Kakao category labels to backend codes', () => {
  const [request] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '대형마트',
  })

  assert.equal(request.category, 'MT1')
  assert.equal(request.limit, 15)
})

test('buildNearbyPlaceRequests skips nearby lookup before a category is selected', () => {
  assert.deepEqual(
    buildNearbyPlaceRequests({
      latitude: 37.5447,
      longitude: 127.0559,
    }),
    []
  )
  assert.deepEqual(
    buildNearbyPlaceRequests({
      latitude: 37.5447,
      longitude: 127.0559,
      selectedCategory: null,
    }),
    []
  )
})

test('category filters expose stable icon names for map controls', () => {
  assert.equal(CATEGORY_FILTERS.length, 19)
  assert.deepEqual(CATEGORY_FILTERS.slice(1).map((filter) => filter.categories[0]), KAKAO_CATEGORY_CODES)
  assert.deepEqual(
    CATEGORY_FILTERS.map((filter) => filter.iconName),
    [
      'mapPinned',
      'shoppingCart',
      'store',
      'baby',
      'school',
      'graduationCap',
      'circleParking',
      'fuel',
      'trainFront',
      'banknote',
      'landmark',
      'building2',
      'building',
      'map',
      'hotel',
      'utensils',
      'coffee',
      'hospital',
      'pill',
    ]
  )
})

test('inferPlaceCategoryKey handles Korean and English category values', () => {
  assert.equal(inferPlaceCategoryKey({ groupName: '\uB300\uD615\uB9C8\uD2B8' }), 'MT1')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD3B8\uC758\uC810' }), 'CS2')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC5B4\uB9B0\uC774\uC9D1' }), 'PS3')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC720\uCE58\uC6D0' }), 'PS3')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD559\uAD50' }), 'SC4')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD559\uC6D0' }), 'AC5')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC8FC\uCC28\uC7A5' }), 'PK6')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC8FC\uC720\uC18C' }), 'OL7')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uCDA9\uC804\uC18C' }), 'OL7')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC9C0\uD558\uCCA0\uC5ED' }), 'SW8')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC740\uD589' }), 'BK9')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uBB38\uD654\uC2DC\uC124' }), 'CT1')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC911\uAC1C\uC5C5\uC18C' }), 'AG2')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uACF5\uACF5\uAE30\uAD00' }), 'PO3')
  assert.equal(inferPlaceCategoryKey({ categoryName: '\uC5EC\uD589 > \uAD00\uAD11,\uBA85\uC18C > \uB3C4\uC2DC\uADFC\uB9B0\uACF5\uC6D0' }), 'AT4')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC219\uBC15' }), 'AD5')
  assert.equal(inferPlaceCategoryKey({ category: '\uC74C\uC2DD\uC810' }), 'FD6')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uCE74\uD398' }), 'CE7')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uBCD1\uC6D0' }), 'HP8')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC57D\uAD6D' }), 'PM9')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC54C \uC218 \uC5C6\uC74C' }), 'default')
})

test('normalizePlaces keeps ambiguous lookup results styled by request category', () => {
  const [place] = normalizePlaces(
    [
      {
        requestCategory: 'AT4',
        places: [
          {
            kakaoPlaceId: 'attraction-1',
            placeName: 'Neighborhood Landmark',
            latitude: 37.5447,
            longitude: 127.0559,
            groupName: '\uC7A5\uC18C',
          },
        ],
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.equal(place.categoryKey, 'AT4')
  assert.notEqual(place.categoryKey, 'CT1')
  assert.notEqual(place.categoryKey, 'default')
})

test('normalizePlaces dedupes places and sorts nearest first', () => {
  const places = normalizePlaces(
    [
      {
        kakaoPlaceId: 'far',
        placeName: 'Far Place',
        latitude: 37.5547,
        longitude: 127.0559,
        groupName: '문화시설',
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
  assert.equal(places[0].categoryKey, 'CE7')
  assert.equal(places[1].kakaoPlaceId, 'far')
})

test('place category metadata provides warm custom marker styles with a fallback', () => {
  assert.equal(PLACE_CATEGORY_META.default.backgroundColor, '#FFFDF8')
  assert.equal(getPlaceCategoryMeta('CE7').iconName, 'coffee')
  assert.equal(getPlaceCategoryMeta('unknown'), PLACE_CATEGORY_META.default)
})

test('place marker metadata differentiates categories by small icons instead of color', () => {
  const categoryKeys = ['default', ...KAKAO_CATEGORY_CODES]

  assert.equal(new Set(categoryKeys.map((key) => PLACE_CATEGORY_META[key].markerColor)).size, 1)
  assert.equal(new Set(categoryKeys.map((key) => PLACE_CATEGORY_META[key].backgroundColor)).size, 1)
  assert.equal(PLACE_CATEGORY_META.default.markerColor, '#5A4030')
  assert.equal(categoryKeys.every((key) => PLACE_MARKER_ICON_PATHS[PLACE_CATEGORY_META[key].iconName]?.length > 0), true)
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
