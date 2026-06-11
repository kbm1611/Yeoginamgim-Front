import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Archive,
  Bookmark,
  CalendarDays,
  ChevronRight,
  Heart,
  LayoutGrid,
  Loader2,
  MapPinned,
  Search,
  StickyNote,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchArchiveBoards, fetchFavoritePlaces, fetchMyTraces } from '../api/archive'
import { fetchOrCreateBoardForPlace } from '../api/boards'
import { API_BASE_URL, clearAuthToken, getAuthToken } from '../api/client'
import NotificationButton from '../components/NotificationButton'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { getMyCustomBoards } from '../api/customBoards'

const initialPageState = {
  status: 'loading',
  traces: [],
  boards: [],
  favoritePlaces: [],
  customBoards: [],
  error: '',
}

function ArchivePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pageState, setPageState] = useState(initialPageState)
  const [activeTab, setActiveTab] = useState('traces')
  const [keyword, setKeyword] = useState('')
  const [openingFavoritePlaceId, setOpeningFavoritePlaceId] = useState(null)
  const [archiveActionError, setArchiveActionError] = useState('')

  const loadArchive = useCallback(async () => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    setPageState(initialPageState)

    try {
      const [myTracesResponse, archiveBoardsResponse, favoritePlacesResponse, customBoardsResponse] = await Promise.all([
        fetchMyTraces().catch(() => null),
        fetchArchiveBoards().catch(() => null),
        fetchFavoritePlaces().catch(() => null),
        getMyCustomBoards().catch(() => null),
      ])

      setPageState({
        status: 'ready',
        traces: normalizeTraces(myTracesResponse?.traces),
        boards: normalizeBoards(archiveBoardsResponse?.boards),
        favoritePlaces: normalizeFavoritePlaces(favoritePlacesResponse?.places),
        customBoards: normalizeCustomBoards(customBoardsResponse),
        error: '',
      })
    } catch (error) {
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setPageState({
        status: 'error',
        traces: [],
        boards: [],
        favoritePlaces: [],
        customBoards: [],
        error: getFriendlyError(error),
      })
    }
  }, [location, navigate])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadArchive()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadArchive])

  const boardMap = useMemo(() => {
    return new Map(pageState.boards.map((board) => [String(board.boardId), board]))
  }, [pageState.boards])

  const customBoardMap = useMemo(() => {
    return new Map(pageState.customBoards.map((board) => [String(board.boardId), board]))
  }, [pageState.customBoards])

  // 흔적을 boardId로 그룹핑 → 최근 활동 순 정렬
  const traceGroups = useMemo(() => {
    const query = keyword.trim().toLowerCase()

    const groups = new Map()
    for (const trace of pageState.traces) {
      const boardId = String(trace.boardId ?? '')
      const placeBoard = boardMap.get(boardId)
      const customBoard = customBoardMap.get(boardId)
      const boardName = placeBoard?.placeName ?? customBoard?.boardName ?? '알 수 없는 장소'
      const isCustom = Boolean(customBoard)

      if (!groups.has(boardId)) {
        groups.set(boardId, {
          boardId,
          boardName,
          isCustom,
          latestAt: trace.createdAt ?? '',
          traces: [],
        })
      }
      const group = groups.get(boardId)
      group.traces.push({ ...trace, boardName })
      if ((trace.createdAt ?? '') > group.latestAt) group.latestAt = trace.createdAt
    }

    let result = Array.from(groups.values()).sort((a, b) => {
      return (b.latestAt ?? '') > (a.latestAt ?? '') ? 1 : -1
    })

    if (query) {
      result = result
        .map(group => ({
          ...group,
          traces: group.traces.filter(t =>
            [t.previewText, group.boardName, formatDate(t.createdAt)].join(' ').toLowerCase().includes(query)
          ),
        }))
        .filter(group => group.traces.length > 0 || group.boardName.toLowerCase().includes(query))
    }

    return result
  }, [boardMap, customBoardMap, keyword, pageState.traces])

  const filteredBoards = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return pageState.boards

    return pageState.boards.filter((board) => {
      return [board.placeName, board.groupName, board.latestPreviewText]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [keyword, pageState.boards])

  const filteredFavoritePlaces = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return pageState.favoritePlaces

    return pageState.favoritePlaces.filter((place) => {
      return [place.placeName, place.groupName, place.address, place.phone]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [keyword, pageState.favoritePlaces])

  const totalLikes = pageState.traces.reduce((sum, trace) => sum + trace.likeCount, 0)

  const handleOpenBoard = (boardId) => {
    if (boardId) {
      navigate(`/board/${boardId}`)
    }
  }

  const handleOpenFavoritePlaceBoard = async (place) => {
    if (!place?.kakaoPlaceId) return

    setArchiveActionError('')
    setOpeningFavoritePlaceId(place.kakaoPlaceId)

    try {
      if (place.boardId) {
        navigate(`/board/${place.boardId}`)
        return
      }

      const board = await fetchOrCreateBoardForPlace(place)
      if (!board?.boardId) {
        throw new Error('Board response does not include boardId.')
      }

      navigate(`/board/${board.boardId}`)
    } catch (error) {
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        navigate,
        location,
        redirect: true,
      })) return

      setArchiveActionError(getApiErrorMessage(error, {
        fallback: '보드로 이동하지 못했어요. 잠시 후 다시 시도해주세요.',
        statusMessages: {
          403: '이 보드에 접근할 권한이 없습니다.',
          404: '장소 보드를 찾지 못했습니다.',
          409: '보드 상태가 변경되었습니다. 다시 시도해주세요.',
          500: '보드로 이동하지 못했어요. 잠시 후 다시 시도해주세요.',
        },
      }))
    } finally {
      setOpeningFavoritePlaceId(null)
    }
  }

  return (
    <motion.div
      className="h-full overflow-y-auto px-5 pb-5 pt-2 scrollbar-hide"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {pageState.status === 'loading' && <ArchiveLoading />}

      {pageState.status === 'error' && (
        <ArchiveError message={pageState.error} onRetry={loadArchive} />
      )}

      {pageState.status === 'ready' && (
        <>
          <section>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#8A715D]">내가 남긴 기록</p>
                <h1 className="mt-1 text-[26px] font-bold text-[#2B1810]">보관함</h1>
              </div>
              <NotificationButton />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <SummaryItem icon={StickyNote} label="내 흔적" value={pageState.traces.length} />
              <SummaryItem icon={Archive} label="장소" value={pageState.boards.length} />
              <SummaryItem icon={LayoutGrid} label="내 보드" value={pageState.customBoards.length} />
              <SummaryItem icon={Heart} label="받은 좋아요" value={totalLikes} />
            </div>
          </section>

          <section className="mt-5">
            <label className="flex h-11 items-center gap-2 rounded-full border border-[#eadfce] bg-white/85 px-4 text-[#6E5A4A]">
              <Search size={17} />
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="장소나 흔적 검색"
                className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#2B1810] outline-none placeholder:text-[#9C8C7D]"
              />
            </label>
          </section>

          <section className="mt-4">
            <div className="grid grid-cols-4 rounded-full bg-[#EDE0D0] p-1">
              <TabButton active={activeTab === 'traces'} onClick={() => setActiveTab('traces')}>
                흔적
              </TabButton>
              <TabButton active={activeTab === 'places'} onClick={() => setActiveTab('places')}>
                장소별
              </TabButton>
              <TabButton active={activeTab === 'myboards'} onClick={() => setActiveTab('myboards')}>
                내 보드
              </TabButton>
              <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>
                즐겨찾기
              </TabButton>
            </div>
          </section>

          {activeTab === 'traces' && (
            <TraceGroupList
              groups={traceGroups}
              onOpenBoard={(boardId) => navigate(`/board/${boardId}`)}
              onOpenTrace={(trace) => navigate(`/board/${trace.boardId}/trace/${trace.id}`)}
              onMoveMap={() => navigate('/map')}
            />
          )}

          {activeTab === 'places' && (
            <PlaceArchiveList
              boards={filteredBoards}
              onOpenBoard={handleOpenBoard}
              onMoveMap={() => navigate('/map')}
            />
          )}

          {activeTab === 'myboards' && (
            <CustomBoardList
              boards={pageState.customBoards}
              onOpenBoard={(boardId) => navigate(`/board/${boardId}`)}
              onCreateBoard={() => navigate('/record/new')}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritePlaceList
              places={filteredFavoritePlaces}
              error={archiveActionError}
              openingPlaceId={openingFavoritePlaceId}
              onOpenBoard={handleOpenFavoritePlaceBoard}
              onMoveMap={() => navigate('/map')}
            />
          )}
        </>
      )}
    </motion.div>
  )
}

function TraceGroupList({ groups, onOpenBoard, onOpenTrace, onMoveMap }) {
  if (groups.length === 0) {
    return (
      <EmptyArchive
        title="보관된 흔적이 없어요"
        description="지도에서 장소를 찾고 흔적을 남기면 이곳에 모입니다."
        onMoveMap={onMoveMap}
      />
    )
  }

  return (
    <section className="mt-5 space-y-5">
      {groups.map((group) => (
        <div key={group.boardId}>
          {/* 보드 헤더 */}
          <button
            type="button"
            onClick={() => onOpenBoard(group.boardId)}
            className="flex w-full items-center justify-between px-1 mb-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {group.isCustom ? (
                <LayoutGrid size={14} className="shrink-0 text-[#9A8372]" />
              ) : (
                <MapPinned size={14} className="shrink-0 text-[#9A8372]" />
              )}
              <span className="truncate text-[15px] font-bold text-[#2F2118]">{group.boardName}</span>
              <span className="shrink-0 text-[13px] font-medium text-[#9A8372]">{group.traces.length}개</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[12px] text-[#B0A090]">{formatDate(group.latestAt)}</span>
              <ChevronRight size={15} strokeWidth={2} className="text-[#C4B8A8]" />
            </div>
          </button>

          {/* 썸네일 가로 스크롤 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {group.traces.map((trace) => (
              <button
                key={trace.id}
                type="button"
                onClick={() => onOpenTrace(trace)}
                className="shrink-0 overflow-hidden rounded-xl"
                style={{ width: 100, height: 100 }}
              >
                {trace.imageUrl ? (
                  <img
                    src={resolveMediaUrl(trace.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F0E8DC]">
                    <CalendarDays size={20} className="text-[#9A8070]" />
                    <p className="px-2 text-center text-[10px] font-medium leading-tight text-[#7A6757] line-clamp-3">
                      {trace.previewText}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function PlaceArchiveList({ boards, onOpenBoard, onMoveMap }) {
  if (boards.length === 0) {
    return (
      <EmptyArchive
        title="보관된 장소가 없어요"
        description="흔적을 남긴 장소가 생기면 장소별로 모아볼 수 있어요."
        onMoveMap={onMoveMap}
      />
    )
  }

  return (
    <section className="mt-5 space-y-2">
      {boards.map((board) => (
        <button
          key={board.boardId}
          type="button"
          onClick={() => onOpenBoard(board.boardId)}
          className="w-full rounded-lg border border-[#eee3d6] bg-white/85 p-4 text-left shadow-[0_5px_12px_rgba(78,52,32,0.05)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EFE3D4] text-[#6d503a]">
              <MapPinned size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold text-[#2F2118]">{board.placeName}</p>
                  {board.groupName && (
                    <p className="mt-1 truncate text-[12px] font-semibold text-[#8A7A6E]">
                      {board.groupName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#F3E7D8] px-2.5 py-1 text-[12px] font-bold text-[#5F412B]">
                  {board.traceCount}개
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-[#6F5D50]">
                {board.latestPreviewText}
              </p>
            </div>
          </div>
        </button>
      ))}
    </section>
  )
}

function FavoritePlaceList({ places, error, openingPlaceId, onOpenBoard, onMoveMap }) {
  if (places.length === 0) {
    return (
      <EmptyArchive
        title="즐겨찾기한 가게가 없어요"
        description="마음에 드는 가게를 저장하면 이곳에 모입니다."
        onMoveMap={onMoveMap}
      />
    )
  }

  return (
    <section className="mt-5 space-y-2">
      {error ? <p className="rounded-lg bg-[#F8E9E2] px-3 py-2 text-[12px] font-medium text-[#A74831]">{error}</p> : null}
      {places.map((place) => (
        <article
          key={place.favoritePlaceId ?? place.kakaoPlaceId}
          className="rounded-lg border border-[#eee3d6] bg-white/85 p-4 shadow-[0_5px_12px_rgba(78,52,32,0.05)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F4E2D8] text-[#8A3D2F]">
              <Bookmark size={21} fill="currentColor" strokeWidth={1.7} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold text-[#2F2118]">{place.placeName}</p>
                  {place.groupName && (
                    <p className="mt-1 truncate text-[12px] font-semibold text-[#8A7A6E]">
                      {place.groupName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#F3E7D8] px-2.5 py-1 text-[12px] font-bold text-[#5F412B]">
                  저장
                </span>
              </div>

              {place.address && (
                <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-relaxed text-[#6F5D50]">
                  {place.address}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-[12px] font-medium text-[#8A7A6E]">
                  {place.phone || formatDate(place.createdAt)}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenBoard(place)}
                  disabled={place.kakaoPlaceId === openingPlaceId}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#3D2415] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-65"
                >
                  {place.kakaoPlaceId === openingPlaceId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {place.boardId ? '보드 보기' : '보드 이동'}
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

function CustomBoardList({ boards, onOpenBoard, onCreateBoard }) {
  if (boards.length === 0) {
    return (
      <section className="mt-5 rounded-lg border border-dashed border-[#d9caba] bg-[#fbf6ef] px-4 py-8 text-center">
        <p className="text-[17px] font-bold text-[#3D2415]">아직 만든 보드가 없어요</p>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#7A6857]">친구들과 함께하는 추억 보드를 만들어보세요.</p>
        <button
          type="button"
          onClick={onCreateBoard}
          className="mt-4 rounded-full bg-[#3D2415] px-5 py-3 text-[14px] font-bold text-white"
        >
          새 보드 만들기
        </button>
      </section>
    )
  }

  return (
    <section className="mt-5 space-y-3">
      {boards.map((board) => (
        <button
          key={board.boardId}
          type="button"
          onClick={() => onOpenBoard(board.boardId)}
          className="w-full overflow-hidden rounded-xl border border-[#eee3d6] bg-white/85 text-left shadow-[0_5px_12px_rgba(78,52,32,0.05)]"
        >
          {/* 커버 이미지 */}
          {board.coverImageUrl ? (
            <img src={board.coverImageUrl} alt="" className="h-28 w-full object-cover" />
          ) : (
            <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-[#F0E6D8] to-[#E2D0BC]">
              <LayoutGrid size={32} className="text-[#B89880]" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[16px] font-bold text-[#2F2118]">{board.boardName}</p>
              <span className="shrink-0 rounded-full bg-[#F3E7D8] px-2.5 py-1 text-[12px] font-bold text-[#5F412B]">
                {board.traceCount}개
              </span>
            </div>
            {/* 멤버 아바타 */}
            <div className="mt-2 flex items-center gap-1.5">
              <Users size={13} className="text-[#9A8372]" />
              <div className="flex items-center">
                {board.members.slice(0, 4).map((m, i) => (
                  <div
                    key={m.memberId ?? i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#D4C4B0] text-[10px] font-bold text-[#5C4030]"
                    style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 4 - i }}
                  >
                    {m.nickname?.[0] ?? '?'}
                  </div>
                ))}
                {board.members.length > 4 && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#C4B4A0] text-[9px] font-bold text-[#5C4030]"
                    style={{ marginLeft: -6 }}
                  >
                    +{board.members.length - 4}
                  </div>
                )}
              </div>
              <span className="text-[12px] font-medium text-[#9A8372]">
                {board.members.length}명
              </span>
            </div>
            {board.updatedAt && (
              <p className="mt-1.5 text-[12px] font-medium text-[#A89888]">
                {formatDate(board.updatedAt)} 업데이트
              </p>
            )}
          </div>
        </button>
      ))}
    </section>
  )
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-[#EDE0D0] px-3 py-3 text-center">
      <Icon size={18} className="mx-auto text-[#5f412b]" />
      <p className="mt-2 text-[20px] font-bold text-[#2B1810]">{value}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-[#776353]">{label}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[14px] font-bold ${
        active ? 'bg-white text-[#2B1810] shadow-[0_2px_8px_rgba(78,52,32,0.08)]' : 'text-[#7A6857]'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyArchive({ title, description, onMoveMap }) {
  return (
    <section className="mt-5 rounded-lg border border-dashed border-[#d9caba] bg-[#fbf6ef] px-4 py-8 text-center">
      <p className="text-[17px] font-bold text-[#3D2415]">{title}</p>
      <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#7A6857]">{description}</p>
      <button
        type="button"
        onClick={onMoveMap}
        className="mt-4 rounded-full bg-[#3D2415] px-5 py-3 text-[14px] font-bold text-white"
      >
        지도에서 시작하기
      </button>
    </section>
  )
}

function ArchiveLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-[#5f412b]">
      <Loader2 size={28} className="animate-spin" />
      <p className="mt-3 text-[14px] font-semibold">보관함 불러오는 중</p>
    </div>
  )
}

function ArchiveError({ message, onRetry }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E3DC] text-[#a43d30]">
        <AlertCircle size={24} />
      </div>
      <p className="mt-4 text-[18px] font-bold text-[#2B1810]">보관함을 불러오지 못했어요</p>
      <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#7A6857]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 w-full rounded-full bg-[#3D2415] px-4 py-3 text-[14px] font-bold text-white"
      >
        다시 시도
      </button>
    </div>
  )
}

function normalizeTraces(traces) {
  if (!Array.isArray(traces)) return []

  return traces.map((trace) => ({
    id: trace?.traceId,
    boardId: trace?.boardId,
    createdAt: trace?.createdAt ?? '',
    likeCount: Number(trace?.likeCount ?? 0),
    previewText: getTracePreviewText(trace),
    imageUrl: getTracePreviewImage(trace),
  }))
}

function normalizeBoards(boards) {
  if (!Array.isArray(boards)) return []

  return boards.map((board) => {
    const traces = normalizeTraces(board?.traces)

    return {
      boardId: board?.boardId,
      kakaoPlaceId: board?.kakaoPlaceId ?? '',
      placeName: board?.placeName ?? '장소 정보 없음',
      groupName: board?.groupName ?? '',
      traceCount: Number(board?.traceCount ?? traces.length),
      latestPreviewText: traces[0]?.previewText ?? '남겨둔 흔적이 있어요',
    }
  })
}

function normalizeCustomBoards(response) {
  const list = Array.isArray(response) ? response : (response?.boards ?? response?.customBoards ?? [])
  return list.map((board) => ({
    boardId: board?.boardId ?? board?.customBoardId ?? board?.id,
    boardName: board?.boardTitle ?? board?.boardName ?? board?.name ?? '이름 없는 보드',
    coverImageUrl: board?.boardImageUrl ?? board?.coverImageUrl ?? board?.imageUrl ?? '',
    traceCount: Number(board?.traceCount ?? 0),
    members: Array.isArray(board?.members) ? board.members : [],
    updatedAt: board?.updatedAt ?? board?.lastActivityAt ?? '',
  }))
}

function normalizeFavoritePlaces(places) {
  if (!Array.isArray(places)) return []

  return places.map((place) => ({
    favoritePlaceId: place?.favoritePlaceId,
    kakaoPlaceId: place?.kakaoPlaceId ?? '',
    placeName: place?.placeName ?? '장소 정보 없음',
    groupName: place?.groupName ?? '',
    address: place?.address ?? '',
    phone: place?.phone ?? '',
    kakaoMapUrl: place?.kakaoMapUrl ?? '',
    latitude: place?.latitude,
    longitude: place?.longitude,
    boardId: place?.boardId,
    createdAt: place?.createdAt ?? '',
  }))
}

function getTracePreviewText(trace) {
  const elements = Array.isArray(trace?.elements) ? trace.elements : []
  const firstTextElement = elements.find((element) => String(element?.textContent ?? '').trim())
  const firstImageElement = elements.find((element) => String(element?.imageUrl ?? '').trim())

  return firstTextElement?.textContent?.trim() || (firstImageElement ? '이미지 흔적' : '남겨둔 흔적')
}

function getTracePreviewImage(trace) {
  const elements = Array.isArray(trace?.elements) ? trace.elements : []
  const firstImageElement = elements.find((element) => String(element?.imageUrl ?? '').trim())

  return firstImageElement?.imageUrl ?? ''
}

function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return new URL(path, API_BASE_URL).toString()
}

function formatDate(value) {
  if (!value) return '날짜 없음'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '날짜 없음'

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getFriendlyError(error) {
  return getApiErrorMessage(error, {
    fallback: '보관함을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    preferServerMessage: false,
    statusMessages: {
      403: '보관함을 볼 권한이 없습니다.',
      404: '보관함 정보를 찾을 수 없어요.',
      500: '서버 응답이 불안정해요. 잠시 후 다시 시도해 주세요.',
    },
  })
}

export default ArchivePage
