export const BOARD_TYPE = {
  PLACE: 'PLACE',
  CUSTOM: 'CUSTOM',
}

export function resolveBoardType(id, locationState, boardDetail) {
  const detailType = boardDetail?.boardType ?? boardDetail?.type
  if (detailType === BOARD_TYPE.PLACE || detailType === BOARD_TYPE.CUSTOM) return detailType

  if (locationState?.boardType === BOARD_TYPE.PLACE || locationState?.boardType === BOARD_TYPE.CUSTOM) {
    return locationState.boardType
  }

  if (boardDetail?.customBoardId != null) return BOARD_TYPE.CUSTOM

  const routeId = String(id ?? '').toLowerCase()
  if (routeId.includes('custom') || routeId.includes('memory')) return BOARD_TYPE.CUSTOM

  return BOARD_TYPE.PLACE
}
