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

export function normalizeBoardDetail(board) {
  if (!board || typeof board !== 'object') {
    return { traceCount: null }
  }

  return {
    ...board,
    traceCount: toSafeNumber(board.traceCount),
  }
}

export async function resolveBoardForPlace(
  place,
  { fetchBoardByKakaoPlaceId, createBoard }
) {
  if (!place?.kakaoPlaceId) {
    throw new Error('Place does not include kakaoPlaceId.')
  }

  if (hasBoardId(place.boardId)) {
    return { boardId: place.boardId }
  }

  try {
    return await fetchBoardByKakaoPlaceId(place.kakaoPlaceId)
  } catch (error) {
    if (error?.status !== 404) throw error
    return createBoard(buildBoardRequestFromPlace(place))
  }
}

function hasBoardId(boardId) {
  return boardId !== null && boardId !== undefined && String(boardId).trim() !== ''
}

function toSafeNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
