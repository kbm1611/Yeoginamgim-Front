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

export function buildPlaceDetailFromBoardDetail(boardDetail) {
  if (!boardDetail || typeof boardDetail !== 'object') {
    return null
  }

  const detailPlace = boardDetail.place
  if (!detailPlace || typeof detailPlace !== 'object') {
    return null
  }

  const name = firstValue(detailPlace.placeName)
  if (!name) {
    return null
  }

  return withoutUndefinedValues({
    name,
    address: firstValue(detailPlace.address),
    category: firstValue(detailPlace.groupName),
    kakaoPlaceId: firstValue(detailPlace.kakaoPlaceId, boardDetail.kakaoPlaceId),
    latitude: firstValue(detailPlace.latitude),
    longitude: firstValue(detailPlace.longitude),
    phone: firstValue(detailPlace.phone),
    kakaoMapUrl: firstValue(detailPlace.kakaoMapUrl),
    stats: {
      traces: toSafeNumber(boardDetail.traceCount) ?? 0,
    },
  })
}

export function buildRecentTraceCards(response, { now = Date.now() } = {}) {
  const traces = Array.isArray(response?.traces) ? response.traces : []

  return traces.map((trace, index) => {
    const elements = Array.isArray(trace?.elements) ? trace.elements : []
    const firstTextElement = elements.find((element) => String(element?.textContent ?? '').trim())
    const firstImageElement = elements.find((element) => String(element?.imageUrl ?? '').trim())
    const primaryElement = firstImageElement ?? firstTextElement ?? elements[0] ?? {}
    const image = firstImageElement?.imageUrl ?? ''
    const text = firstTextElement?.textContent?.trim() || (image ? '이미지 흔적' : '내용 없는 흔적')
    const createdAt = trace?.createdAt ?? ''
    const card = {
      id: trace?.traceId ?? primaryElement.elementId ?? `trace-${index}`,
      type: image ? 'photo' : 'note',
      text,
      user: firstValue(trace?.nickname) ?? '익명',
      time: formatRelativeTraceTime(createdAt, now),
      likes: toSafeNumber(trace?.likeCount) ?? 0,
    }

    if (image) {
      return {
        ...card,
        image,
      }
    }

    return {
      ...card,
      noteBg: getTraceNoteBackground(primaryElement),
      date: formatDateLabel(createdAt),
    }
  })
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

function getTraceNoteBackground(element) {
  const style = parseStyleJson(element?.styleJson)
  return style.paperColor ?? style.backgroundColor ?? '#F5EDD5'
}

function parseStyleJson(styleJson) {
  if (!styleJson) return {}
  if (typeof styleJson === 'object') return styleJson

  try {
    return JSON.parse(styleJson)
  } catch {
    return {}
  }
}

function formatDateLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function formatRelativeTraceTime(value, now) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMinutes = Math.max(0, Math.floor((now - date.getTime()) / 60000))
  if (diffMinutes < 1) return '방금'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  return `${Math.floor(diffHours / 24)}일 전`
}
