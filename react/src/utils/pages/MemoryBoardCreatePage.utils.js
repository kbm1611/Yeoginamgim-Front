export function getCreatedBoardId(board) {
  return board?.boardId ?? board?.customBoardId ?? board?.id
}

export function getCreatedBoardName(board, fallbackName) {
  return board?.boardTitle ?? board?.boardName ?? board?.name ?? fallbackName
}

export async function createVerifiedCustomBoard(
  { createCustomBoard, getCustomBoard },
  payload,
  { fallbackName, coverImage, description } = {}
) {
  const createdBoard = await createCustomBoard(payload)
  const boardId = getCreatedBoardId(createdBoard)

  if (!boardId) {
    throw new Error('Created custom board response does not include a board id.')
  }

  let verifiedBoard
  try {
    verifiedBoard = await getCustomBoard(boardId)
  } catch (error) {
    throw new Error('Created custom board could not be verified.', { cause: error })
  }

  return {
    boardId,
    boardName: getCreatedBoardName(verifiedBoard, getCreatedBoardName(createdBoard, fallbackName)),
    boardType: 'CUSTOM',
    coverImage,
    description,
  }
}
