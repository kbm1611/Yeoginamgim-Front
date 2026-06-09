import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  Copy,
  Image,
  Info,
  Map,
  Menu,
  MessageCircle,
  Minus,
  PencilLine,
  Plus,
  Search,
  Settings,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchBoardDetail } from '../api/boards'
import { API_BASE_URL, clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { createTrace, fetchBoardTraces, uploadTraceImage } from '../api/traces'
import boardBg from '../assets/image.png'
import BoardCanvas from '../components/board/BoardCanvas'
import BottomNavigation from '../components/BottomNavigation'
import { traceToPost } from './tracePost.utils'

const BOARD_TYPE = {
  PLACE: 'PLACE',
  CUSTOM: 'CUSTOM',
}

const DUMMY_BOARDS = {
  place: {
    boardType: BOARD_TYPE.PLACE,
    name: '대림창고',
    address: '서울 성동구 성수이로 78',
    mapUrl: 'https://map.kakao.com',
    photoLabel: '장소 사진 보기',
    participants: [],
  },
  custom: {
    boardType: BOARD_TYPE.CUSTOM,
    name: '제주도 여행',
    address: '',
    participants: [
      { id: 'me', name: '나', role: '보드장' },
      { id: 'min', name: '민지', role: '참여자' },
      { id: 'jun', name: '준호', role: '참여자' },
    ],
  },
}

function resolveBoardType(id, locationState, boardDetail) {
  const detailType = boardDetail?.boardType ?? boardDetail?.type
  if (detailType === BOARD_TYPE.PLACE || detailType === BOARD_TYPE.CUSTOM) return detailType
  if (locationState?.boardType === BOARD_TYPE.PLACE || locationState?.boardType === BOARD_TYPE.CUSTOM) {
    return locationState.boardType
  }

  const routeId = String(id ?? '').toLowerCase()
  if (routeId.includes('custom') || routeId.includes('memory')) return BOARD_TYPE.CUSTOM

  return BOARD_TYPE.PLACE
}

function resolveBackendUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

function getBoardName(boardDetail, locationState, fallback) {
  return (
    boardDetail?.boardName ??
    boardDetail?.name ??
    boardDetail?.place?.placeName ??
    boardDetail?.placeName ??
    locationState?.boardName ??
    fallback.name
  )
}

function buildBoard(id, locationState, boardDetail) {
  const boardType = resolveBoardType(id, locationState, boardDetail)
  const fallback = boardType === BOARD_TYPE.CUSTOM ? DUMMY_BOARDS.custom : DUMMY_BOARDS.place
  const place = boardDetail?.place ?? {}
  const participants = boardDetail?.participants ?? boardDetail?.members ?? fallback.participants

  return {
    ...fallback,
    id,
    address: place.address ?? boardDetail?.address ?? fallback.address,
    boardType,
    mapUrl: place.kakaoMapUrl ?? boardDetail?.kakaoMapUrl ?? fallback.mapUrl,
    name: getBoardName(boardDetail, locationState, fallback),
    participants,
    photoUrl: resolveBackendUrl(place.imageUrl ?? boardDetail?.imageUrl ?? ''),
  }
}

function sortPosts(posts, sort) {
  return [...posts].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime()
    const rightTime = new Date(right.createdAt).getTime()
    const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0
    const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0

    return sort === 'oldest' ? safeLeftTime - safeRightTime : safeRightTime - safeLeftTime
  })
}

function getPostId(post) {
  return post.traceId ?? post.id
}

function findEmptyCell(posts) {
  const occupied = new Set(posts.map((post) => `${post.cell?.row ?? 0}-${post.cell?.col ?? 0}`))

  for (let row = 0; row < 50; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      if (!occupied.has(`${row}-${col}`)) return { row, col }
    }
  }

  return { row: 0, col: 0 }
}

function BoardTopBar({ title, onBack, children }) {
  return (
    <header className="flex items-center justify-between bg-[#F5EFE6] px-4 pb-2 pt-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-[#3B2A1E]"
      >
        <ChevronLeft size={24} strokeWidth={1.8} />
      </button>

      <h1 className="max-w-[180px] truncate text-center text-[16px] font-bold text-[#3B2A1E]">{title}</h1>

      <div className="flex h-9 shrink-0 items-center gap-1">{children}</div>
    </header>
  )
}

function HeaderIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
    >
      {children}
    </button>
  )
}

function PlaceBoardHeader({ board, onBack, onOpenPlaceInfo }) {
  return (
    <BoardTopBar title={board.name} onBack={onBack}>
      <HeaderIconButton label="검색">
        <Search size={18} strokeWidth={1.8} />
      </HeaderIconButton>
      <HeaderIconButton label="장소 정보" onClick={onOpenPlaceInfo}>
        <Info size={18} strokeWidth={1.8} />
      </HeaderIconButton>
      <HeaderIconButton label="메뉴">
        <Menu size={19} strokeWidth={1.8} />
      </HeaderIconButton>
    </BoardTopBar>
  )
}

function CustomBoardHeader({ board, onBack, onOpenInvite }) {
  return (
    <BoardTopBar title={board.name} onBack={onBack}>
      <HeaderIconButton label="참여자">
        <UsersRound size={18} strokeWidth={1.8} />
      </HeaderIconButton>
      <HeaderIconButton label="초대" onClick={onOpenInvite}>
        <MessageCircle size={18} strokeWidth={1.8} />
      </HeaderIconButton>
      <HeaderIconButton label="설정">
        <Settings size={18} strokeWidth={1.8} />
      </HeaderIconButton>
    </BoardTopBar>
  )
}

function BoardSortControl({ sort, onSort }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLabel = sort === 'oldest' ? '오래된순' : '최신순'

  return (
    <div className="relative bg-[#F5EFE6] px-4 pb-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 items-center gap-1 rounded-full bg-white/78 px-3.5 text-[13px] font-bold text-[#4A3527] shadow-sm"
      >
        {currentLabel}
        <ChevronDown size={14} strokeWidth={2} />
      </button>

      {isOpen ? (
        <div className="absolute left-4 top-10 z-40 w-[112px] overflow-hidden rounded-[12px] border border-[#E1D4C5] bg-white shadow-[0_12px_24px_rgba(58,36,24,0.14)]">
          {[
            ['latest', '최신순'],
            ['oldest', '오래된순'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSort(key)
                setIsOpen(false)
              }}
              className={`block h-10 w-full px-3 text-left text-[13px] font-bold ${
                sort === key ? 'bg-[#F5EFE6] text-[#3B2A1E]' : 'text-[#7B6250]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ZoomControls({ zoom, onZoomIn, onZoomOut }) {
  return (
    <div className="flex flex-col items-center overflow-hidden rounded-[16px] bg-white/92 shadow-[0_4px_16px_rgba(58,36,24,0.15)] backdrop-blur-sm">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="확대"
        className="flex h-10 w-10 items-center justify-center border-b border-[#EDE5DA] text-[#3B2A1E]"
      >
        <Plus size={18} strokeWidth={2} />
      </button>
      <div className="flex h-9 w-10 items-center justify-center">
        <span className="text-[12px] font-semibold text-[#6B5A4C]">{zoom}%</span>
      </div>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="축소"
        className="flex h-10 w-10 items-center justify-center border-t border-[#EDE5DA] text-[#3B2A1E]"
      >
        <Minus size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

function BottomSheet({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/18" onClick={onClose}>
      <section
        className="w-full rounded-t-[24px] bg-[#FFF9F0] px-5 pb-8 pt-3 shadow-[0_-12px_30px_rgba(42,28,20,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-[#D7C7B6]" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#2B1810]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[13px] font-bold text-[#8A715D]">
            닫기
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function PlaceInfoSheet({ board, onClose }) {
  return (
    <BottomSheet title="장소 정보" onClose={onClose}>
      <div className="space-y-4">
        {board.photoUrl ? (
          <img src={board.photoUrl} alt="" className="h-36 w-full rounded-[16px] object-cover" />
        ) : null}
        <div>
          <p className="text-[20px] font-bold text-[#2B1810]">{board.name}</p>
          <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#7A6250]">
            {board.address || '주소 정보가 없습니다.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={board.mapUrl || undefined}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[14px] font-bold text-white"
          >
            <Map size={16} strokeWidth={2} />
            지도 보기
          </a>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#D9C7B4] bg-white text-[14px] font-bold text-[#5B3E2B]"
          >
            <Image size={16} strokeWidth={2} />
            장소 사진 보기
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

function InviteSheet({ board, inviteLink, onCopy, copyMessage, onClose }) {
  return (
    <BottomSheet title="초대" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-[16px] bg-[#EFE1D1] px-4 py-3">
          <p className="text-[12px] font-bold text-[#7A5D46]">초대 링크</p>
          <p className="mt-2 break-all text-[13px] font-semibold leading-relaxed text-[#3D2415]">{inviteLink}</p>
          {copyMessage ? <p className="mt-2 text-[12px] font-bold text-[#7A5D46]">{copyMessage}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[14px] font-bold text-white"
          >
            <Copy size={16} strokeWidth={2} />
            링크 복사
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#FEE500] text-[14px] font-bold text-[#3A2920]"
          >
            <MessageCircle size={16} strokeWidth={2} />
            카카오 공유
          </button>
        </div>

        <section>
          <h3 className="mb-3 text-[15px] font-bold text-[#2B1810]">참여자 목록</h3>
          <div className="space-y-2">
            {board.participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE1D1] text-[#6A4D37]">
                    <UserRound size={18} strokeWidth={1.8} />
                  </span>
                  <span className="text-[14px] font-bold text-[#2B1810]">{participant.name}</span>
                </div>
                <span className="text-[12px] font-bold text-[#8A715D]">{participant.role}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BottomSheet>
  )
}

function PlaceBoardChrome({ board, onBack, onOpenPlaceInfo, children }) {
  return (
    <>
      <PlaceBoardHeader board={board} onBack={onBack} onOpenPlaceInfo={onOpenPlaceInfo} />
      {children}
    </>
  )
}

function CustomBoardChrome({ board, onBack, onOpenInvite, children }) {
  return (
    <>
      <CustomBoardHeader board={board} onBack={onBack} onOpenInvite={onOpenInvite} />
      {children}
    </>
  )
}

function BoardLoadingSkeleton() {
  return (
    <div className="relative h-full w-full">
      {[
        { top: '8%', left: '8%', width: 180, height: 180, rotate: -3 },
        { top: '8%', left: '55%', width: 180, height: 180, rotate: 2 },
        { top: '42%', left: '8%', width: 180, height: 180, rotate: 1 },
        { top: '42%', left: '55%', width: 180, height: 180, rotate: -2 },
      ].map((item) => (
        <div
          key={`${item.top}-${item.left}`}
          className="absolute rounded-[4px]"
          style={{
            animation: 'shimmer 1.5s infinite',
            background: 'linear-gradient(90deg, #EDE5DA 25%, #F5EFE6 50%, #EDE5DA 75%)',
            backgroundSize: '200% 100%',
            height: item.height,
            left: item.left,
            top: item.top,
            transform: `rotate(${item.rotate}deg)`,
            width: item.width,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'place-daelim'

  const [sort, setSort] = useState('latest')
  const [boardDetail, setBoardDetail] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [boardDetailErrorMessage, setBoardDetailErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [activeSheet, setActiveSheet] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [newPostId, setNewPostId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [placementDraft, setPlacementDraft] = useState(() => location.state?.placementDraft ?? null)
  const transformRef = useRef(null)

  const board = useMemo(() => buildBoard(boardId, location.state, boardDetail), [boardDetail, boardId, location.state])
  const sortedPosts = useMemo(() => sortPosts(posts, sort), [posts, sort])
  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return `/board/${boardId}`
    return `${window.location.origin}/board/${boardId}`
  }, [boardId])

  useEffect(() => {
    if (location.state?.placementDraft) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  useEffect(() => {
    let ignore = false

    async function loadBoardDetail() {
      setBoardDetail(null)

      try {
        const detail = await fetchBoardDetail(boardId)
        if (!ignore) {
          setBoardDetail(detail)
          setBoardDetailErrorMessage('')
        }
      } catch (error) {
        if (ignore) return
        if (handleUnauthorizedApiError(error, {
          clearToken: clearAuthToken,
          location,
          navigate,
          redirect: true,
        })) return

        setBoardDetail(null)
        setBoardDetailErrorMessage(getApiErrorMessage(error, {
          fallback: '보드 정보를 불러오지 못했습니다.',
          statusMessages: {
            403: '이 보드에 접근할 권한이 없습니다.',
            404: '보드 정보를 찾을 수 없습니다.',
            500: '보드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        }))
      }
    }

    loadBoardDetail()

    return () => {
      ignore = true
    }
  }, [boardId, location, navigate])

  useEffect(() => {
    let ignore = false

    async function loadTraces() {
      setIsLoading(true)
      setErrorMessage('')
      setPosts([])

      try {
        const data = await fetchBoardTraces(boardId, { sort, limit: 100 })
        if (!ignore) {
          setPosts((data.traces ?? []).map(traceToPost))
        }
      } catch (error) {
        if (ignore) return
        if (handleUnauthorizedApiError(error, {
          clearToken: clearAuthToken,
          location,
          navigate,
          redirect: true,
        })) return

        setPosts([])
        setErrorMessage(getApiErrorMessage(error, {
          fallback: '흔적을 불러오지 못했습니다.',
          statusMessages: {
            403: '이 보드의 흔적을 볼 권한이 없습니다.',
            404: '보드 흔적을 찾을 수 없습니다.',
            500: '흔적을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        }))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadTraces()

    return () => {
      ignore = true
    }
  }, [boardId, location, navigate, reloadKey, sort])

  const refreshTraces = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  const handleAdd = useCallback(() => {
    navigate(`/board/${boardId}/postit`, {
      state: {
        boardName: board.name,
        boardType: board.boardType,
      },
    })
  }, [board.boardType, board.name, boardId, navigate])

  const handlePlace = useCallback(async (cell) => {
    if (!placementDraft || isSaving) return

    setIsSaving(true)
    setActionMessage('')

    try {
      let imageUrl = null
      if (placementDraft.capturedImage) {
        const response = await fetch(placementDraft.capturedImage)
        const blob = await response.blob()
        const file = new File([blob], 'trace.png', { type: 'image/png' })
        const uploaded = await uploadTraceImage(file)
        imageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      const contentType = placementDraft.type === 'polaroid' || placementDraft.type === 'POLAROID'
        ? 'POLAROID'
        : 'POST_IT'
      const createdTrace = await createTrace(boardId, {
        traceX: cell.col,
        traceY: cell.row,
        elements: [{
          contentType,
          imageUrl: imageUrl ?? placementDraft.media?.image ?? null,
          styleJson: JSON.stringify(placementDraft.style ?? {}),
          textContent: placementDraft.content ?? '',
        }],
      })

      const fresh = await fetchBoardTraces(boardId, { sort, limit: 100 })
      const newPosts = (fresh.traces ?? []).map(traceToPost)
      const createdId = createdTrace?.traceId ?? createdTrace?.id
      const saved = newPosts.find((post) => {
        return getPostId(post) === createdId || (post.cell?.col === cell.col && post.cell?.row === cell.row)
      })

      setPosts(newPosts)
      setPlacementDraft(null)
      if (saved) setNewPostId(getPostId(saved))
    } catch (error) {
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        location,
        navigate,
        redirect: true,
      })) return

      setActionMessage(getApiErrorMessage(error, {
        fallback: '흔적을 저장하지 못했습니다. 다시 시도해주세요.',
        statusMessages: {
          403: '흔적을 남길 권한이 없습니다.',
          404: '흔적을 남길 보드를 찾지 못했습니다.',
          409: '이미 사용 중인 위치입니다. 다른 위치에 남겨주세요.',
          500: '흔적을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
        },
      }))
    } finally {
      setIsSaving(false)
    }
  }, [boardId, isSaving, location, navigate, placementDraft, sort])

  useEffect(() => {
    if (!placementDraft || isLoading || isSaving) return undefined

    const cell = findEmptyCell(posts)
    const timerId = window.setTimeout(() => handlePlace(cell), 0)
    return () => window.clearTimeout(timerId)
  }, [handlePlace, isLoading, isSaving, placementDraft, posts])

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('초대 링크를 복사했어요.')
    } catch {
      setCopyMessage('링크를 직접 복사해주세요.')
    }
  }

  const handleZoomIn = () => {
    setZoom((value) => Math.min(value + 25, 200))
    transformRef.current?.zoomIn(0.25)
  }

  const handleZoomOut = () => {
    setZoom((value) => Math.max(value - 25, 50))
    transformRef.current?.zoomOut(0.25)
  }

  const renderBoardContent = () => {
    if (isLoading) {
      return <BoardLoadingSkeleton />
    }

    if (errorMessage) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#5C4030]">
          <p className="text-[16px] font-semibold">{errorMessage}</p>
          <button
            type="button"
            onClick={refreshTraces}
            className="rounded-full bg-[#3B2A1E] px-5 py-3 text-[14px] font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return (
      <BoardCanvas
        posts={sortedPosts}
        onAdd={handleAdd}
        onRefresh={refreshTraces}
        transformRef={transformRef}
        onZoomChange={setZoom}
        onPostDeleted={(postId) => setPosts((prev) => prev.filter((post) => getPostId(post) !== postId))}
        newPostId={newPostId}
        onNewPostFocused={() => setNewPostId(null)}
        showTraceSheet={false}
      />
    )
  }

  const chrome = (
    <>
      <BoardSortControl sort={sort} onSort={setSort} />

      <div className="relative flex-1 overflow-hidden">
        <img src={boardBg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0">{renderBoardContent()}</div>

        {boardDetailErrorMessage || actionMessage ? (
          <div className="absolute left-4 right-4 top-4 z-30 rounded-lg bg-[#FFF7F2] px-4 py-3 text-center text-[12px] font-semibold text-[#A74831] shadow-[0_6px_14px_rgba(58,36,24,0.12)]">
            {actionMessage || boardDetailErrorMessage}
          </div>
        ) : null}

        {isSaving ? (
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#2A1C14]/85 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur">
            흔적을 저장하는 중...
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="absolute bottom-[92px] right-4 z-20">
            <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          </div>
        ) : null}

        <div className="absolute bottom-5 left-5 right-5 z-20">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSaving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#3B2A1E] text-[16px] font-bold text-white shadow-[0_8px_22px_rgba(58,36,24,0.32)] disabled:opacity-60"
          >
            <PencilLine size={18} strokeWidth={2} />
            흔적 남기기
          </button>
        </div>
      </div>
    </>
  )

  return (
    <main className="app-device relative flex flex-col overflow-hidden bg-[#F5EFE6]">
      {board.boardType === BOARD_TYPE.PLACE ? (
        <PlaceBoardChrome board={board} onBack={() => navigate(-1)} onOpenPlaceInfo={() => setActiveSheet('place')}>
          {chrome}
        </PlaceBoardChrome>
      ) : (
        <CustomBoardChrome board={board} onBack={() => navigate(-1)} onOpenInvite={() => setActiveSheet('invite')}>
          {chrome}
        </CustomBoardChrome>
      )}

      <BottomNavigation />

      {activeSheet === 'place' ? <PlaceInfoSheet board={board} onClose={() => setActiveSheet(null)} /> : null}
      {activeSheet === 'invite' ? (
        <InviteSheet
          board={board}
          inviteLink={inviteLink}
          onCopy={handleCopyInvite}
          copyMessage={copyMessage}
          onClose={() => setActiveSheet(null)}
        />
      ) : null}
    </main>
  )
}

export default BoardDetail
