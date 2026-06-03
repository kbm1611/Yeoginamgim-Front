export { buildBoardRequestFromPlace } from '../api/boards.utils.js'

export const DEFAULT_MAP_CENTER = {
  latitude: 37.5447,
  longitude: 127.0559,
  label: '성수동',
}

export const NEARBY_RADIUS_METERS = 20000
export const NEARBY_LIMIT = 15
export const MAP_BOTTOM_SHEET_OPEN_HEIGHT = 'min(420px, 58%)'
export const MAP_BOTTOM_SHEET_HEIGHT = MAP_BOTTOM_SHEET_OPEN_HEIGHT
export const MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX = 90
export const MAP_BOTTOM_SHEET_COLLAPSED_VISIBLE_HEIGHT_PX = 56
export const MAP_FLOATING_CONTROLS_GAP_PX = 12
export const MAP_BOTTOM_SHEET_CLOSED_TRANSFORM = 'translateY(calc(100% - 56px))'
const MAP_SHARED_MOTION_CLASSES = 'duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-[1ms]'
export const MAP_BOTTOM_SHEET_TRANSITION_CLASSES = `transition-transform ${MAP_SHARED_MOTION_CLASSES}`
export const MAP_FLOATING_CONTROLS_TRANSITION_CLASSES = `transition-[bottom] ${MAP_SHARED_MOTION_CLASSES}`
const MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES = 'h-[calc(100%-56px)] transition-opacity duration-[220ms] ease-out motion-reduce:delay-0 motion-reduce:duration-[1ms]'
export const MAP_BOTTOM_SHEET_CONTENT_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} opacity-100 delay-[120ms]`
export const MAP_BOTTOM_SHEET_CONTENT_CLOSED_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} pointer-events-none opacity-0 delay-0`
export const MAP_PLACE_LIST_SCROLL_CLASSES = 'scrollbar-hide flex h-[calc(100%-34px)] snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-smooth pb-1'
export const MAP_PLACE_CARD_SCROLL_CLASSES = 'snap-start scroll-ml-1'
export const MAP_CATEGORY_FILTER_SCROLL_CLASSES =
  'scrollbar-hide mt-3 flex w-full snap-x snap-proximity flex-nowrap gap-2 overflow-x-scroll overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 whitespace-nowrap [touch-action:pan-x] [-webkit-overflow-scrolling:touch]'
export const MAP_CATEGORY_FILTER_BUTTON_CLASSES =
  'inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] transition'
export const MAP_RESULT_SINGLE_PLACE_LEVEL = 4
export const MAP_SELECTED_PLACE_LEVEL = 4
export const MAP_RESULT_MAX_FIT_LEVEL = 7
export const MAP_RESULT_VIEWPORT_PADDING = {
  top: 150,
  right: 36,
  bottom: 300,
  left: 36,
}

const KAKAO_CATEGORY_DEFINITIONS = [
  { code: 'CE7', label: '카페', iconName: 'coffee', aliases: ['cafe', 'coffee', '커피'] },
  { code: 'FD6', label: '음식점', iconName: 'utensils', aliases: ['food', 'restaurant', 'dining', '맛집', '음식', '식당'] },
  { code: 'CT1', label: '문화시설', iconName: 'landmark', aliases: ['culture', 'cultural_facility', '문화', '전시'] },
  { code: 'AT4', label: '관광명소', iconName: 'map', aliases: ['attraction', 'tour', 'tourist_attraction', '관광', '명소', '관광,명소'] },
  { code: 'CS2', label: '편의점', iconName: 'store', aliases: ['convenience', 'convenience_store', 'store'] },
  { code: 'MT1', label: '대형마트', iconName: 'shoppingCart', aliases: ['mart', 'large_mart', 'largemart', 'market', 'supermarket', '마트'] },
  { code: 'SW8', label: '지하철역', iconName: 'trainFront', aliases: ['subway', 'subway_station'] },
  { code: 'PK6', label: '주차장', iconName: 'circleParking', aliases: ['parking'] },
  { code: 'BK9', label: '은행', iconName: 'banknote', aliases: ['bank'] },
  { code: 'HP8', label: '병원', iconName: 'hospital', aliases: ['hospital'] },
  { code: 'PM9', label: '약국', iconName: 'pill', aliases: ['pharmacy'] },
  { code: 'SC4', label: '학교', iconName: 'school', aliases: ['school'] },
  { code: 'AC5', label: '학원', iconName: 'graduationCap', aliases: ['academy', 'hagwon'] },
  { code: 'PS3', label: '어린이집·유치원', iconName: 'baby', aliases: ['preschool', 'kindergarten', '어린이집', '유치원', '어린이집,유치원'] },
  { code: 'PO3', label: '공공기관', iconName: 'building', aliases: ['public', 'public_institution', 'institution'] },
  { code: 'AG2', label: '중개업소', iconName: 'building2', aliases: ['real_estate', 'realestate', '부동산'] },
  { code: 'AD5', label: '숙박', iconName: 'hotel', aliases: ['lodging', 'accommodation', 'hotel'] },
  { code: 'OL7', label: '주유소·충전소', iconName: 'fuel', aliases: ['oil', 'gas', 'charging', '주유소', '충전소', '주유소,충전소'] },
]

const ALL_PLACE_CATEGORY_VALUES = KAKAO_CATEGORY_DEFINITIONS.map((category) => category.code)
const CATEGORY_LABELS = Object.fromEntries(KAKAO_CATEGORY_DEFINITIONS.map(({ code, label }) => [code, label]))
const CATEGORY_CODE_BY_ALIAS = buildCategoryCodeByAlias()
const CATEGORY_PATTERNS = [
  { code: 'MT1', pattern: /(mt1|large[_\s-]?mart|supermarket|market|대형마트|마트)/ },
  { code: 'CS2', pattern: /(cs2|convenience[_\s-]?store|convenience|편의점)/ },
  { code: 'PS3', pattern: /(ps3|preschool|kindergarten|어린이집|유치원)/ },
  { code: 'SC4', pattern: /(sc4|school|학교)/ },
  { code: 'AC5', pattern: /(ac5|academy|hagwon|학원)/ },
  { code: 'PK6', pattern: /(pk6|parking|주차장)/ },
  { code: 'OL7', pattern: /(ol7|oil|gas|charging|주유소|충전소)/ },
  { code: 'SW8', pattern: /(sw8|subway|지하철역)/ },
  { code: 'BK9', pattern: /(bk9|bank|은행)/ },
  { code: 'CT1', pattern: /(ct1|culture|cultural[_\s-]?facility|문화|문화시설|전시|미술관|박물관|공연|극장)/ },
  { code: 'AG2', pattern: /(ag2|real[_\s-]?estate|중개업소|부동산)/ },
  { code: 'PO3', pattern: /(po3|public|institution|공공기관)/ },
  { code: 'AT4', pattern: /(at4|attraction|tour|tourist|관광|명소)/ },
  { code: 'AD5', pattern: /(ad5|lodging|accommodation|hotel|숙박)/ },
  { code: 'FD6', pattern: /(fd6|food|restaurant|dining|맛집|음식|음식점|식당|한식|분식|양식|일식|중식)/ },
  { code: 'CE7', pattern: /(ce7|cafe|coffee|카페|커피|디저트)/ },
  { code: 'HP8', pattern: /(hp8|hospital|병원)/ },
  { code: 'PM9', pattern: /(pm9|pharmacy|약국)/ },
]

export const CATEGORY_FILTERS = [
  { label: '전체', categories: ALL_PLACE_CATEGORY_VALUES, iconName: 'mapPinned' },
  ...KAKAO_CATEGORY_DEFINITIONS.map(({ code, label, iconName }) => ({
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
  ...Object.fromEntries(KAKAO_CATEGORY_DEFINITIONS.map(({ code, label, iconName }) => [code, {
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

export function buildNearbyPlaceRequests({ latitude, longitude, selectedCategory = null } = {}) {
  const safeLatitude = toCoordinate(latitude)
  const safeLongitude = toCoordinate(longitude)
  if (safeLatitude === null || safeLongitude === null) return []
  if (!selectedCategory) return []

  const filter = CATEGORY_FILTERS.find((item) => item.label === selectedCategory) ?? CATEGORY_FILTERS[0]
  const categories = filter.categories
  const perCategoryLimit = categories.length > 1 ? Math.max(1, Math.ceil(NEARBY_LIMIT / categories.length)) : NEARBY_LIMIT

  return categories.map((category) => ({
    latitude: safeLatitude,
    longitude: safeLongitude,
    radius: NEARBY_RADIUS_METERS,
    category,
    page: 1,
    limit: perCategoryLimit,
  }))
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

export function getCurrentPositionMarkerTitle(locationStatus) {
  if (locationStatus === 'fallback') return '성수동 기준 위치'
  if (locationStatus === 'loading') return '위치 확인 중'
  return '현재 위치'
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
    places: [],
    selectedPlaceId: null,
    placesStatus: 'loading',
    placesError: '',
    boardError: '',
    isSheetOpen: true,
  }
}

export function inferPlaceCategoryKey(place, fallbackCategory = null) {
  const sourceText = [
    place?.categoryKey,
    place?.category,
    place?.groupName,
    place?.categoryName,
    place?.placeCategory,
  ]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ')

  if (!sourceText) return normalizeCategoryKey(fallbackCategory) ?? 'default'

  const exactCategory = normalizeCategoryKey(sourceText)
  if (exactCategory) return exactCategory

  const matchedCategory = CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(sourceText))
  if (matchedCategory) return matchedCategory.code

  return normalizeCategoryKey(fallbackCategory) ?? 'default'
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

function buildCategoryCodeByAlias() {
  const categoryCodeByAlias = new Map()
  KAKAO_CATEGORY_DEFINITIONS.forEach(({ code, label, aliases = [] }) => {
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
  const traceCompare = Number(right.traceCount ?? 0) - Number(left.traceCount ?? 0)
  if (traceCompare !== 0) return traceCompare

  if (left.distanceMeters !== null && right.distanceMeters !== null) {
    const distanceCompare = left.distanceMeters - right.distanceMeters
    if (distanceCompare !== 0) return distanceCompare
  }

  if (left.distanceMeters !== null) return -1
  if (right.distanceMeters !== null) return 1

  const boardCompare = Number(Boolean(right.boardId)) - Number(Boolean(left.boardId))
  if (boardCompare !== 0) return boardCompare

  return left.placeName.localeCompare(right.placeName)
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

function toCoordinate(value) {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}
