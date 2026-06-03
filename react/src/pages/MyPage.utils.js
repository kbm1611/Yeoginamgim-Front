export function normalizeMyPageData({
  user,
  myTracesResponse,
  archiveBoardsResponse,
  receivedLikesResponse,
}) {
  const traces = Array.isArray(myTracesResponse?.traces) ? myTracesResponse.traces : []
  const boards = Array.isArray(archiveBoardsResponse?.boards) ? archiveBoardsResponse.boards : []
  const likedTraces = Array.isArray(receivedLikesResponse?.traces) ? receivedLikesResponse.traces : []
  const nickname = getDisplayNickname(user)

  return {
    profile: {
      email: user?.email ?? '',
      nickname,
      profileImageUrl: user?.profileImageUrl ?? '',
      initial: getInitial(nickname),
    },
    stats: {
      traceCount: traces.length,
      archiveBoardCount: boards.length,
      likedTraceCount: likedTraces.length,
      receivedLikeCount: traces.reduce((sum, trace) => sum + Number(trace?.likeCount ?? 0), 0),
    },
    recentTraces: traces.slice(0, 5).map(normalizeTrace),
  }
}

function getDisplayNickname(user) {
  const nickname = String(user?.nickname ?? '').trim()
  if (nickname) return nickname

  const emailPrefix = String(user?.email ?? '').split('@')[0].trim()
  return emailPrefix || '사용자'
}

function getInitial(value) {
  const firstLetter = String(value ?? '').trim().charAt(0)
  return firstLetter ? firstLetter.toUpperCase() : 'U'
}

function normalizeTrace(trace) {
  const elements = Array.isArray(trace?.elements) ? trace.elements : []
  const firstTextElement = elements.find((element) => String(element?.textContent ?? '').trim())
  const firstImageElement = elements.find((element) => String(element?.imageUrl ?? '').trim())

  return {
    id: trace?.traceId,
    boardId: trace?.boardId,
    createdAt: trace?.createdAt ?? '',
    likeCount: Number(trace?.likeCount ?? 0),
    previewText: firstTextElement?.textContent?.trim() || (firstImageElement ? '이미지 흔적' : '남겨둔 흔적'),
    imageUrl: firstImageElement?.imageUrl ?? '',
  }
}
