export function getJoinedBoardId(joinedBoard, inviteInfo) {
  return (
    joinedBoard?.boardId ??
    joinedBoard?.customBoardId ??
    joinedBoard?.id ??
    joinedBoard?.board?.boardId ??
    joinedBoard?.board?.customBoardId ??
    joinedBoard?.board?.id ??
    inviteInfo?.boardId ??
    inviteInfo?.customBoardId ??
    inviteInfo?.id
  )
}

export function getJoinedBoardName(joinedBoard, inviteInfo, fallback) {
  return (
    joinedBoard?.boardTitle ??
    joinedBoard?.boardName ??
    joinedBoard?.name ??
    joinedBoard?.board?.boardTitle ??
    joinedBoard?.board?.boardName ??
    joinedBoard?.board?.name ??
    inviteInfo?.boardTitle ??
    inviteInfo?.boardName ??
    inviteInfo?.name ??
    fallback
  )
}

export function buildJoinedBoardRouteState(joinedBoard, inviteInfo, fallbackName) {
  const boardId = getJoinedBoardId(joinedBoard, inviteInfo)

  if (!boardId) return null

  return {
    boardId,
    boardName: getJoinedBoardName(joinedBoard, inviteInfo, fallbackName),
    boardType: 'CUSTOM',
  }
}
