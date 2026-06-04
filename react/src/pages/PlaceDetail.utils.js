export function mergeBoardDetailIntoPlace(place, boardDetail) {
  if (!boardDetail || typeof boardDetail !== 'object') {
    return place
  }

  const detailPlace = boardDetail.place ?? {}
  const traceCount = toSafeNumber(boardDetail.traceCount)

  return withoutUndefinedValues({
    ...place,
    name: firstValue(detailPlace.placeName, place.name),
    address: firstValue(detailPlace.address, place.address),
    category: firstValue(detailPlace.groupName, place.category),
    kakaoPlaceId: firstValue(detailPlace.kakaoPlaceId, boardDetail.kakaoPlaceId, place.kakaoPlaceId),
    latitude: firstValue(detailPlace.latitude, place.latitude),
    longitude: firstValue(detailPlace.longitude, place.longitude),
    phone: firstValue(detailPlace.phone, place.phone),
    kakaoMapUrl: firstValue(detailPlace.kakaoMapUrl, place.kakaoMapUrl),
    stats: {
      ...place.stats,
      traces: traceCount ?? place.stats?.traces,
    },
  })
}

export function getPlaceDetailRows(place) {
  return [
    { label: 'Kakao place id', value: displayText(place.kakaoPlaceId) },
    { label: '좌표', value: formatCoordinates(place.latitude, place.longitude) },
    { label: '전화', value: displayText(place.phone) },
  ]
}

export function getTraceCountText(traceCount, status = 'ready') {
  if (status === 'loading') return '확인 중'
  if (status === 'error') return '확인 필요'

  const count = toSafeNumber(traceCount)
  return `${count ?? 0}개`
}

export function resolveBoardNavigationId(routeId, boardDetail) {
  return boardDetail?.boardId ?? routeId ?? 'onion'
}

function formatCoordinates(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return '정보 없음'
  }

  return `${latitude}, ${longitude}`
}

function displayText(value) {
  return value === null || value === undefined || String(value).trim() === '' ? '정보 없음' : String(value)
}

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && String(value).trim() !== '')
}

function toSafeNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function withoutUndefinedValues(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined))
}
