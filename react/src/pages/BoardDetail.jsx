import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  Copy,
  Image,
  Map,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  RefreshCw,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchBoardDetail } from '../api/boards'
import { API_BASE_URL, clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { createTrace, fetchBoardTraces, uploadTraceImage } from '../api/traces'
import { createCustomBoardTrace, createInviteLink, getCustomBoard, getCustomBoardMembers, getCustomBoardTraces } from '../api/customBoards'
import BoardCanvas, { BOARD_HEIGHT, BOARD_WIDTH, findEmptySpotNear } from '../components/board/BoardCanvas'
import BottomNavigation from '../components/BottomNavigation'
import { traceToPost } from './tracePost.utils'

const BOARD_TYPE = {
  PLACE: 'PLACE',
  CUSTOM: 'CUSTOM',
}

const EMPTY_BOARD_PLACE = {
  boardType: BOARD_TYPE.PLACE,
  name: '',
  address: '',
  mapUrl: '',
  participants: [],
}

const EMPTY_BOARD_CUSTOM = {
  boardType: BOARD_TYPE.CUSTOM,
  name: '',
  address: '',
  participants: [],
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
    (boardDetail !== null ? fallback.name : '')
  )
}

function buildBoard(id, locationState, boardDetail) {
  const boardType = resolveBoardType(id, locationState, boardDetail)
  const fallback = boardType === BOARD_TYPE.CUSTOM ? EMPTY_BOARD_CUSTOM : EMPTY_BOARD_PLACE
  const place = boardDetail?.place ?? {}
  const participants = boardDetail?.participants ?? boardDetail?.members ?? []

  return {
    ...fallback,
    id,
    address: place.address ?? boardDetail?.address ?? '',
    boardType,
    mapUrl: place.kakaoMapUrl ?? boardDetail?.kakaoMapUrl ?? '',
    name: getBoardName(boardDetail, locationState, fallback),
    participants,
    photoUrl: resolveBackendUrl(place.imageUrl ?? boardDetail?.imageUrl ?? ''),
  }
}


function getPostId(post) {
  return post.traceId ?? post.id
}


function safeParseJson(value) {
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isUploadableLocalImage(value) {
  return typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:'))
}

function isRemoteImageUrl(value) {
  return typeof value === 'string' && (/^https?:\/\//i.test(value) || value.startsWith('/'))
}

function getTraceDefaultSize(type) {
  const isPolaroid = type === 'polaroid' || type === 'POLAROID'
  return isPolaroid
    ? { width: 300, height: 360 }
    : { width: 260, height: 260 }
}

function getFallbackBoardCenter() {
  return { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 }
}

function getLastViewportCenter(boardId, locationState) {
  const stateCenter = locationState?.lastViewportCenter
  if (Number.isFinite(stateCenter?.x) && Number.isFinite(stateCenter?.y)) return stateCenter

  const stored = safeParseJson(sessionStorage.getItem(`board:${boardId}:lastViewportCenter`))
  if (Number.isFinite(stored?.x) && Number.isFinite(stored?.y)) return stored

  return getFallbackBoardCenter()
}

function createBoardPageStub() {
  return {
    boardPageId: 'page-1',
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    status: 'stub',
  }
}

function createBoardPlacement({ boardId, draft, locationState, posts }) {
  const center = getLastViewportCenter(boardId, locationState)
  const size = getTraceDefaultSize(draft.type)
  const position = findEmptySpotNear(center, size, posts)
  const seed = Date.now() % 100000
  const rotation = Math.round(((Math.sin(seed) + 1) / 2 * 6 - 3) * 10) / 10
  const zIndex = 20 + posts.length

  return {
    boardPage: createBoardPageStub(),
    boardPosition: {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      rotation,
      scale: 1,
      zIndex,
    },
  }
}

function BoardTopBar({ title, onBack, onRefresh, onMore }) {
  return (
    <header className="flex items-center justify-between bg-[#F5EFE6] px-3 pb-2 pt-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </button>

      <h1 className="max-w-[200px] truncate text-center text-[16px] font-bold text-[#3B2A1E]">{title}</h1>

      <div className="flex items-center gap-1">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="새로고침"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
          >
            <RefreshCw size={16} strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onMore}
          aria-label="더보기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
        >
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}

function PlaceBoardHeader({ board, onBack, onRefresh, onOpenPlaceInfo }) {
  return (
    <BoardTopBar title={board.name} onBack={onBack} onRefresh={onRefresh} onMore={onOpenPlaceInfo} />
  )
}

function CustomBoardHeader({ board, onBack, onRefresh, onOpenInvite }) {
  const members = board.participants ?? []

  return (
    <header className="bg-[#F5EFE6] px-3 pb-2 pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <h1 className="max-w-[180px] truncate text-center text-[16px] font-bold text-[#3B2A1E]">{board.name}</h1>

        <div className="flex items-center gap-1">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="새로고침"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
            >
              <RefreshCw size={16} strokeWidth={2} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenInvite}
            aria-label="초대 및 멤버"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B2A1E] active:bg-[#E7DCCF]"
          >
            <UsersRound size={19} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 멤버 아바타 행 */}
      {members.length > 0 && (
        <div className="mt-1.5 flex items-center justify-center gap-1">
          <div className="flex items-center">
            {members.slice(0, 5).map((m, i) => (
              <div
                key={m.id ?? i}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#F5EFE6] bg-[#D4C4B0] text-[10px] font-bold text-[#5C4030]"
                style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 5 - i }}
                title={m.name}
              >
                {m.name?.[0] ?? '?'}
              </div>
            ))}
            {members.length > 5 && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#F5EFE6] bg-[#C4B4A0] text-[9px] font-bold text-[#5C4030]"
                style={{ marginLeft: -6 }}
              >
                +{members.length - 5}
              </div>
            )}
          </div>
          <span className="text-[12px] font-medium text-[#9B8B7B]">{members.length}명 함께</span>
        </div>
      )}
    </header>
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

function InviteSheet({ members, inviteLink, isInviteLinkLoading, onCopy, copyMessage, onClose }) {
  return (
    <BottomSheet title="초대" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-[16px] bg-[#EFE1D1] px-4 py-3">
          <p className="text-[12px] font-bold text-[#7A5D46]">초대 링크</p>
          {isInviteLinkLoading
            ? <p className="mt-2 text-[13px] font-semibold text-[#9A8068]">링크 생성 중...</p>
            : <p className="mt-2 break-all text-[13px] font-semibold leading-relaxed text-[#3D2415]">{inviteLink}</p>
          }
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
            {members.length === 0 ? (
              <p className="text-[13px] font-medium text-[#9A8068]">참여자 정보를 불러오는 중...</p>
            ) : members.map((member, i) => {
              const name = member.nickname ?? member.name ?? member.username ?? '멤버'
              const role = member.role === 'OWNER' ? '보드장' : (member.role ?? '참여자')
              const key = member.memberId ?? member.userId ?? member.id ?? i
              return (
                <div key={key} className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE1D1] text-[#6A4D37]">
                      <UserRound size={18} strokeWidth={1.8} />
                    </span>
                    <span className="text-[14px] font-bold text-[#2B1810]">{name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#8A715D]">{role}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </BottomSheet>
  )
}

function PlaceBoardChrome({ board, onBack, onRefresh, onOpenPlaceInfo, children }) {
  return (
    <>
      <PlaceBoardHeader board={board} onBack={onBack} onRefresh={onRefresh} onOpenPlaceInfo={onOpenPlaceInfo} />
      {children}
    </>
  )
}

function CustomBoardChrome({ board, onBack, onRefresh, onOpenInvite, children }) {
  return (
    <>
      <CustomBoardHeader board={board} onBack={onBack} onRefresh={onRefresh} onOpenInvite={onOpenInvite} />
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

  const [boardDetail, setBoardDetail] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [boardDetailErrorMessage, setBoardDetailErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [activeSheet, setActiveSheet] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [newPostId, setNewPostId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [placementDraft, setPlacementDraft] = useState(() => location.state?.placementDraft ?? null)
  const [showTypeSheet, setShowTypeSheet] = useState(false)
  const transformRef = useRef(null)
  const autoPlaceAttemptedDraftIdRef = useRef(null)

  const board = useMemo(() => buildBoard(boardId, location.state, boardDetail ?? (location.state?.boardName ? { boardName: location.state.boardName } : null)), [boardDetail, boardId, location.state])
  const [inviteLink, setInviteLink] = useState('')
  const [isInviteLinkLoading, setIsInviteLinkLoading] = useState(false)
  const [members, setMembers] = useState([])

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
        const isCustom = location.state?.boardType === BOARD_TYPE.CUSTOM
        const detail = isCustom
          ? await getCustomBoard(boardId)
          : await fetchBoardDetail(boardId)
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
          preferServerMessage: false,
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
        const isCustom = board.boardType === BOARD_TYPE.CUSTOM
        const data = isCustom
          ? await getCustomBoardTraces(boardId)
          : await fetchBoardTraces(boardId, { limit: 100 })
        if (!ignore) {
          const traces = data.traces ?? data.content ?? (Array.isArray(data) ? data : [])
          setPosts(traces.map(traceToPost))
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
  }, [board.boardType, boardId, location, navigate, reloadKey])

  const refreshTraces = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  const handleAdd = useCallback(() => {
    setShowTypeSheet(true)
  }, [])

  const handleSelectType = useCallback((type) => {
    setShowTypeSheet(false)
    const viewportCenter = transformRef.current?.getViewportCenter?.() ?? null
    if (viewportCenter) {
      sessionStorage.setItem(`board:${boardId}:lastViewportCenter`, JSON.stringify(viewportCenter))
    }
    navigate(`/board/${boardId}/postit`, {
      state: {
        boardName: board.name,
        boardType: board.boardType,
        lastViewportCenter: viewportCenter,
        initialTab: type,
      },
    })
  }, [board.boardType, board.name, boardId, navigate])

  const handlePlace = useCallback(async () => {
    if (!placementDraft || isSaving) return

    setIsSaving(true)
    setActionMessage('')

    try {
      const placement = createBoardPlacement({
        boardId,
        draft: placementDraft,
        locationState: location.state,
        posts,
      })
      let imageUrl = null
      const mediaImage = placementDraft.media?.image
      const isPolaroidDraft = placementDraft.type === 'polaroid' || placementDraft.type === 'POLAROID'

      if (placementDraft.capturedImage) {
        const response = await fetch(placementDraft.capturedImage)
        const blob = await response.blob()
        const file = new File([blob], 'trace.jpg', { type: blob.type || 'image/jpeg' })
        const uploaded = await uploadTraceImage(file)
        imageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      if (!imageUrl && isPolaroidDraft && isUploadableLocalImage(mediaImage)) {
        const response = await fetch(mediaImage)
        const blob = await response.blob()
        const isJpeg = blob.type === 'image/jpeg'
        const file = new File([blob], isJpeg ? 'trace.jpg' : 'trace.png', { type: blob.type || 'image/png' })
        const uploaded = await uploadTraceImage(file)
        imageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      if (!imageUrl && isUploadableLocalImage(mediaImage)) {
        const response = await fetch(mediaImage)
        const blob = await response.blob()
        const file = new File([blob], 'trace-photo.png', { type: blob.type || 'image/png' })
        const uploaded = await uploadTraceImage(file)
        imageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      const contentType = isPolaroidDraft
        ? 'POLAROID'
        : 'POST_IT'
      const nextStyle = {
        ...(placementDraft.style ?? {}),
        boardPageId: placement.boardPage.boardPageId,
        boardPosition: placement.boardPosition,
      }
      const tracePayload = {
        traceX: Math.round(placement.boardPosition.x),
        traceY: Math.round(placement.boardPosition.y),
        elements: [{
          contentType,
          imageUrl: imageUrl ?? (isRemoteImageUrl(mediaImage) ? mediaImage : null),
          styleJson: JSON.stringify(nextStyle),
          textContent: placementDraft.content ?? '',
        }],
      }
      const isCustomBoard = board.boardType === BOARD_TYPE.CUSTOM
      const createdTrace = isCustomBoard
        ? await createCustomBoardTrace(boardId, tracePayload)
        : await createTrace(boardId, tracePayload)

      const createdId = createdTrace?.traceId ?? createdTrace?.id
      const freshData = isCustomBoard
        ? await getCustomBoardTraces(boardId)
        : await fetchBoardTraces(boardId, { limit: 100 })
      const fresh = { traces: freshData.traces ?? freshData.content ?? (Array.isArray(freshData) ? freshData : []) }
      const newPosts = (fresh.traces ?? []).map(traceToPost).map((post) => {
        if (getPostId(post) !== createdId) return post
        return {
          ...post,
          boardId,
          boardPageId: post.boardPageId ?? placement.boardPage.boardPageId,
          x: post.x ?? placement.boardPosition.x,
          y: post.y ?? placement.boardPosition.y,
          width: post.width ?? placement.boardPosition.width,
          height: post.height ?? placement.boardPosition.height,
          rotation: post.rotation ?? placement.boardPosition.rotation,
          scale: post.scale ?? placement.boardPosition.scale,
          zIndex: post.zIndex ?? placement.boardPosition.zIndex,
          style: {
            ...(post.style ?? {}),
            boardPageId: post.style?.boardPageId ?? placement.boardPage.boardPageId,
            boardPosition: {
              ...placement.boardPosition,
              ...(post.style?.boardPosition ?? {}),
            },
          },
        }
      })
      const saved = newPosts.find((post) => {
        return getPostId(post) === createdId ||
          (Math.round(post.x ?? -1) === Math.round(placement.boardPosition.x) && Math.round(post.y ?? -1) === Math.round(placement.boardPosition.y))
      })
      const savedId = saved ? getPostId(saved) : createdId ?? placementDraft.id

      setPosts(newPosts)
      setPlacementDraft(null)
      sessionStorage.removeItem(`board:${boardId}:lastViewportCenter`)
      if (savedId) setNewPostId(savedId)
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
  }, [board.boardType, boardId, isSaving, location, navigate, placementDraft, posts])

  useEffect(() => {
    if (!placementDraft || isLoading || isSaving) return undefined
    if (autoPlaceAttemptedDraftIdRef.current === placementDraft.id) return undefined

    autoPlaceAttemptedDraftIdRef.current = placementDraft.id
    const timerId = window.setTimeout(() => handlePlace(), 0)
    return () => window.clearTimeout(timerId)
  }, [handlePlace, isLoading, isSaving, placementDraft])

  const handleOpenInvite = async () => {
    setActiveSheet('invite')
    setCopyMessage('')
    setIsInviteLinkLoading(true)
    try {
      const [inviteRes, membersRes] = await Promise.allSettled([
        createInviteLink(boardId),
        getCustomBoardMembers(boardId),
      ])
      if (inviteRes.status === 'fulfilled') {
        const res = inviteRes.value
        const code = res?.inviteCode ?? res?.code ?? res?.invite_code
        setInviteLink(code
          ? `${window.location.origin}/board/join/${code}`
          : `${window.location.origin}/board/${boardId}`
        )
      } else {
        setInviteLink(`${window.location.origin}/board/${boardId}`)
      }
      if (membersRes.status === 'fulfilled') {
        const data = membersRes.value
        const list = data?.members ?? data?.content ?? (Array.isArray(data) ? data : [])
        setMembers(list)
      }
    } finally {
      setIsInviteLinkLoading(false)
    }
  }

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('초대 링크를 복사했어요.')
    } catch {
      setCopyMessage('링크를 직접 복사해주세요.')
    }
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
        posts={posts}
        onAdd={handleAdd}
        onRefresh={refreshTraces}
        transformRef={transformRef}
        onPostDeleted={(postId) => setPosts((prev) => prev.filter((post) => getPostId(post) !== postId))}
        newPostId={newPostId}
        onNewPostFocused={() => setNewPostId(null)}
      />
    )
  }

  const chrome = (
    <>

      <div className="relative flex-1 overflow-hidden">
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
          <div className="absolute bottom-20 right-4 z-20">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              aria-label="흔적 남기기"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3B2A1E] shadow-[0_4px_16px_rgba(58,36,24,0.35)] active:scale-95 disabled:opacity-60 transition-transform"
            >
              <PencilLine size={22} strokeWidth={2} color="white" />
            </button>
          </div>
        ) : null}
      </div>
    </>
  )

  return (
    <main className="app-device relative flex flex-col overflow-hidden bg-[#F5EFE6]">
      {board.boardType === BOARD_TYPE.PLACE ? (
        <PlaceBoardChrome board={board} onBack={() => navigate('/map')} onRefresh={refreshTraces} onOpenPlaceInfo={() => setActiveSheet('place')}>
          {chrome}
        </PlaceBoardChrome>
      ) : (
        <CustomBoardChrome board={board} onBack={() => navigate('/my')} onRefresh={refreshTraces} onOpenInvite={handleOpenInvite}>
          {chrome}
        </CustomBoardChrome>
      )}

      <BottomNavigation />

      {/* 흔적 타입 선택 시트 */}
      {showTypeSheet && (
        <div className="absolute inset-0 z-50" onClick={() => setShowTypeSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#F5EFE6] pb-8 pt-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-9 rounded-full bg-[#D0C4B8]" />
            </div>
            <p className="mb-4 px-6 text-[15px] font-bold text-[#2A1A0E]">어떤 흔적을 남길까요?</p>
            <div className="flex gap-3 px-6">
              <button
                type="button"
                onClick={() => handleSelectType('postit')}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 border-[#EDE5D8] bg-white py-5 active:bg-[#F5EFE6]"
              >
                <span className="text-[32px]">📝</span>
                <div>
                  <p className="text-[14px] font-bold text-[#2A1A0E]">포스트잇</p>
                  <p className="mt-0.5 text-[11px] text-[#9B8B7B]">글·그림으로 꾸미기</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectType('polaroid')}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 border-[#EDE5D8] bg-white py-5 active:bg-[#F5EFE6]"
              >
                <span className="text-[32px]">📷</span>
                <div>
                  <p className="text-[14px] font-bold text-[#2A1A0E]">폴라로이드</p>
                  <p className="mt-0.5 text-[11px] text-[#9B8B7B]">사진으로 남기기</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSheet === 'place' ? <PlaceInfoSheet board={board} onClose={() => setActiveSheet(null)} /> : null}
      {activeSheet === 'invite' ? (
        <InviteSheet
          members={members}
          inviteLink={inviteLink}
          isInviteLinkLoading={isInviteLinkLoading}
          onCopy={handleCopyInvite}
          copyMessage={copyMessage}
          onClose={() => setActiveSheet(null)}
        />
      ) : null}
    </main>
  )
}

export default BoardDetail
