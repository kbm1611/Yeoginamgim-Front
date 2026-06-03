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
  MAP_CATEGORY_FILTER_BUTTON_CLASSES,
  MAP_CATEGORY_FILTER_SCROLL_CLASSES,
  MAP_FLOATING_CONTROLS_GAP_PX,
  MAP_FLOATING_CONTROLS_TRANSITION_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  MAP_RESULT_MAX_FIT_LEVEL,
  MAP_RESULT_SINGLE_PLACE_LEVEL,
  PLACE_CATEGORY_META,
  PLACE_MARKER_ICON_PATHS,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getCategorySelectionState,
  getCurrentPositionMarkerTitle,
  getFloatingControlsBottom,
  getMapViewportPlan,
  getPlaceCategoryMeta,
  inferPlaceCategoryKey,
  normalizePlaces,
} from './Map.utils.js'

const KAKAO_CATEGORY_CODES = [
  'CT1',
  'FD6',
  'CE7',
  'AT4',
  'CS2',
  'MT1',
  'SW8',
  'PK6',
  'BK9',
  'HP8',
  'PM9',
  'SC4',
  'AC5',
  'PS3',
  'PO3',
  'AG2',
  'AD5',
  'OL7',
]

const SERVICE_CATEGORY_CODES = [
  'CE7',
  'FD6',
  'CT1',
  'AT4',
  'CS2',
  'MT1',
  'SW8',
  'PK6',
  'BK9',
  'HP8',
  'PM9',
  'SC4',
  'AC5',
  'PS3',
  'PO3',
  'AG2',
  'AD5',
  'OL7',
]

test('buildNearbyPlaceRequests maps all filter to concrete backend categories', () => {
  const requests = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '전체',
  })

  assert.deepEqual(
    requests.map((request) => request.category),
    SERVICE_CATEGORY_CODES
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
  assert.deepEqual(CATEGORY_FILTERS.slice(1).map((filter) => filter.categories[0]), SERVICE_CATEGORY_CODES)
  assert.deepEqual(
    CATEGORY_FILTERS.slice(1).map((filter) => filter.label),
    ['카페', '음식점', '문화시설', '관광명소', '편의점', '대형마트', '지하철역', '주차장', '은행', '병원', '약국', '학교', '학원', '어린이집·유치원', '공공기관', '중개업소', '숙박', '주유소·충전소']
  )
  assert.deepEqual(
    CATEGORY_FILTERS.map((filter) => filter.iconName),
    [
      'mapPinned',
      'coffee',
      'utensils',
      'landmark',
      'map',
      'store',
      'shoppingCart',
      'trainFront',
      'circleParking',
      'banknote',
      'hospital',
      'pill',
      'school',
      'graduationCap',
      'baby',
      'building',
      'building2',
      'hotel',
      'fuel',
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

test('normalizePlaces dedupes places and sorts by trace count first', () => {
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
  assert.equal(places[0].kakaoPlaceId, 'far')
  assert.equal(places[0].categoryKey, 'CT1')
  assert.equal(places[1].kakaoPlaceId, 'near')
  assert.equal(places[1].distanceMeters, 0)
  assert.equal(places[1].distanceLabel, '0m')
  assert.equal(places[1].hasBoard, true)
  assert.equal(places[1].categoryKey, 'CE7')
})

test('normalizePlaces uses distance before board state when trace counts tie', () => {
  const places = normalizePlaces(
    [
      {
        kakaoPlaceId: 'far-board',
        placeName: 'Far Board',
        latitude: 37.5647,
        longitude: 127.0559,
        groupName: '카페',
        traceCount: 8,
        boardId: 4,
      },
      {
        kakaoPlaceId: 'near-no-board',
        placeName: 'Near No Board',
        latitude: 37.5457,
        longitude: 127.0559,
        groupName: '카페',
        traceCount: 8,
      },
      {
        kakaoPlaceId: 'near-low',
        placeName: 'Near Low',
        latitude: 37.5447,
        longitude: 127.0559,
        groupName: '카페',
        traceCount: 1,
        boardId: 3,
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['near-no-board', 'far-board', 'near-low']
  )
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

test('category filter classes keep chips in one horizontal scroll row', () => {
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /overflow-x-scroll/)
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /overflow-y-hidden/)
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /flex-nowrap/)
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /whitespace-nowrap/)
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /snap-x/)
  assert.match(MAP_CATEGORY_FILTER_SCROLL_CLASSES, /touch-action:pan-x/)
  assert.match(MAP_CATEGORY_FILTER_BUTTON_CLASSES, /shrink-0/)
  assert.match(MAP_CATEGORY_FILTER_BUTTON_CLASSES, /snap-start/)
})

test('map viewport plan leaves the current view alone when no place markers exist', () => {
  const plan = getMapViewportPlan([], { latitude: 37.5447, longitude: 127.0559 })

  assert.deepEqual(plan, {
    type: 'none',
    points: [],
  })
})

test('map viewport plan focuses a single result at a close level', () => {
  const plan = getMapViewportPlan(
    [
      {
        kakaoPlaceId: 'single',
        latitude: 37.5457,
        longitude: 127.0569,
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.equal(plan.type, 'single')
  assert.deepEqual(plan.center, {
    latitude: 37.5457,
    longitude: 127.0569,
  })
  assert.equal(plan.level, MAP_RESULT_SINGLE_PLACE_LEVEL)
})

test('map viewport plan fits multiple results with the current position and max level cap', () => {
  const plan = getMapViewportPlan(
    [
      {
        kakaoPlaceId: 'first',
        latitude: 37.5457,
        longitude: 127.0569,
      },
      {
        kakaoPlaceId: 'second',
        latitude: 37.5497,
        longitude: 127.0509,
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.equal(plan.type, 'bounds')
  assert.equal(plan.maxLevel, MAP_RESULT_MAX_FIT_LEVEL)
  assert.deepEqual(
    plan.points.map((point) => point.kind),
    ['place', 'place', 'current']
  )
  assert.deepEqual(plan.points.at(-1), {
    kind: 'current',
    latitude: 37.5447,
    longitude: 127.0559,
  })
})

test('category selection state clears the previous selected place before loading', () => {
  const state = getCategorySelectionState('\uCE74\uD398')

  assert.equal(state.selectedCategory, '\uCE74\uD398')
  assert.deepEqual(state.places, [])
  assert.equal(state.selectedPlaceId, null)
  assert.equal(state.placesStatus, 'loading')
  assert.equal(state.placesError, '')
  assert.equal(state.boardError, '')
  assert.equal(state.isSheetOpen, true)
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
