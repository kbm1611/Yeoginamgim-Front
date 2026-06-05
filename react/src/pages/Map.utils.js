export { buildBoardRequestFromPlace } from '../api/boards.utils.js'

export const DEFAULT_MAP_CENTER = {
  latitude: 37.5447,
  longitude: 127.0559,
  label: '성수동',
}

export const NEARBY_RADIUS_METERS = 1000
export const POI_SEARCH_RADIUS_METERS = 2000
export const NEARBY_LIMIT = 15
export const MAP_BOTTOM_SHEET_OPEN_HEIGHT = 'min(420px, 58%)'
export const MAP_BOTTOM_SHEET_HEIGHT = MAP_BOTTOM_SHEET_OPEN_HEIGHT
export const MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX = 90
export const MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX = 56
export const MAP_FLOATING_CONTROLS_GAP_PX = 12
export const MAP_SELECTED_PLACE_PANEL_HEIGHT = 'min(390px, 52%)'
export const MAP_SELECTED_PLACE_PANEL_CONTROLS_BOTTOM = `calc(${MAP_SELECTED_PLACE_PANEL_HEIGHT} + ${MAP_FLOATING_CONTROLS_GAP_PX}px)`
export const MAP_BOTTOM_SHEET_CLOSED_TRANSFORM = 'translateY(calc(100% - 56px))'
const MAP_SHARED_MOTION_CLASSES = 'duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-[1ms]'
export const MAP_BOTTOM_SHEET_TRANSITION_CLASSES = `transition-transform ${MAP_SHARED_MOTION_CLASSES}`
export const MAP_FLOATING_CONTROLS_TRANSITION_CLASSES = `transition-[bottom] ${MAP_SHARED_MOTION_CLASSES}`
const MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES = 'h-[calc(100%-56px)] transition-opacity duration-[220ms] ease-out motion-reduce:delay-0 motion-reduce:duration-[1ms]'
export const MAP_BOTTOM_SHEET_CONTENT_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} opacity-100 delay-[120ms]`
export const MAP_BOTTOM_SHEET_CONTENT_CLOSED_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} pointer-events-none opacity-0 delay-0`
export const MAP_PLACE_LIST_SCROLL_CLASSES = 'scrollbar-hide flex h-[calc(100%-34px)] snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-smooth pb-1'
export const MAP_PLACE_CARD_SCROLL_CLASSES = 'snap-start scroll-ml-1'
export const MAP_SEARCH_RESULTS_PANEL_CLASSES =
  'relative z-[45] mb-2 overflow-hidden rounded-[20px] border border-[#EDE4D8] bg-white/97 shadow-[0_10px_24px_rgba(61,36,21,0.12)] backdrop-blur-sm'
export const MAP_SEARCH_RESULTS_LIST_CLASSES =
  'scrollbar-hide flex max-h-[min(320px,calc(100dvh-260px))] flex-col overflow-y-auto overscroll-contain'
export const MAP_CATEGORY_FILTER_SCROLL_CLASSES =
  'scrollbar-hide mt-3 flex w-full snap-x snap-proximity flex-nowrap gap-2 overflow-x-scroll overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 whitespace-nowrap select-none cursor-grab active:cursor-grabbing [touch-action:pan-x] [-webkit-overflow-scrolling:touch]'
export const MAP_CATEGORY_FILTER_BUTTON_CLASSES =
  'inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] transition'
export const MAP_CURRENT_LOCATION_LEVEL = 5
export const MAP_RESULT_SINGLE_PLACE_LEVEL = 4
export const MAP_SELECTED_PLACE_LEVEL = 4
export const MAP_RESULT_MAX_FIT_LEVEL = 9
export const MAP_RESULT_VIEWPORT_PADDING = {
  top: 150,
  right: 36,
  bottom: 300,
  left: 36,
}

const PLACE_CATEGORY_DEFINITIONS = [
  { code: 'CE7', label: '카페', iconName: 'coffee', aliases: ['cafe', 'coffee', '커피'] },
  { code: 'FD6', label: '음식점 / 맛집', iconName: 'utensils', aliases: ['food', 'restaurant', 'dining', '맛집', '음식', '음식점', '식당'] },
  { code: 'CULTURE', label: '문화시설 / 전시 / 팝업', iconName: 'landmark', aliases: ['CT1', 'culture', 'cultural_facility', 'exhibition', 'popup', '문화', '문화시설', '전시', '팝업', '팝업스토어'] },
  { code: 'AT4', label: '관광명소 / 포토스팟', iconName: 'camera', aliases: ['attraction', 'tour', 'tourist_attraction', 'photo_spot', '관광', '관광명소', '명소', '포토스팟', '사진명소'] },
  { code: 'SHOPPING', label: '쇼핑 / 소품샵 / 편집샵', iconName: 'shoppingBag', aliases: ['shopping', 'shop', 'select_shop', 'lifestyle_shop', '쇼핑', '소품샵', '편집샵', '상점'] },
  { code: 'AD5', label: '숙박 / 호텔', iconName: 'hotel', aliases: ['lodging', 'accommodation', 'hotel', '숙박', '호텔'] },
  { code: 'PARK', label: '공원 / 산책로', iconName: 'trees', aliases: ['park', 'trail', 'walk', 'walking_trail', '공원', '산책로', '둘레길'] },
  { code: 'CS2', label: '편의점', iconName: 'store', aliases: ['convenience', 'convenience_store', 'store'] },
  { code: 'MT1', label: '마트', iconName: 'shoppingCart', aliases: ['mart', 'large_mart', 'largemart', 'market', 'supermarket', '대형마트', '마트'] },
  { code: 'EDU', label: '학교 / 학원', iconName: 'graduationCap', aliases: ['SC4', 'AC5', 'school', 'academy', 'hagwon', '학교', '학원'] },
]

const ALL_PLACE_CATEGORY_VALUES = PLACE_CATEGORY_DEFINITIONS.map((category) => category.code)
const CATEGORY_LABELS = Object.fromEntries(PLACE_CATEGORY_DEFINITIONS.map(({ code, label }) => [code, label]))
const CATEGORY_CODE_BY_ALIAS = buildCategoryCodeByAlias()
const CATEGORY_PATTERNS = [
  { code: 'PARK', pattern: /(park|trail|walk|공원|산책로|둘레길|도시근린공원)/ },
  { code: 'CULTURE', pattern: /(ct1|culture|cultural[_\s-]?facility|exhibition|popup|문화|문화시설|전시|미술관|박물관|공연|극장|팝업)/ },
  { code: 'SHOPPING', pattern: /(shopping|select[_\s-]?shop|lifestyle[_\s-]?shop|소품샵|편집샵|쇼핑|상점)/ },
  { code: 'EDU', pattern: /(edu|sc4|ac5|school|academy|hagwon|학교|학원)/ },
  { code: 'MT1', pattern: /(mt1|large[_\s-]?mart|supermarket|market|대형마트|마트)/ },
  { code: 'CS2', pattern: /(cs2|convenience[_\s-]?store|convenience|편의점)/ },
  { code: 'SW8', pattern: /(sw8|subway|지하철역)/ },
  { code: 'AT4', pattern: /(at4|attraction|tour|tourist|photo[_\s-]?spot|관광|명소|포토스팟|사진명소)/ },
  { code: 'AD5', pattern: /(ad5|lodging|accommodation|hotel|숙박|호텔)/ },
  { code: 'FD6', pattern: /(fd6|food|restaurant|dining|맛집|밥집|음식|음식점|식당|한식|분식|양식|일식|중식)/ },
  { code: 'CE7', pattern: /(ce7|cafe|coffee|카페|커피|디저트)/ },
]
const POI_CATEGORY_PRIORITY_SCORE = {
  CE7: 100,
  FD6: 90,
  CULTURE: 80,
  AT4: 70,
  SHOPPING: 60,
  AD5: 50,
  PARK: 40,
  CS2: 30,
  MT1: 20,
  EDU: 10,
}
const EXPLICIT_CATEGORY_INTENT_SCORE = 220

export const CATEGORY_FILTERS = [
  { label: '전체', categories: ALL_PLACE_CATEGORY_VALUES, iconName: 'mapPinned' },
  ...PLACE_CATEGORY_DEFINITIONS.map(({ code, label, iconName }) => ({
    label,
    categories: [code],
    iconName,
  })),
]

const PLACE_MARKER_BASE_STYLE = {
  markerColor: '#5A4030',
  backgroundColor: '#FFFDF8',
  borderColor: '#D8C6B7',
  selectedBorderColor: '#3D2415',
  shadowColor: 'rgba(61, 36, 21, 0.16)',
}

export const PLACE_CATEGORY_META = {
  default: {
    label: '장소',
    iconName: 'mapPinned',
    ...PLACE_MARKER_BASE_STYLE,
  },
  ...Object.fromEntries(PLACE_CATEGORY_DEFINITIONS.map(({ code, label, iconName }) => [code, {
    label,
    iconName,
    ...PLACE_MARKER_BASE_STYLE,
  }])),
}

export const PLACE_MARKER_ICON_PATHS = {
  mapPinned: [
    'M3 6l5-3 6 3 7-3v15l-7 3-6-3-5 3V6z',
    'M8 3v15',
    'M14 6v15',
    'M18 8.5a2 2 0 1 0-4 0c0 1.7 2 3.5 2 3.5s2-1.8 2-3.5z',
  ],
  coffee: [
    'M6 8h9v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z',
    'M15 9h1.5a2.5 2.5 0 0 1 0 5H15',
    'M5 20h12',
    'M9 3v2',
    'M13 3v2',
  ],
  utensils: [
    'M5 3v7',
    'M8 3v7',
    'M5 7h3',
    'M6.5 10v11',
    'M16 3v18',
    'M14 3c0 4 4 4 4 0',
  ],
  shoppingCart: [
    'M6 6h15l-1.5 8h-12L6 6z',
    'M6 6L5 3H2',
    'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    'M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  ],
  store: [
    'M4 10h16',
    'M5 10l1-5h12l1 5',
    'M6 10v9h12v-9',
    'M9 19v-5h6v5',
  ],
  trees: [
    'M10 18v4',
    'M14 18v4',
    'M4 18h16',
    'M6 15l4-9 4 9H6z',
    'M11 16l3-7 5 7h-8z',
  ],
  shoppingBag: [
    'M6 8h12l1 13H5L6 8z',
    'M9 8a3 3 0 0 1 6 0',
    'M9 12h.01',
    'M15 12h.01',
  ],
  camera: [
    'M5 7h3l1.5-2h5L16 7h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
    'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  ],
  baby: [
    'M9 10a3 3 0 0 1 6 0',
    'M8 14h8',
    'M10 18h4',
    'M9 6h.01',
    'M15 6h.01',
  ],
  school: [
    'M4 10l8-5 8 5',
    'M6 10v9h12v-9',
    'M9 19v-5h6v5',
    'M4 19h16',
  ],
  graduationCap: [
    'M3 8l9-4 9 4-9 4-9-4z',
    'M7 10v4c2 2 8 2 10 0v-4',
    'M20 9v5',
  ],
  circleParking: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M10 16V8h4a2.5 2.5 0 0 1 0 5h-4',
  ],
  fuel: [
    'M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15',
    'M4 20h12',
    'M15 7h2l2 2v7a2 2 0 0 1-2 2h-2',
    'M8 7h4',
  ],
  trainFront: [
    'M8 3h8a3 3 0 0 1 3 3v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6a3 3 0 0 1 3-3z',
    'M7 21l3-3',
    'M17 21l-3-3',
    'M8 8h8',
    'M8 13h.01',
    'M16 13h.01',
  ],
  banknote: [
    'M3 6h18v12H3V6z',
    'M7 10a2 2 0 0 1-2 2',
    'M17 10a2 2 0 0 0 2 2',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  landmark: [
    'M3 9l9-6 9 6',
    'M4 10h16',
    'M6 10v8',
    'M10 10v8',
    'M14 10v8',
    'M18 10v8',
    'M4 18h16',
    'M3 21h18',
  ],
  building2: [
    'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16',
    'M4 21h20',
    'M9 7h1',
    'M14 7h1',
    'M9 11h1',
    'M14 11h1',
    'M10 21v-5h4v5',
  ],
  building: [
    'M4 21V7l8-4 8 4v14',
    'M8 10h1',
    'M12 10h1',
    'M16 10h1',
    'M8 14h1',
    'M12 14h1',
    'M16 14h1',
  ],
  map: [
    'M3 6l5-3 6 3 7-3v15l-7 3-6-3-5 3V6z',
    'M8 3v15',
    'M14 6v15',
  ],
  hotel: [
    'M4 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
    'M4 12h18v9',
    'M8 8h.01',
    'M12 8h.01',
  ],
  hospital: [
    'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16',
    'M4 21h20',
    'M12 7v8',
    'M8 11h8',
  ],
  pill: [
    'M10 21a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7l-7 7z',
    'M8 8l8 8',
  ],
}

export function handleUnauthorizedMapApiError(error, { clearAuthToken, navigate, location } = {}) {
  if (error?.status !== 401) return false

  clearAuthToken?.()
  navigate?.('/login', { replace: true, state: { from: location } })
  return true
}

export function buildNearbyPlaceRequests({ latitude, longitude, selectedCategory = null } = {}) {
  const safeLatitude = toCoordinate(latitude)
  const safeLongitude = toCoordinate(longitude)
  if (safeLatitude === null || safeLongitude === null) return []
  if (!selectedCategory) return []

  const filter = CATEGORY_FILTERS.find((item) => item.label === selectedCategory) ?? CATEGORY_FILTERS[0]
  const categories = filter.categories
  return categories.map((category) => ({
    latitude: safeLatitude,
    longitude: safeLongitude,
    radius: NEARBY_RADIUS_METERS,
    category,
    page: 1,
    limit: NEARBY_LIMIT,
  }))
}

export function buildPopularPlaceRequest({ latitude, longitude } = {}) {
  const safeLatitude = toCoordinate(latitude)
  const safeLongitude = toCoordinate(longitude)
  if (safeLatitude === null || safeLongitude === null) return null

  return {
    latitude: safeLatitude,
    longitude: safeLongitude,
    radius: NEARBY_RADIUS_METERS,
    limit: NEARBY_LIMIT,
  }
}

export function buildPoiSearchRequest({
  query,
  latitude,
  longitude,
} = {}) {
  const safeQuery = String(query ?? '').trim()
  if (!safeQuery) return null

  const request = {
    query: safeQuery,
    page: 1,
    limit: NEARBY_LIMIT,
  }

  const safeLatitude = toCoordinate(latitude)
  const safeLongitude = toCoordinate(longitude)
  if (safeLatitude !== null && safeLongitude !== null) {
    request.latitude = safeLatitude
    request.longitude = safeLongitude
    request.radius = POI_SEARCH_RADIUS_METERS
  }

  return request
}

export function buildPoiSearchRequests({
  query,
  latitude,
  longitude,
} = {}) {
  const primaryRequest = buildPoiSearchRequest({ query, latitude, longitude })
  if (!primaryRequest) return []

  const requestQueries = shouldSupplementStationSearch(primaryRequest.query)
    ? [`${primaryRequest.query}역`, primaryRequest.query]
    : [primaryRequest.query]

  return requestQueries.map((requestQuery) => ({
    ...primaryRequest,
    query: requestQuery,
  }))
}

export function getMarkerPlaces({
  searchPlaces = [],
  isSearchActive = false,
  categoryPlaces = [],
  popularPlaces = [],
  selectedCategory = null,
  selectedPlaceId = null,
  focusedSearchPlaceId = null,
} = {}) {
  const searchAnchorPlaceId = selectedPlaceId ?? focusedSearchPlaceId
  if (isSearchActive && searchAnchorPlaceId) {
    const selectedSearchPlace = searchPlaces.find((place) => place?.kakaoPlaceId === searchAnchorPlaceId)
    return dedupeMarkerPlaces([
      ...(selectedSearchPlace ? [selectedSearchPlace] : []),
      ...popularPlaces,
    ])
  }

  const markerPlaces = isSearchActive
    ? [...searchPlaces]
    : selectedCategory
      ? [...categoryPlaces]
      : [...popularPlaces]

  if (!isSearchActive && selectedCategory && selectedPlaceId) {
    const seenPlaceIds = new Set(markerPlaces.map((place) => place?.kakaoPlaceId).filter(Boolean))
    const selectedPopularPlace = popularPlaces.find((place) => place?.kakaoPlaceId === selectedPlaceId)
    if (selectedPopularPlace && !seenPlaceIds.has(selectedPlaceId)) {
      markerPlaces.push(selectedPopularPlace)
    }
  }

  return dedupeMarkerPlaces(markerPlaces)
}

export function normalizePlaces(places, origin, limit = NEARBY_LIMIT) {
  const seenPlaceIds = new Set()
  const flattenedPlaces = Array.isArray(places)
    ? places.flatMap(flattenPlaceGroup)
    : []

  return flattenedPlaces
    .map(({ place, requestCategory }) => normalizePlace(place, origin, requestCategory))
    .filter((place) => {
      if (!place?.kakaoPlaceId || seenPlaceIds.has(place.kakaoPlaceId)) return false
      seenPlaceIds.add(place.kakaoPlaceId)
      return true
    })
    .sort(comparePlaces)
    .slice(0, limit)
}

export function normalizePopularPlaces(places, origin, limit = NEARBY_LIMIT) {
  return normalizePlaces(places, origin, limit)
}

export function normalizeSearchPlaces(places, origin, query, limit = NEARBY_LIMIT) {
  const seenPlaceIds = new Set()
  const flattenedPlaces = Array.isArray(places)
    ? places.flatMap(flattenPlaceGroup)
    : []

  return flattenedPlaces
    .map(({ place, requestCategory }, index) => {
      const normalizedPlace = normalizePlace(place, origin, requestCategory)
      if (!normalizedPlace?.kakaoPlaceId || seenPlaceIds.has(normalizedPlace.kakaoPlaceId)) return null
      seenPlaceIds.add(normalizedPlace.kakaoPlaceId)

      return {
        place: normalizedPlace,
        apiRank: index,
        relevanceScore: getSearchRelevanceScore(normalizedPlace, query),
      }
    })
    .filter(Boolean)
    .sort(compareSearchResults)
    .slice(0, limit)
    .map((result) => result.place)
}

export function normalizePlace(place, origin, requestCategory = null) {
  if (!place || typeof place !== 'object') return null

  const latitude = toCoordinate(place.latitude)
  const longitude = toCoordinate(place.longitude)
  const categoryKey = inferPlaceCategoryKey(place, requestCategory)
  const distanceMeters =
    latitude !== null && longitude !== null
      ? getDistanceInMeters(origin?.latitude, origin?.longitude, latitude, longitude)
      : null

  return {
    kakaoPlaceId: String(place.kakaoPlaceId ?? '').trim(),
    placeName: String(place.placeName ?? '').trim() || '이름 없는 장소',
    latitude,
    longitude,
    phone: String(place.phone ?? '').trim(),
    address: String(place.address ?? '').trim(),
    kakaoMapUrl: String(place.kakaoMapUrl ?? '').trim(),
    groupName: getDisplayCategory(place),
    categoryKey,
    traceCount: Number(place.traceCount ?? 0),
    boardId: place.boardId ?? null,
    hasBoard: place.boardId !== null && place.boardId !== undefined,
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
  }
}

function flattenPlaceGroup(entry) {
  if (Array.isArray(entry)) {
    return entry.map((place) => ({ place, requestCategory: null }))
  }

  if (entry && typeof entry === 'object' && Array.isArray(entry.places)) {
    const requestCategory = normalizeCategoryKey(entry.requestCategory)
    return entry.places.map((place) => ({ place, requestCategory }))
  }

  return [{ place: entry, requestCategory: null }]
}

function dedupeMarkerPlaces(places) {
  const seenPlaceIds = new Set()
  return places.filter((place) => {
    const placeId = place?.kakaoPlaceId
    if (!placeId || seenPlaceIds.has(placeId)) return false
    seenPlaceIds.add(placeId)
    return true
  })
}

export function getCurrentPositionMarkerTitle(locationStatus) {
  if (locationStatus === 'fallback') return '성수동 기준 위치'
  if (locationStatus === 'loading') return '위치 확인 중'
  return '현재 위치'
}

export function getCurrentLocationViewPlan(position) {
  const latitude = toCoordinate(position?.latitude)
  const longitude = toCoordinate(position?.longitude)
  if (latitude === null || longitude === null) return null

  return {
    center: {
      latitude,
      longitude,
    },
    level: MAP_CURRENT_LOCATION_LEVEL,
  }
}

export function getHorizontalDragStartState({
  pointerType = 'mouse',
  button = 0,
  clientX,
  scrollLeft,
  scrollWidth,
  clientWidth,
} = {}) {
  if (pointerType === 'mouse' && button !== 0) return null
  if (!['mouse', 'pen'].includes(pointerType)) return null

  const maxScrollLeft = getMaxScrollLeft(scrollWidth, clientWidth)
  if (maxScrollLeft <= 0) return null

  const startX = toFiniteNumber(clientX)
  const startScrollLeft = toFiniteNumber(scrollLeft)
  if (startX === null || startScrollLeft === null) return null

  return {
    startX,
    startScrollLeft: Math.max(0, Math.min(startScrollLeft, maxScrollLeft)),
    isDragging: false,
  }
}

export function getHorizontalDragScrollLeft(dragState, {
  clientX,
  scrollWidth,
  clientWidth,
} = {}) {
  if (!dragState) return null

  const currentX = toFiniteNumber(clientX)
  const startX = toFiniteNumber(dragState.startX)
  const startScrollLeft = toFiniteNumber(dragState.startScrollLeft)
  if (currentX === null || startX === null || startScrollLeft === null) return null

  const maxScrollLeft = getMaxScrollLeft(scrollWidth, clientWidth)
  const deltaX = currentX - startX
  const scrollLeft = Math.max(0, Math.min(startScrollLeft - deltaX, maxScrollLeft))

  return {
    scrollLeft,
    isDragging: Boolean(dragState.isDragging || Math.abs(deltaX) >= 4),
  }
}

export function getBottomSheetTransform(isOpen) {
  return isOpen ? 'translateY(0)' : MAP_BOTTOM_SHEET_CLOSED_TRANSFORM
}

export function getBottomSheetToggleLabel(isOpen) {
  return isOpen ? '주변 인기 공간 닫기' : '주변 인기 공간 열기'
}

export function getBottomSheetContentClasses(isOpen) {
  return isOpen ? MAP_BOTTOM_SHEET_CONTENT_CLASSES : MAP_BOTTOM_SHEET_CONTENT_CLOSED_CLASSES
}

export function getFloatingControlsBottom(isOpen) {
  const sheetVisibleHeight = isOpen
    ? MAP_BOTTOM_SHEET_OPEN_HEIGHT
    : `${MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX}px`

  return `calc(${MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX}px + ${sheetVisibleHeight} + ${MAP_FLOATING_CONTROLS_GAP_PX}px)`
}

export function getMapBottomUiState({ hasSelectedPlace = false } = {}) {
  return {
    showBottomSheet: !hasSelectedPlace,
    showFloatingControls: true,
    showSelectedPlacePanel: hasSelectedPlace,
    selectedPanelControlsPlacement: hasSelectedPlace ? 'selected-panel-edge' : 'bottom-sheet-edge',
  }
}

export function getMapViewportPlan(places = [], currentPosition = null) {
  const placePoints = Array.isArray(places)
    ? places.map((place) => toMapPoint(place, 'place')).filter(Boolean)
    : []

  if (placePoints.length === 0) {
    return {
      type: 'none',
      points: [],
    }
  }

  if (placePoints.length === 1) {
    const [{ latitude, longitude }] = placePoints
    return {
      type: 'single',
      center: { latitude, longitude },
      level: MAP_RESULT_SINGLE_PLACE_LEVEL,
      points: placePoints,
    }
  }

  const currentPoint = toMapPoint(currentPosition, 'current')
  const points = currentPoint ? [...placePoints, currentPoint] : placePoints

  return {
    type: 'bounds',
    points,
    maxLevel: MAP_RESULT_MAX_FIT_LEVEL,
    padding: MAP_RESULT_VIEWPORT_PADDING,
  }
}

export function getCategorySelectionState(categoryLabel) {
  return {
    selectedCategory: categoryLabel,
    categoryPlaces: [],
    selectedPlaceId: null,
    categoryPlacesStatus: 'loading',
    categoryPlacesError: '',
    boardError: '',
  }
}

export function getCategoryToggleState(currentCategory, categoryLabel) {
  if (currentCategory === categoryLabel) {
    return {
      selectedCategory: null,
      categoryPlaces: [],
      selectedPlaceId: null,
      categoryPlacesStatus: 'idle',
      categoryPlacesError: '',
      boardError: '',
    }
  }

  return getCategorySelectionState(categoryLabel)
}

export function getPlaceSelectionTransitionState(kakaoPlaceId) {
  return {
    selectedPlaceId: null,
    nextSelectedPlaceId: kakaoPlaceId ?? null,
    openingPlaceId: null,
    boardError: '',
  }
}

export function getSearchResultsPanelState({
  isOpen = false,
  searchStatus = 'idle',
  searchNotice = '',
  resultCount = 0,
} = {}) {
  const shouldRender = Boolean(isOpen && (searchStatus !== 'idle' || searchNotice))

  return {
    shouldRender,
    hasResults: Boolean(shouldRender && searchStatus === 'success' && resultCount > 0),
  }
}

export function getPlaceInfoRows(place) {
  if (!place || typeof place !== 'object') return []

  const categoryMeta = getPlaceCategoryMeta(place.categoryKey)
  const categoryLabel = firstPresentValue(
    place.groupName !== PLACE_CATEGORY_META.default.label ? place.groupName : '',
    categoryMeta.label !== PLACE_CATEGORY_META.default.label ? categoryMeta.label : ''
  )
  return [
    createPlaceInfoRow('주소', place.address),
    createPlaceInfoRow('카테고리', categoryLabel),
    createPlaceInfoRow('전화', place.phone),
    createPlaceInfoRow('거리', place.distanceLabel),
  ].filter(Boolean)
}
export function inferPlaceCategoryKey(place, fallbackCategory = null) {
  const explicitCategory = getExactCategoryFromFields([
    place?.categoryKey,
    place?.category,
  ])
  if (explicitCategory) return explicitCategory

  const structuredCategory = inferCategoryFromFields([
    place?.category,
    place?.groupName,
    place?.categoryName,
    place?.placeCategory,
  ])
  if (structuredCategory) return structuredCategory

  const fallbackCategoryKey = normalizeCategoryKey(fallbackCategory)
  if (fallbackCategoryKey) return fallbackCategoryKey

  const nameCategory = inferCategoryFromFields([place?.placeName])
  if (nameCategory) return nameCategory

  return 'default'
}

export function getPlaceCategoryMeta(categoryKey) {
  return PLACE_CATEGORY_META[categoryKey] ?? PLACE_CATEGORY_META.default
}

export function formatDistance(distanceMeters) {
  if (distanceMeters === null || distanceMeters === undefined || !Number.isFinite(distanceMeters)) {
    return ''
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`
  }

  const kilometers = distanceMeters / 1000
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)}km`
}

function getDisplayCategory(place) {
  const groupName = String(place?.groupName ?? '').trim()
  if (groupName) return groupName

  const category = normalizeCategoryKey(place?.category)
  return CATEGORY_LABELS[category] ?? '장소'
}

function normalizeCategoryKey(value) {
  const category = normalizeCategoryText(value)
  if (!category || category === 'default') return null

  return CATEGORY_CODE_BY_ALIAS.get(category) ?? null
}

function getExactCategoryFromFields(fields) {
  return fields.map(normalizeCategoryKey).find(Boolean) ?? null
}

function inferCategoryFromFields(fields) {
  const exactCategory = getExactCategoryFromFields(fields)
  if (exactCategory) return exactCategory

  const sourceText = fields
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ')
  if (!sourceText) return null

  const matchedCategory = CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(sourceText))
  return matchedCategory?.code ?? null
}

function buildCategoryCodeByAlias() {
  const categoryCodeByAlias = new Map()
  PLACE_CATEGORY_DEFINITIONS.forEach(({ code, label, aliases = [] }) => {
    ;[code, label, ...aliases].forEach((alias) => {
      categoryCodeByAlias.set(normalizeCategoryText(alias), code)
    })
  })
  return categoryCodeByAlias
}

function normalizeCategoryText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

function toMapPoint(source, kind) {
  const latitude = toCoordinate(source?.latitude)
  const longitude = toCoordinate(source?.longitude)
  if (latitude === null || longitude === null) return null

  return {
    kind,
    latitude,
    longitude,
  }
}

function comparePlaces(left, right) {
  if (left.distanceMeters !== null && right.distanceMeters !== null) {
    const distanceCompare = left.distanceMeters - right.distanceMeters
    if (distanceCompare !== 0) return distanceCompare
  }

  if (left.distanceMeters !== null) return -1
  if (right.distanceMeters !== null) return 1

  const boardCompare = Number(Boolean(right.boardId)) - Number(Boolean(left.boardId))
  if (boardCompare !== 0) return boardCompare

  const traceCompare = Number(right.traceCount ?? 0) - Number(left.traceCount ?? 0)
  if (traceCompare !== 0) return traceCompare

  return left.placeName.localeCompare(right.placeName)
}

function compareSearchResults(left, right) {
  const relevanceCompare = right.relevanceScore - left.relevanceScore
  if (relevanceCompare !== 0) return relevanceCompare

  return left.apiRank - right.apiRank
}

function getSearchRelevanceScore(place, query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return 0
  const queryCategoryIntent = inferQueryCategoryIntent(query)

  const fields = {
    name: normalizeSearchText(place?.placeName),
    category: normalizeSearchText(place?.groupName),
    address: normalizeSearchText(place?.address),
  }
  const tokens = getSearchTokens(query)
  let score = 0

  if (fields.name === normalizedQuery) score += 100
  if (fields.name.startsWith(normalizedQuery)) score += 80
  if (fields.name.includes(normalizedQuery)) score += 60
  if (fields.category.includes(normalizedQuery)) score += 30
  if (fields.address.includes(normalizedQuery)) score += 10
  if (place?.categoryKey === 'SW8' && isStationLikeQuery(query)) score += 35
  if (queryCategoryIntent && place?.categoryKey === queryCategoryIntent) {
    score += EXPLICIT_CATEGORY_INTENT_SCORE
  }
  score += getPoiCategoryPriorityScore(place?.categoryKey)

  tokens.forEach((token) => {
    if (fields.name.includes(token)) score += 8
    if (fields.category.includes(token)) score += 4
    if (fields.address.includes(token)) score += 2
  })

  return score
}

function getPoiCategoryPriorityScore(categoryKey) {
  return POI_CATEGORY_PRIORITY_SCORE[categoryKey] ?? 0
}

function inferQueryCategoryIntent(query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return null

  const exactCategory = normalizeCategoryKey(normalizedQuery)
  if (exactCategory) return exactCategory

  const matchedCategory = CATEGORY_PATTERNS.find(({ code, pattern }) => (
    code !== 'SW8' && pattern.test(normalizedQuery)
  ))

  return matchedCategory?.code ?? null
}

function shouldSupplementStationSearch(query) {
  const normalizedQuery = normalizeSearchText(query)
  return /^[가-힣]{2,8}$/.test(normalizedQuery) && !normalizedQuery.endsWith('역')
}

function isStationLikeQuery(query) {
  const normalizedQuery = normalizeSearchText(query)
  return /^[가-힣]{2,8}$/.test(normalizedQuery)
}

function getSearchTokens(query) {
  return String(query ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(normalizeSearchText)
    .filter(Boolean)
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function createPlaceInfoRow(label, value) {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return null

  return {
    label,
    value: normalizedValue,
  }
}

function firstPresentValue(...values) {
  return values.find((value) => String(value ?? '').trim() !== '') ?? ''
}

function getDistanceInMeters(startLatitude, startLongitude, endLatitude, endLongitude) {
  const lat1 = toCoordinate(startLatitude)
  const lon1 = toCoordinate(startLongitude)
  const lat2 = toCoordinate(endLatitude)
  const lon2 = toCoordinate(endLongitude)
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null

  const earthRadiusMeters = 6371000
  const deltaLatitude = toRadians(lat2 - lat1)
  const deltaLongitude = toRadians(lon2 - lon1)
  const startLatitudeRadians = toRadians(lat1)
  const endLatitudeRadians = toRadians(lat2)

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(startLatitudeRadians)
      * Math.cos(endLatitudeRadians)
      * Math.sin(deltaLongitude / 2) ** 2

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)))
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function getMaxScrollLeft(scrollWidth, clientWidth) {
  const safeScrollWidth = toFiniteNumber(scrollWidth)
  const safeClientWidth = toFiniteNumber(clientWidth)
  if (safeScrollWidth === null || safeClientWidth === null) return 0

  return Math.max(0, safeScrollWidth - safeClientWidth)
}

function toFiniteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toCoordinate(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}
