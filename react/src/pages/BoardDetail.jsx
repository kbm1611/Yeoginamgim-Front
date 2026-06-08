import { useEffect, useMemo, useRef, useState } from 'react'
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
import BoardCanvas from '../components/board/BoardCanvas'
import BottomNavigation from '../components/BottomNavigation'
import boardBg from '../assets/image.png'

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

const DUMMY_POSTS = [
  {
    traceId: 1,
    type: 'POSTIT',
    content: '커피 맛집 발견! 라떼 최고. 다음에도 이 자리에서 만나기.',
    authorName: '지훈',
    likeCount: 8,
    createdAt: '2026-06-06T12:00:00',
    liked: false,
    style: { paperColor: 'yellow' },
    cell: { col: 0, row: 0 },
  },
  {
    traceId: 2,
    type: 'POSTIT',
    content: '비 오던 날이라 더 오래 기억날 것 같아. 조용한 음악까지 완벽했어.',
    authorName: '지민',
    likeCount: 4,
    createdAt: '2026-06-05T18:30:00',
    liked: true,
    style: { paperColor: 'cream' },
    cell: { col: 1, row: 0 },
  },
  {
    traceId: 3,
    type: 'POLAROID',
    content: '친구랑 힐링 데이트',
    authorName: '예지',
    likeCount: 9,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-06-04T15:10:00',
    liked: false,
    style: { backgroundColor: '#FFFFFF', color: '#2E231B' },
    cell: { col: 0, row: 1 },
  },
  {
    traceId: 4,
    type: 'POSTIT',
    content: '사진보다 그때 웃던 말투가 더 생각난다.',
    authorName: '소연',
    likeCount: 6,
    createdAt: '2026-06-03T20:20:00',
    liked: false,
    style: { paperColor: 'pink' },
    cell: { col: 1, row: 1 },
  },
]

function resolveBoardType(id, locationState) {
  if (locationState?.boardType === BOARD_TYPE.PLACE || locationState?.boardType === BOARD_TYPE.CUSTOM) {
    return locationState.boardType
  }

  const routeId = String(id ?? '').toLowerCase()
  if (routeId.includes('custom') || routeId.includes('memory')) return BOARD_TYPE.CUSTOM

  return BOARD_TYPE.PLACE
}

function buildBoard(id, locationState) {
  const boardType = resolveBoardType(id, locationState)
  const fallback = boardType === BOARD_TYPE.CUSTOM ? DUMMY_BOARDS.custom : DUMMY_BOARDS.place

  return {
    ...fallback,
    id,
    boardType,
    name: locationState?.boardName ?? fallback.name,
  }
}

function sortPosts(posts, sort) {
  return [...posts].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime()
    const rightTime = new Date(right.createdAt).getTime()
    return sort === 'oldest' ? leftTime - rightTime : rightTime - leftTime
  })
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
        <div>
          <p className="text-[20px] font-bold text-[#2B1810]">{board.name}</p>
          <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#7A6250]">{board.address}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[14px] font-bold text-white"
          >
            <Map size={16} strokeWidth={2} />
            지도 보기
          </button>
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

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'place-daelim'

  const board = useMemo(() => buildBoard(boardId, location.state), [boardId, location.state])
  const [sort, setSort] = useState('latest')
  const [posts, setPosts] = useState(() => DUMMY_POSTS)
  const [zoom, setZoom] = useState(100)
  const [activeSheet, setActiveSheet] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [newPostId, setNewPostId] = useState(null)
  const transformRef = useRef(null)
  const processedDraftRef = useRef(null)

  const sortedPosts = useMemo(() => sortPosts(posts, sort), [posts, sort])

  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return `/board/${boardId}`
    return `${window.location.origin}/board/${boardId}`
  }, [boardId])

  const refreshTraces = () => {
    setPosts((prev) => {
      if (prev.length === 0) return DUMMY_POSTS
      return [...prev]
    })
  }

  useEffect(() => {
    const draft = location.state?.placementDraft
    if (!draft) return
    if (processedDraftRef.current === draft) return
    processedDraftRef.current = draft

    const occupied = new Set(posts.map((post) => `${post.cell?.row ?? 0}-${post.cell?.col ?? 0}`))
    let nextCell = { row: 0, col: 0 }

    for (let row = 0; row < 50; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        if (!occupied.has(`${row}-${col}`)) {
          nextCell = { row, col }
          row = 50
          break
        }
      }
    }

    const nextPost = {
      traceId: `local-${Date.now()}`,
      type: draft.type === 'polaroid' || draft.type === 'POLAROID' ? 'POLAROID' : 'POSTIT',
      content: draft.content ?? '',
      capturedImage: draft.capturedImage,
      imageUrl: draft.media?.image ?? null,
      media: draft.media,
      authorName: '나',
      likeCount: 0,
      style: draft.style ?? { paperColor: 'yellow' },
      cell: { col: nextCell.col, row: nextCell.row },
      createdAt: new Date().toISOString(),
      liked: false,
    }

    setPosts((prev) => [nextPost, ...prev])
    setNewPostId(nextPost.traceId)
    window.history.replaceState({}, '')

  }, [location.state, posts])

  const handleAdd = () => {
    navigate(`/board/${boardId}/postit`, {
      state: {
        boardType: board.boardType,
        boardName: board.name,
      },
    })
  }

  const handleToggleLike = async (post) => {
    const nextLiked = !post.liked
    const nextLikes = Math.max(0, (post.likeCount ?? post.likes ?? 0) + (nextLiked ? 1 : -1))
    const postId = post.traceId ?? post.id

    setPosts((prev) =>
      prev.map((item) =>
        (item.traceId ?? item.id) === postId
          ? { ...item, liked: nextLiked, likeCount: nextLikes, likes: nextLikes }
          : item,
      ),
    )

    return { liked: nextLiked, likeCount: nextLikes }
  }

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

  const chrome = (
    <>
      <BoardSortControl sort={sort} onSort={setSort} />

      <div className="relative flex-1 overflow-hidden">
        <img src={boardBg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0">
          <BoardCanvas
            posts={sortedPosts}
            onAdd={handleAdd}
            onRefresh={refreshTraces}
            transformRef={transformRef}
            onZoomChange={setZoom}
            onToggleLike={handleToggleLike}
            onReport={() => Promise.resolve()}
            onPostDeleted={(postId) => setPosts((prev) => prev.filter((post) => (post.traceId ?? post.id) !== postId))}
            newPostId={newPostId}
            onNewPostFocused={() => setNewPostId(null)}
            showTraceSheet={false}
          />
        </div>

        <div className="absolute bottom-[92px] right-4 z-20">
          <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-20">
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#3B2A1E] text-[16px] font-bold text-white shadow-[0_8px_22px_rgba(58,36,24,0.32)]"
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
