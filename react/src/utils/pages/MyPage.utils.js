export const STATS_PARTIAL_FAILURE_MESSAGE =
  '\uC77C\uBD80 \uD1B5\uACC4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD574 \uAE30\uBCF8\uAC12\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4.'

export async function loadMyPageData({
  fetchMyInfo,
  fetchMyTraces,
  fetchArchiveBoards,
  fetchMyCustomBoards,
}) {
  const user = await fetchMyInfo()
  const [tracesResult, archiveBoardsResult, customBoardsResult] = await Promise.allSettled([
    fetchMyTraces(),
    fetchArchiveBoards(),
    fetchMyCustomBoards?.() ?? Promise.resolve(null),
  ])
  const unauthorizedStatsError = [tracesResult, archiveBoardsResult, customBoardsResult]
    .find((result) => result.status === 'rejected' && result.reason?.status === 401)
    ?.reason

  if (unauthorizedStatsError) {
    throw unauthorizedStatsError
  }

  return normalizeMyPageData({
    user,
    myTracesResponse: getFulfilledValue(tracesResult),
    archiveBoardsResponse: getFulfilledValue(archiveBoardsResult),
    customBoardsResponse: getFulfilledValue(customBoardsResult),
    statsPartialFailure: tracesResult.status === 'rejected' || archiveBoardsResult.status === 'rejected',
  })
}

export function normalizeMyPageData({
  user,
  myTracesResponse,
  archiveBoardsResponse,
  statsPartialFailure = false,
}) {
  const traces = Array.isArray(myTracesResponse?.traces) ? myTracesResponse.traces : []
  const boards = Array.isArray(archiveBoardsResponse?.boards) ? archiveBoardsResponse.boards : []
  const nickname = getDisplayNickname(user)

  return {
    profile: {
      userId: user?.userId ?? null,
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
      isPartial: statsPartialFailure,
      message: statsPartialFailure ? STATS_PARTIAL_FAILURE_MESSAGE : '',
    },
  }
}

export function getVisibleProfileImageUrl(profileImageUrl, imageLoadFailed, apiBaseUrl) {
  if (imageLoadFailed || !profileImageUrl) return ''
  if (/^https?:\/\//i.test(profileImageUrl)) return profileImageUrl

  return new URL(profileImageUrl, apiBaseUrl).toString()
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

function getFulfilledValue(result) {
  return result.status === 'fulfilled' ? result.value : null
}
