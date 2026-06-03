export const DEFAULT_MAP_CENTER = {
  latitude: 37.5447,
  longitude: 127.0559,
  label: '성수동',
}

export const NEARBY_RADIUS_METERS = 20000
export const NEARBY_LIMIT = 15
export const MAP_BOTTOM_SHEET_HEIGHT = 'min(420px, 58%)'
export const MAP_BOTTOM_SHEET_CLOSED_TRANSFORM = 'translateY(calc(100% - 56px))'
export const MAP_BOTTOM_SHEET_TRANSITION_CLASSES = 'transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-[1ms]'
const MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES = 'h-[calc(100%-56px)] transition-opacity duration-[220ms] ease-out motion-reduce:delay-0 motion-reduce:duration-[1ms]'
export const MAP_BOTTOM_SHEET_CONTENT_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} opacity-100 delay-[120ms]`
export const MAP_BOTTOM_SHEET_CONTENT_CLOSED_CLASSES = `${MAP_BOTTOM_SHEET_CONTENT_BASE_CLASSES} pointer-events-none opacity-0 delay-0`
export const MAP_PLACE_LIST_SCROLL_CLASSES = 'scrollbar-hide flex h-[calc(100%-34px)] snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-smooth pb-1'
export const MAP_PLACE_CARD_SCROLL_CLASSES = 'snap-start scroll-ml-1'
const ALL_PLACE_CATEGORY_VALUES = ['cafe', 'food', 'shop', 'park', 'culture']

export const CATEGORY_FILTERS = [
  { label: '전체', categories: ALL_PLACE_CATEGORY_VALUES },
  { label: '카페', categories: ['cafe'] },
  { label: '맛집', categories: ['food'] },
  { label: '편집샵', categories: ['shop'] },
  { label: '공원', categories: ['park'] },
  { label: '문화', categories: ['culture'] },
]

const CATEGORY_LABELS = {
  cafe: '카페',
  food: '맛집',
  shop: '편집샵',
  park: '공원',
  culture: '문화',
}

export function buildNearbyPlaceRequests({ latitude, longitude, selectedCategory = '전체' } = {}) {
  const safeLatitude = toCoordinate(latitude)
  const safeLongitude = toCoordinate(longitude)
  if (safeLatitude === null || safeLongitude === null) return []

  const filter = CATEGORY_FILTERS.find((item) => item.label === selectedCategory) ?? CATEGORY_FILTERS[0]
  const categories = filter.categories
  const perCategoryLimit = categories.length > 1 ? 5 : NEARBY_LIMIT

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
    ? places.flatMap((place) => (Array.isArray(place) ? place : [place]))
    : []

  return flattenedPlaces
    .map((place) => normalizePlace(place, origin))
    .filter((place) => {
      if (!place?.kakaoPlaceId || seenPlaceIds.has(place.kakaoPlaceId)) return false
      seenPlaceIds.add(place.kakaoPlaceId)
      return true
    })
    .sort(comparePlaces)
    .slice(0, limit)
}

export function normalizePlace(place, origin) {
  if (!place || typeof place !== 'object') return null

  const latitude = toCoordinate(place.latitude)
  const longitude = toCoordinate(place.longitude)
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
    traceCount: Number(place.traceCount ?? 0),
    boardId: place.boardId ?? null,
    hasBoard: place.boardId !== null && place.boardId !== undefined,
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
  }
}

export function buildBoardRequestFromPlace(place) {
  return {
    kakaoPlaceId: place?.kakaoPlaceId,
    placeName: place?.placeName,
    latitude: place?.latitude,
    longitude: place?.longitude,
    phone: place?.phone ?? '',
    address: place?.address ?? '',
    kakaoMapUrl: place?.kakaoMapUrl ?? '',
    groupName: place?.groupName,
  }
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

  const category = String(place?.category ?? '').trim().toLowerCase()
  return CATEGORY_LABELS[category] ?? '장소'
}

function comparePlaces(left, right) {
  if (left.distanceMeters !== null && right.distanceMeters !== null) {
    const distanceCompare = left.distanceMeters - right.distanceMeters
    if (distanceCompare !== 0) return distanceCompare
  }

  if (left.distanceMeters !== null) return -1
  if (right.distanceMeters !== null) return 1

  const traceCompare = Number(right.traceCount ?? 0) - Number(left.traceCount ?? 0)
  if (traceCompare !== 0) return traceCompare

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
