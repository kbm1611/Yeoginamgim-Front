import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Minus,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchBoardDetail } from '../api/boards'
import PlacementOverlay from '../components/board/PlacementOverlay'
import { API_BASE_URL } from '../api/client'
import { createTraceReport } from '../api/reports'
import { addTraceLike, fetchBoardTraces, removeTraceLike, createTrace, uploadTraceImage } from '../api/traces'
import BoardCanvas from '../components/board/BoardCanvas'
import PlacementOverlay from '../components/board/PlacementOverlay'
import boardBg from '../assets/image.png'

const POSTIT_COLOR_BY_HEX = {
  '#fff8dc': 'cream',
  '#ffe4e1': 'pink',
  '#f3d98e': 'yellow',
  '#eeb7c6': 'pink',
  '#d2d4a2': 'green',
  '#f0ead6': 'cream',
  '#f8f6f0': 'white',
}

const SORT_TABS = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'oldest', label: '오래된순' },
]

function parseStyleJson(styleJson) {
  if (!styleJson) return {}
  if (typeof styleJson === 'object') return styleJson

  try {
    return JSON.parse(styleJson)
  } catch {
    return {}
  }
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  if (/^[a-zA-Z]:[\\/]/.test(imageUrl)) return ''
  if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`

  return imageUrl
}

function resolvePaperColor(style) {
  if (style.paperColor) return style.paperColor

  const backgroundColor = style.backgroundColor?.toLowerCase()
  return POSTIT_COLOR_BY_HEX[backgroundColor] ?? 'yellow'
}

function formatDateLabel(dateText) {
  if (!dateText) return ''

  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function traceToPost(trace) {
  const element = trace.elements?.[0] ?? {}
  const style = parseStyleJson(element.styleJson)
  const isPolaroid = element.contentType === 'POLAROID'

  return {
    id: trace.traceId ?? element.elementId,
    type: isPolaroid ? 'polaroid' : 'postit',
    content: element.textContent ?? '',
    capturedImage: resolveImageUrl(element.imageUrl),  // 서버 이미지 → 보드에 표시
    media: isPolaroid
      ? {
          image: resolveImageUrl(element.imageUrl),
          dateLabel: formatDateLabel(trace.createdAt),
        }
      : undefined,
    style: isPolaroid
      ? {
          ...style,
          color: style.textColor ?? '#2E231B',
          backgroundColor: style.backgroundColor ?? style.paperColor ?? '#FFFFFF',
        }
      : {
          ...style,
          paperColor: resolvePaperColor(style),
        },
    cell: {
      col: trace.traceX ?? 0,
      row: trace.traceY ?? 0,
    },
    createdAt: trace.createdAt,
    likes: trace.likeCount ?? 0,
    liked: trace.liked === true,
    nickname: trace.nickname,
  }
}

function BoardHeader({ placeName, onBack }) {
  return (
    <div className="flex items-center justify-between bg-[#F5EFE6] px-4 pb-2 pt-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#3B2A1E]"
      >
        <ChevronLeft size={24} strokeWidth={1.8} />
      </button>

      <div className="flex flex-1 flex-col items-center">
        <button type="button" className="flex items-center gap-0.5">
          <span className="text-[16px] font-bold text-[#3B2A1E]">{placeName}</span>
          <ChevronRight size={15} strokeWidth={2.2} className="text-[#3B2A1E]" />
        </button>
      </div>

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

function FilterBar({ sort, onSort }) {
  return (
    <div className="flex items-center justify-between bg-[#F5EFE6] px-4 pb-3 pt-0">
      <div className="flex gap-1 rounded-full bg-white/70 p-1 shadow-sm">
        {SORT_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSort(key)}
            className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-all ${
              sort === key ? 'bg-[#3B2A1E] text-white shadow-sm' : 'text-[#6B5344]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [sort, setSort] = useState('latest')
  const [boardDetail, setBoardDetail] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [zoom, setZoom] = useState(100)
  const transformRef = useRef(null)

  const [placementDraft, setPlacementDraft] = useState(() => {
    const draft = location.state?.placementDraft ?? null
    if (draft) setTimeout(() => window.history.replaceState({}, ''), 0)
    return draft
  })

  useEffect(() => {
    let ignore = false

    async function loadBoardDetail() {
      setBoardDetail(null)

      try {
        const detail = await fetchBoardDetail(boardId)
        if (!ignore) {
          setBoardDetail(detail)
        }
      } catch {
        if (!ignore) {
          setBoardDetail(null)
        }
      }
    }

    loadBoardDetail()

    return () => {
      ignore = true
    }
  }, [boardId])

  useEffect(() => {
    let ignore = false

    async function loadTraces() {
      setIsLoading(true)
      setErrorMessage('')
      setPosts([])

      try {
        const mockData = await fetchBoardTraces(boardId, { sort, limit: 100 })

        if (ignore) return
        setPosts((data.traces ?? []).map(traceToPost))
      } catch (error) {
        if (ignore) return
        setPosts([])
        setErrorMessage(error.message ?? '흔적을 불러오지 못했습니다.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadTraces()
    return () => { ignore = true }
  }, [boardId, sort])

  const headerPlaceName = boardDetail?.place?.placeName ?? id ?? '장소 보드'

  const handleAdd = () => navigate(`/board/${boardId}/postit`)

  const handlePlace = async (cell) => {
    if (!placementDraft) return
    setPlacementDraft(null)

    try {
      // 1. 캡처 이미지 업로드
      let imageUrl = null
      if (placementDraft.capturedImage) {
        const res = await fetch(placementDraft.capturedImage)
        const blob = await res.blob()
        const file = new File([blob], 'trace.png', { type: 'image/png' })
        const uploaded = await uploadTraceImage(file)
        imageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      // 2. 흔적 생성
      const contentType = placementDraft.type === 'polaroid' ? 'POLAROID' : 'POST_IT'
      await createTrace(boardId, {
        traceX: cell.col,
        traceY: cell.row,
        elements: [{
          contentType,
          textContent: placementDraft.content ?? '',
          imageUrl: imageUrl ?? placementDraft.media?.image ?? null,
          styleJson: JSON.stringify(placementDraft.style ?? {}),
        }],
      })

      // 3. 저장 성공 → 목록 새로고침
      const fresh = await fetchBoardTraces(boardId, { sort, limit: 100 })
      setPosts((fresh.traces ?? []).map(traceToPost))
    } catch (e) {
      console.warn('흔적 저장 실패:', e)
    }
  }

  const handleCancelPlacement = () => setPlacementDraft(null)

  const handleToggleLike = async (post) => {
    const result = post.liked ? await removeTraceLike(post.id) : await addTraceLike(post.id)

    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: result.liked === true,
              likes: result.likeCount ?? item.likes,
            }
          : item,
      ),
    )

    return result
  }

  const handleCreateReport = (post, reportKind) => {
    return createTraceReport(post.id, { reportKind })
  }

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 25, 200))
    transformRef.current?.zoomIn(0.25)
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 25, 50))
    transformRef.current?.zoomOut(0.25)
  }

  const renderBoardContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-[18px] font-semibold text-[#5C4030]">
          흔적을 불러오는 중...
        </div>
      )
    }


    return (
      <BoardCanvas
        posts={posts}
        onAdd={handleAdd}
        transformRef={transformRef}
        onZoomChange={setZoom}
        onToggleLike={handleToggleLike}
        onReport={handleCreateReport}
      />
    )
  }

  return (
    <main className="app-device flex flex-col overflow-hidden">
      <BoardHeader
        placeName={headerPlaceName}
        onBack={() => navigate(-1)}
      />

      <FilterBar sort={sort} onSort={setSort} />

      <div className="relative flex-1 overflow-hidden">
        <img
          src={boardBg}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0">{renderBoardContent()}</div>

        {/* 배치 모드 오버레이 */}
        {placementDraft && (
          <PlacementOverlay
            draft={placementDraft}
            posts={posts}
            transformRef={transformRef}
            onPlace={handlePlace}
            onCancel={handleCancelPlacement}
          />
        )}

        {!isLoading && !errorMessage ? (
          <div className="absolute bottom-24 right-4 z-20">
            <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          </div>
        ) : null}

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
