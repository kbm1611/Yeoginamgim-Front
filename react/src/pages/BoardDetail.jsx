import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronRight,
  Minus,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BoardCanvas from '../components/board/BoardCanvas'
import boardBg from '../assets/image.png'

const storageKey = (id) => `board_posts_${id}`

const SORT_TABS = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'ranking', label: '랭킹순' },
]

// ─── 헤더 ───────────────────────────────────────────────────────────────────

function BoardHeader({ placeName, traceCount, todayVisit, onBack }) {
  return (
    <div className="flex items-center justify-between bg-[#F5EFE6] px-4 pb-2 pt-3">
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#3B2A1E]"
      >
        <ChevronLeft size={24} strokeWidth={1.8} />
      </button>

      {/* 장소명 + 통계 */}
      <div className="flex flex-1 flex-col items-center">
        <button type="button" className="flex items-center gap-0.5">
          <span className="text-[16px] font-bold text-[#3B2A1E]">{placeName}</span>
          <ChevronRight size={15} strokeWidth={2.2} className="text-[#3B2A1E]" />
        </button>
        <p className="text-[12px] text-[#8B7A6B]">
          흔적 {traceCount}개 · 오늘 방문 {todayVisit}명
        </p>
      </div>

      {/* 우측 아이콘 */}
      <div className="flex items-center gap-1">
        <button type="button" className="flex h-8 w-8 items-center justify-center text-[#3B2A1E]">
          <Search size={18} strokeWidth={1.8} />
        </button>
        <button type="button" className="flex h-8 w-8 items-center justify-center text-[#3B2A1E]">
          <Bell size={18} strokeWidth={1.8} />
        </button>
        <button type="button" className="flex h-8 w-8 items-center justify-center text-[#3B2A1E]">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0" width="18" height="2" rx="1" fill="#3B2A1E" />
            <rect y="6" width="18" height="2" rx="1" fill="#3B2A1E" />
            <rect y="12" width="18" height="2" rx="1" fill="#3B2A1E" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── 필터 탭 바 ──────────────────────────────────────────────────────────────

function FilterBar({ sort, onSort }) {
  return (
    <div className="flex items-center justify-between bg-[#F5EFE6] px-4 pb-3 pt-0">
      {/* 탭 그룹 */}
      <div className="flex gap-1 rounded-full bg-white/70 p-1 shadow-sm">
        {SORT_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSort(key)}
            className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-all ${
              sort === key
                ? 'bg-[#3B2A1E] text-white shadow-sm'
                : 'text-[#6B5344]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 필터 버튼 */}
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border border-[#D8CDBF] bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#5C4A3B] shadow-sm"
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        필터
      </button>
    </div>
  )
}

// ─── 줌 컨트롤 ──────────────────────────────────────────────────────────────

function ZoomControls({ zoom, onZoomIn, onZoomOut }) {
  return (
    <div className="flex flex-col items-center overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(58,36,24,0.15)]">
      <button
        type="button"
        onClick={onZoomIn}
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
        className="flex h-10 w-10 items-center justify-center border-t border-[#EDE5DA] text-[#3B2A1E]"
      >
        <Minus size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [sort, setSort] = useState('latest')
  const [zoom, setZoom] = useState(100)
  const transformRef = useRef(null)

  const [posts, setPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(boardId))) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const draft = location.state?.placementDraft
    if (!draft) return
    setPosts((prev) => {
      const next = [{ ...draft }, ...prev]
      localStorage.setItem(storageKey(boardId), JSON.stringify(next))
      return next
    })
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.placementDraft])

  const sortedPosts =
    sort === 'latest'
      ? [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : sort === 'popular'
        ? [...posts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
        : [...posts]

  const handleAdd = () => navigate(`/board/${boardId}/postit`)

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 25, 200))
    transformRef.current?.zoomIn(0.25)
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 25, 50))
    transformRef.current?.zoomOut(0.25)
  }

  return (
    <main className="app-device flex flex-col overflow-hidden">
      {/* ── 헤더 ── */}
      <BoardHeader
        placeName={id ?? '메가커피 성수점'}
        traceCount={posts.length || 124}
        todayVisit={37}
        onBack={() => navigate(-1)}
      />

      {/* ── 필터 탭 ── */}
      <FilterBar sort={sort} onSort={setSort} />

      {/* ── 보드 캔버스 ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* 배경 이미지 */}
        <img
          src={boardBg}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        {/* 캔버스 */}
        <div className="absolute inset-0">
          <BoardCanvas
            posts={sortedPosts}
            onAdd={handleAdd}
            transformRef={transformRef}
            onZoomChange={setZoom}
          />
        </div>

        {/* 우하단 줌 컨트롤 */}
        <div className="absolute bottom-24 right-4 z-20">
          <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
        </div>

        {/* 우하단 흔적 남기기 버튼 */}
        <button
          type="button"
          onClick={handleAdd}
          className="absolute bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-[#3B2A1E] px-5 py-3 shadow-[0_6px_20px_rgba(58,36,24,0.35)]"
        >
          <PencilLine size={16} strokeWidth={2} className="text-white" />
          <span className="text-[14px] font-semibold text-white">흔적 남기기</span>
        </button>
      </div>
    </main>
  )
}

export default BoardDetail
