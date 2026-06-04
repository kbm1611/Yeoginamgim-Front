import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildBoardRequestFromPlace,
  buildNearbyPlaceRequests,
  buildPoiSearchRequest,
  buildPoiSearchRequests,
  buildPopularPlaceRequest,
  CATEGORY_FILTERS,
  MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX,
  MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX,
  MAP_BOTTOM_SHEET_CONTENT_CLASSES,
  MAP_BOTTOM_SHEET_TRANSITION_CLASSES,
  MAP_CATEGORY_FILTER_BUTTON_CLASSES,
  MAP_CATEGORY_FILTER_SCROLL_CLASSES,
  MAP_FLOATING_CONTROLS_GAP_PX,
  MAP_FLOATING_CONTROLS_TRANSITION_CLASSES,
  MAP_SEARCH_RESULTS_LIST_CLASSES,
  MAP_SEARCH_RESULTS_PANEL_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  MAP_CURRENT_LOCATION_LEVEL,
  MAP_RESULT_MAX_FIT_LEVEL,
  MAP_RESULT_SINGLE_PLACE_LEVEL,
  PLACE_CATEGORY_META,
  PLACE_MARKER_ICON_PATHS,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getCategorySelectionState,
  getCategoryToggleState,
  getCurrentPositionMarkerTitle,
  getCurrentLocationViewPlan,
  getHorizontalDragScrollLeft,
  getHorizontalDragStartState,
  getFloatingControlsBottom,
  getMapBottomUiState,
  getMapViewportPlan,
  getMarkerPlaces,
  getPlaceSelectionTransitionState,
  getPlaceInfoRows,
  getSearchResultsPanelState,
  getPlaceCategoryMeta,
  inferPlaceCategoryKey,
  normalizePlaces,
  normalizePopularPlaces,
  normalizeSearchPlaces,
} from './Map.utils.js'

const KAKAO_CATEGORY_CODES = [
  'CE7',
  'FD6',
  'CS2',
  'PARK',
  'CULTURE',
  'SHOPPING',
  'AT4',
  'EDU',
  'MT1',
  'AD5',
]

const SERVICE_CATEGORY_CODES = [
  'CE7',
  'FD6',
  'CS2',
  'PARK',
  'CULTURE',
  'SHOPPING',
  'AT4',
  'EDU',
  'MT1',
  'AD5',
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
  assert.equal(requests.every((request) => request.limit === 15), true)
  assert.equal(requests.every((request) => request.radius === 1000), true)
  assert.equal(requests[0].page, 1)
})

test('buildNearbyPlaceRequests maps visible category labels to backend values', () => {
  const [request] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '음식점 / 맛집',
  })

  assert.equal(request.category, 'FD6')
  assert.equal(request.limit, 15)
})

test('buildNearbyPlaceRequests maps service category labels to backend values', () => {
  const [request] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '마트',
  })

  assert.equal(request.category, 'MT1')
  assert.equal(request.limit, 15)

  const [educationRequest] = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '학교 / 학원',
  })

  assert.equal(educationRequest.category, 'EDU')
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

test('buildNearbyPlaceRequests is only for category marker lookups', () => {
  const requests = buildNearbyPlaceRequests({
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: null,
  })

  assert.deepEqual(requests, [])
})

test('buildPopularPlaceRequest creates a popular places lookup for the bottom sheet', () => {
  const request = buildPopularPlaceRequest({
    latitude: 37.5447,
    longitude: 127.0559,
  })

  assert.deepEqual(request, {
    latitude: 37.5447,
    longitude: 127.0559,
    radius: 1000,
    limit: 15,
  })
  assert.equal(Object.hasOwn(request, 'category'), false)
  assert.equal(Object.hasOwn(request, 'page'), false)
})

test('buildPopularPlaceRequest skips lookup without a real user location', () => {
  assert.equal(buildPopularPlaceRequest({ latitude: null, longitude: 127.0559 }), null)
  assert.equal(buildPopularPlaceRequest({ latitude: 37.5447, longitude: undefined }), null)
})

test('buildPoiSearchRequest ignores category filters for POI keyword search', () => {
  const request = buildPoiSearchRequest({
    query: '  seongsu coffee  ',
    latitude: 37.5447,
    longitude: 127.0559,
    selectedCategory: '\uCE74\uD398',
  })

  assert.deepEqual(request, {
    query: 'seongsu coffee',
    latitude: 37.5447,
    longitude: 127.0559,
    radius: 2000,
    page: 1,
    limit: 15,
  })
  assert.equal(Object.hasOwn(request, 'category'), false)
})

test('buildPoiSearchRequest skips empty keyword but does not require current position', () => {
  assert.equal(buildPoiSearchRequest({
    query: ' ',
    latitude: 37.5447,
    longitude: 127.0559,
  }), null)

  assert.deepEqual(buildPoiSearchRequest({
    query: 'coffee',
    latitude: null,
    longitude: 127.0559,
  }), {
    query: 'coffee',
    page: 1,
    limit: 15,
  })
})

test('category filters expose stable icon names for map controls', () => {
  assert.equal(CATEGORY_FILTERS.length, 11)
  assert.deepEqual(CATEGORY_FILTERS.slice(1).map((filter) => filter.categories[0]), SERVICE_CATEGORY_CODES)
  assert.deepEqual(
    CATEGORY_FILTERS.slice(1).map((filter) => filter.label),
    ['카페', '음식점 / 맛집', '편의점', '공원 / 산책로', '문화시설 / 전시 / 팝업', '쇼핑 / 소품샵 / 편집샵', '관광명소 / 포토스팟', '학교 / 학원', '마트', '숙박 / 호텔']
  )
  assert.deepEqual(
    CATEGORY_FILTERS.map((filter) => filter.iconName),
    [
      'mapPinned',
      'coffee',
      'utensils',
      'store',
      'trees',
      'landmark',
      'shoppingBag',
      'camera',
      'graduationCap',
      'shoppingCart',
      'hotel',
    ]
  )
})

test('inferPlaceCategoryKey handles Korean and English category values', () => {
  assert.equal(inferPlaceCategoryKey({ groupName: '\uB300\uD615\uB9C8\uD2B8' }), 'MT1')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD3B8\uC758\uC810' }), 'CS2')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD559\uAD50' }), 'EDU')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uD559\uC6D0' }), 'EDU')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uBB38\uD654\uC2DC\uC124' }), 'CULTURE')
  assert.equal(inferPlaceCategoryKey({ categoryName: '\uC5EC\uD589 > \uAD00\uAD11,\uBA85\uC18C > \uB3C4\uC2DC\uADFC\uB9B0\uACF5\uC6D0' }), 'PARK')
  assert.equal(inferPlaceCategoryKey({ categoryName: '\uC5EC\uD589 > \uAD00\uAD11,\uBA85\uC18C > \uD3EC\uD1A0\uC2A4\uD31F' }), 'AT4')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC18C\uD488\uC0F5' }), 'SHOPPING')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC219\uBC15' }), 'AD5')
  assert.equal(inferPlaceCategoryKey({ category: '\uC74C\uC2DD\uC810' }), 'FD6')
  assert.equal(inferPlaceCategoryKey({ placeName: '\uC131\uC218 \uBC25\uC9D1' }), 'FD6')
  assert.equal(inferPlaceCategoryKey({ placeName: '\uC131\uC218 \uC18C\uD488\uC0F5' }), 'SHOPPING')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uCE74\uD398' }), 'CE7')
  assert.equal(inferPlaceCategoryKey({ groupName: '\uC54C \uC218 \uC5C6\uC74C' }), 'default')
})

test('normalizePlaces keeps ambiguous lookup results styled by request category', () => {
  const [place] = normalizePlaces(
    [
      {
        requestCategory: 'PARK',
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

  assert.equal(place.categoryKey, 'PARK')
  assert.notEqual(place.categoryKey, 'CULTURE')
  assert.notEqual(place.categoryKey, 'default')
})

test('getPlaceInfoRows returns selected place facts without trace count row', () => {
  const rows = getPlaceInfoRows({
    placeName: 'Seongsu Cafe',
    groupName: '카페',
    address: '서울 성동구',
    phone: '',
    distanceLabel: '120m',
    traceCount: 0,
  })

  assert.deepEqual(rows, [
    { label: '주소', value: '서울 성동구' },
    { label: '카테고리', value: '카페' },
    { label: '거리', value: '120m' },
  ])
})
test('normalizePlaces dedupes places and sorts by distance first', () => {
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
  assert.equal(places[1].categoryKey, 'CULTURE')
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
    ['near-low', 'near-no-board', 'far-board']
  )
})

test('normalizePopularPlaces keeps distance as the primary bottom sheet sort', () => {
  const places = normalizePopularPlaces(
    [
      {
        kakaoPlaceId: 'near-low',
        placeName: 'Near Low',
        latitude: 37.5447,
        longitude: 127.0559,
        traceCount: 2,
      },
      {
        kakaoPlaceId: 'far-high',
        placeName: 'Far High',
        latitude: 37.5647,
        longitude: 127.0559,
        traceCount: 9,
      },
      {
        kakaoPlaceId: 'near-high',
        placeName: 'Near High',
        latitude: 37.5457,
        longitude: 127.0559,
        traceCount: 9,
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 }
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['near-low', 'near-high', 'far-high']
  )
})

test('normalizeSearchPlaces keeps service category priority above station hints for broad queries', () => {
  const places = normalizeSearchPlaces(
    [
      {
        kakaoPlaceId: 'address-only-park',
        placeName: '사육신역사공원 사육신묘',
        latitude: 37.5133,
        longitude: 126.9482,
        groupName: '관광명소',
        address: '서울 동작구 노량진로 191',
      },
      {
        kakaoPlaceId: 'subway-station',
        placeName: '노량진역',
        latitude: 37.5142,
        longitude: 126.9425,
        groupName: '지하철역',
      },
      {
        kakaoPlaceId: 'name-street',
        placeName: '노량진길벗거리',
        latitude: 37.5134,
        longitude: 126.9458,
        groupName: '관광명소',
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 },
    '노량진'
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['name-street', 'subway-station', 'address-only-park']
  )
})

test('normalizeSearchPlaces applies service category priority for broad POI queries', () => {
  const places = normalizeSearchPlaces(
    [
      {
        kakaoPlaceId: 'restaurant',
        placeName: '성수 밥집',
        groupName: '음식점',
      },
      {
        kakaoPlaceId: 'cafe',
        placeName: '성수 커피',
        groupName: '카페',
      },
      {
        kakaoPlaceId: 'culture',
        placeName: '성수 전시관',
        groupName: '문화시설',
      },
      {
        kakaoPlaceId: 'attraction',
        placeName: '성수 포토스팟',
        groupName: '관광명소',
      },
    ],
    null,
    '성수'
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['cafe', 'restaurant', 'culture', 'attraction']
  )
})

test('normalizeSearchPlaces pushes convenience mart and education lower for broad POI queries', () => {
  const places = normalizeSearchPlaces(
    [
      {
        kakaoPlaceId: 'school',
        placeName: '성수 학교',
        groupName: '학교',
      },
      {
        kakaoPlaceId: 'mart',
        placeName: '성수 마트',
        groupName: '대형마트',
      },
      {
        kakaoPlaceId: 'convenience',
        placeName: '성수 편의점',
        groupName: '편의점',
      },
      {
        kakaoPlaceId: 'culture',
        placeName: '성수 전시',
        groupName: '문화시설',
      },
      {
        kakaoPlaceId: 'food',
        placeName: '성수 맛집',
        groupName: '음식점',
      },
    ],
    null,
    '성수'
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['food', 'culture', 'convenience', 'mart', 'school']
  )
})

test('normalizeSearchPlaces honors explicit lower-priority category intent', () => {
  const hotelPlaces = normalizeSearchPlaces(
    [
      { kakaoPlaceId: 'cafe', placeName: '성수 카페', groupName: '카페' },
      { kakaoPlaceId: 'hotel', placeName: '성수 스테이', groupName: '숙박' },
    ],
    null,
    '성수 호텔'
  )
  const martPlaces = normalizeSearchPlaces(
    [
      { kakaoPlaceId: 'cafe', placeName: '성수 카페', groupName: '카페' },
      { kakaoPlaceId: 'mart', placeName: '성수 마트', groupName: '대형마트' },
    ],
    null,
    '성수 마트'
  )
  const schoolPlaces = normalizeSearchPlaces(
    [
      { kakaoPlaceId: 'cafe', placeName: '성수 카페', groupName: '카페' },
      { kakaoPlaceId: 'school', placeName: '성수 학교', groupName: '학교' },
    ],
    null,
    '성수 학교'
  )

  assert.equal(hotelPlaces[0].kakaoPlaceId, 'hotel')
  assert.equal(martPlaces[0].kakaoPlaceId, 'mart')
  assert.equal(schoolPlaces[0].kakaoPlaceId, 'school')
})

test('normalizeSearchPlaces preserves Kakao accuracy order when local relevance is unknown', () => {
  const places = normalizeSearchPlaces(
    [
      {
        kakaoPlaceId: 'api-first-far',
        placeName: 'Alpha Place',
        latitude: 37.5647,
        longitude: 127.0559,
      },
      {
        kakaoPlaceId: 'api-second-near',
        placeName: 'Beta Place',
        latitude: 37.5447,
        longitude: 127.0559,
      },
    ],
    { latitude: 37.5447, longitude: 127.0559 },
    'museum'
  )

  assert.deepEqual(
    places.map((place) => place.kakaoPlaceId),
    ['api-first-far', 'api-second-near']
  )
})

test('buildPoiSearchRequests supplements short Korean place queries with a station query', () => {
  const requests = buildPoiSearchRequests({
    query: ' 노량진 ',
    latitude: 37.5142,
    longitude: 126.9425,
    selectedCategory: '공원 / 산책로',
  })

  assert.deepEqual(
    requests.map((request) => request.query),
    ['노량진역', '노량진']
  )
  assert.equal(requests.every((request) => !Object.hasOwn(request, 'category')), true)
  assert.equal(requests.every((request) => request.radius === 2000), true)
})

test('buildPoiSearchRequests does not duplicate queries that already end with station', () => {
  assert.deepEqual(
    buildPoiSearchRequests({ query: '노량진역' }).map((request) => request.query),
    ['노량진역']
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

test('marker places show popular markers until category results are active', () => {
  const popularPlaces = [
    { kakaoPlaceId: 'popular-1', placeName: 'Popular One' },
    { kakaoPlaceId: 'popular-2', placeName: 'Popular Two' },
  ]

  assert.deepEqual(
    getMarkerPlaces({
      categoryPlaces: [],
      popularPlaces,
      selectedCategory: null,
      selectedPlaceId: null,
    }),
    popularPlaces
  )
})

test('marker places prefer POI search results while search is active', () => {
  const searchPlaces = [
    { kakaoPlaceId: 'search-1', placeName: 'Search One' },
    { kakaoPlaceId: 'search-2', placeName: 'Search Two' },
  ]
  const categoryPlaces = [
    { kakaoPlaceId: 'category-1', placeName: 'Category One' },
  ]
  const popularPlaces = [
    { kakaoPlaceId: 'popular-1', placeName: 'Popular One' },
  ]

  assert.deepEqual(
    getMarkerPlaces({
      searchPlaces,
      categoryPlaces,
      popularPlaces,
      selectedCategory: '\uCE74\uD398',
      isSearchActive: true,
    }).map((place) => place.kakaoPlaceId),
    ['search-1', 'search-2']
  )
})

test('marker places keep selected POI and nearby category icons after a search result is selected', () => {
  const searchPlaces = [
    { kakaoPlaceId: 'search-cafe', placeName: 'Search Cafe', categoryKey: 'CE7' },
    { kakaoPlaceId: 'search-park', placeName: 'Search Park', categoryKey: 'PARK' },
  ]
  const categoryPlaces = [
    { kakaoPlaceId: 'old-category', placeName: 'Old Category', categoryKey: 'FD6' },
  ]
  const popularPlaces = [
    { kakaoPlaceId: 'near-food', placeName: 'Nearby Food', categoryKey: 'FD6' },
    { kakaoPlaceId: 'near-store', placeName: 'Nearby Store', categoryKey: 'CS2' },
  ]

  const markerPlaces = getMarkerPlaces({
    searchPlaces,
    categoryPlaces,
    popularPlaces,
    selectedCategory: '\uCE74\uD398',
    selectedPlaceId: 'search-cafe',
    isSearchActive: true,
  })

  assert.deepEqual(
    markerPlaces.map((place) => [place.kakaoPlaceId, place.categoryKey]),
    [
      ['search-cafe', 'CE7'],
      ['near-food', 'FD6'],
      ['near-store', 'CS2'],
    ]
  )
})

test('marker places keep focused POI nearby markers after the selected panel closes', () => {
  const searchPlaces = [
    { kakaoPlaceId: 'search-cafe', placeName: 'Search Cafe', categoryKey: 'CE7' },
    { kakaoPlaceId: 'search-park', placeName: 'Search Park', categoryKey: 'PARK' },
  ]
  const popularPlaces = [
    { kakaoPlaceId: 'near-food', placeName: 'Nearby Food', categoryKey: 'FD6' },
    { kakaoPlaceId: 'near-store', placeName: 'Nearby Store', categoryKey: 'CS2' },
  ]

  const markerPlaces = getMarkerPlaces({
    searchPlaces,
    popularPlaces,
    focusedSearchPlaceId: 'search-cafe',
    selectedPlaceId: null,
    isSearchActive: true,
  })

  assert.deepEqual(
    markerPlaces.map((place) => [place.kakaoPlaceId, place.categoryKey]),
    [
      ['search-cafe', 'CE7'],
      ['near-food', 'FD6'],
      ['near-store', 'CS2'],
    ]
  )
})

test('marker places keep filtered markers and add a selected popular marker only when needed', () => {
  const categoryPlaces = [
    { kakaoPlaceId: 'category-1', placeName: 'Category One' },
  ]
  const popularPlaces = [
    { kakaoPlaceId: 'popular-1', placeName: 'Popular One' },
    { kakaoPlaceId: 'category-1', placeName: 'Category One Duplicate' },
  ]

  assert.deepEqual(
    getMarkerPlaces({
      categoryPlaces,
      popularPlaces,
      selectedCategory: '\uCE74\uD398',
      selectedPlaceId: 'popular-1',
    }).map((place) => place.kakaoPlaceId),
    ['category-1', 'popular-1']
  )

  assert.deepEqual(
    getMarkerPlaces({
      categoryPlaces,
      popularPlaces,
      selectedCategory: '\uCE74\uD398',
      selectedPlaceId: null,
    }).map((place) => place.kakaoPlaceId),
    ['category-1']
  )
})


test('getCurrentLocationViewPlan keeps current location moves at a stable map level', () => {
  const plan = getCurrentLocationViewPlan({
    latitude: 37.5447,
    longitude: 127.0559,
  })

  assert.deepEqual(plan, {
    center: {
      latitude: 37.5447,
      longitude: 127.0559,
    },
    level: MAP_CURRENT_LOCATION_LEVEL,
  })
  assert.equal(MAP_CURRENT_LOCATION_LEVEL, 5)
})

test('getCurrentLocationViewPlan skips invalid current location coordinates', () => {
  assert.equal(getCurrentLocationViewPlan({ latitude: null, longitude: 127.0559 }), null)
  assert.equal(getCurrentLocationViewPlan({ latitude: 37.5447, longitude: undefined }), null)
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

test('horizontal drag helpers convert mouse drag distance into bounded scrollLeft', () => {
  const dragState = getHorizontalDragStartState({
    pointerType: 'mouse',
    button: 0,
    clientX: 240,
    scrollLeft: 30,
    scrollWidth: 900,
    clientWidth: 320,
  })

  assert.deepEqual(dragState, {
    startX: 240,
    startScrollLeft: 30,
    isDragging: false,
  })

  assert.deepEqual(
    getHorizontalDragScrollLeft(dragState, {
      clientX: 180,
      scrollWidth: 900,
      clientWidth: 320,
    }),
    {
      scrollLeft: 90,
      isDragging: true,
    }
  )

  assert.deepEqual(
    getHorizontalDragScrollLeft(dragState, {
      clientX: 940,
      scrollWidth: 900,
      clientWidth: 320,
    }),
    {
      scrollLeft: 0,
      isDragging: true,
    }
  )
})

test('horizontal drag helpers ignore non-scrollable rows and non-primary mouse buttons', () => {
  assert.equal(getHorizontalDragStartState({
    pointerType: 'mouse',
    button: 0,
    clientX: 120,
    scrollLeft: 0,
    scrollWidth: 320,
    clientWidth: 320,
  }), null)

  assert.equal(getHorizontalDragStartState({
    pointerType: 'mouse',
    button: 2,
    clientX: 120,
    scrollLeft: 0,
    scrollWidth: 900,
    clientWidth: 320,
  }), null)
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
  assert.equal(MAP_RESULT_MAX_FIT_LEVEL, 9)
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
  assert.deepEqual(state.categoryPlaces, [])
  assert.equal(state.selectedPlaceId, null)
  assert.equal(state.categoryPlacesStatus, 'loading')
  assert.equal(state.categoryPlacesError, '')
  assert.equal(state.boardError, '')
  assert.equal(Object.hasOwn(state, 'isSheetOpen'), false)
  assert.equal(Object.hasOwn(state, 'popularPlaces'), false)
  assert.equal(Object.hasOwn(state, 'popularPlacesStatus'), false)
})

test('category toggle state clears active category when the same filter is selected again', () => {
  const state = getCategoryToggleState('\uCE74\uD398', '\uCE74\uD398')

  assert.equal(state.selectedCategory, null)
  assert.deepEqual(state.categoryPlaces, [])
  assert.equal(state.selectedPlaceId, null)
  assert.equal(state.categoryPlacesStatus, 'idle')
  assert.equal(state.categoryPlacesError, '')
  assert.equal(state.boardError, '')
})

test('place selection transition resets the detail panel before opening the next place', () => {
  assert.deepEqual(getPlaceSelectionTransitionState('next-place'), {
    selectedPlaceId: null,
    nextSelectedPlaceId: 'next-place',
    openingPlaceId: null,
    boardError: '',
  })
})

test('search results panel renders only for open search feedback', () => {
  assert.deepEqual(getSearchResultsPanelState({
    isOpen: false,
    searchStatus: 'success',
    searchNotice: '',
    resultCount: 3,
  }), {
    shouldRender: false,
    hasResults: false,
  })

  assert.deepEqual(getSearchResultsPanelState({
    isOpen: true,
    searchStatus: 'idle',
    searchNotice: '\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.',
    resultCount: 0,
  }), {
    shouldRender: true,
    hasResults: false,
  })

  assert.deepEqual(getSearchResultsPanelState({
    isOpen: true,
    searchStatus: 'success',
    searchNotice: '',
    resultCount: 2,
  }), {
    shouldRender: true,
    hasResults: true,
  })
})

test('search result dropdown classes keep the list vertical and internally scrollable', () => {
  assert.match(MAP_SEARCH_RESULTS_PANEL_CLASSES, /z-\[45\]/)
  assert.match(MAP_SEARCH_RESULTS_LIST_CLASSES, /flex-col/)
  assert.match(MAP_SEARCH_RESULTS_LIST_CLASSES, /overflow-y-auto/)
  assert.match(MAP_SEARCH_RESULTS_LIST_CLASSES, /max-h-\[/)
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

test('map bottom ui keeps controls outside the detail panel while a place is selected', () => {
  assert.deepEqual(getMapBottomUiState({ hasSelectedPlace: false }), {
    showBottomSheet: true,
    showFloatingControls: true,
    showSelectedPlacePanel: false,
    selectedPanelControlsPlacement: 'bottom-sheet-edge',
  })

  assert.deepEqual(getMapBottomUiState({ hasSelectedPlace: true }), {
    showBottomSheet: false,
    showFloatingControls: true,
    showSelectedPlacePanel: true,
    selectedPanelControlsPlacement: 'selected-panel-edge',
  })
})
