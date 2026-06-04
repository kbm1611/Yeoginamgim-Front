export function normalizeMyPageData({
  user,
  myTracesResponse,
  archiveBoardsResponse,
}) {
  const traces = Array.isArray(myTracesResponse?.traces) ? myTracesResponse.traces : []
  const boards = Array.isArray(archiveBoardsResponse?.boards) ? archiveBoardsResponse.boards : []
  const nickname = getDisplayNickname(user)

  return {
    profile: {
      email: user?.email ?? '',
      nickname,
      profileImageUrl: user?.profileImageUrl ?? '',
      birthDate: user?.birthDate ?? '',
      provider: String(user?.provider ?? 'LOCAL').toUpperCase(),
      initial: getInitial(nickname),
    },
    stats: {
      traceCount: traces.length,
      archiveBoardCount: boards.length,
      receivedLikeCount: traces.reduce((sum, trace) => sum + Number(trace?.likeCount ?? 0), 0),
    },
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
