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
import { API_BASE_URL } from '../api/client'
import { createTraceReport } from '../api/reports'
import { addTraceLike, fetchBoardTraces, removeTraceLike, createTrace, uploadTraceImage } from '../api/traces'
import BoardCanvas from '../components/board/BoardCanvas'
import BottomNavigation from '../components/BottomNavigation'
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
  const [isSaving, setIsSaving] = useState(false)
  const [newPostId, setNewPostId] = useState(null)

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
        const data = await fetchBoardTraces(boardId, { sort, limit: 100 })

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

  // 보드 진입 시 placementDraft 있으면 자동 배치
  useEffect(() => {
    if (!placementDraft || isLoading || isSaving) return

    // 점유된 셀 계산
    const occupied = new Set(posts.map(p => `${p.cell?.row ?? 0}-${p.cell?.col ?? 0}`))

    // BFS로 빈 셀 탐색
    const findEmpty = () => {
      for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 2; col++) {
          if (!occupied.has(`${row}-${col}`)) return { row, col }
        }
      }
      return { row: 0, col: 0 }
    }

    const cell = findEmpty()
    handlePlace(cell)
  }, [placementDraft, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const headerPlaceName = boardDetail?.place?.placeName ?? id ?? '장소 보드'

  const handleAdd = () => navigate(`/board/${boardId}/postit`)

  const handlePlace = async (cell) => {
    if (!placementDraft) return
    setIsSaving(true)
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
      const newPosts = (fresh.traces ?? []).map(traceToPost)
      setPosts(newPosts)
      // 새로 추가된 흔적 찾기 (traceX=col, traceY=row로 매칭)
      const saved = newPosts.find(p => p.cell?.col === cell.col && p.cell?.row === cell.row)
      if (saved) setNewPostId(saved.id)
    } catch (e) {
      console.warn('흔적 저장 실패:', e)
    } finally {
      setIsSaving(false)
    }
  }


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
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {[
            { top: '8%', left: '8%', w: 180, h: 180, rotate: -3 },
            { top: '8%', left: '55%', w: 180, h: 180, rotate: 2 },
            { top: '42%', left: '8%', w: 180, h: 180, rotate: 1 },
            { top: '42%', left: '55%', w: 180, h: 180, rotate: -2 },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: s.top, left: s.left,
                width: s.w, height: s.h,
                borderRadius: 4,
                transform: `rotate(${s.rotate}deg)`,
                background: 'linear-gradient(90deg, #EDE5DA 25%, #F5EFE6 50%, #EDE5DA 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
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


    return (
      <BoardCanvas
        posts={posts}
        onAdd={handleAdd}
        transformRef={transformRef}
        onZoomChange={setZoom}
        onToggleLike={handleToggleLike}
        onReport={handleCreateReport}
        onPostDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
        newPostId={newPostId}
        onNewPostFocused={() => setNewPostId(null)}
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

        {/* 저장 중 토스트 */}
        {isSaving && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(42,28,20,0.85)', color: '#fff',
            padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 600,
            zIndex: 50, backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            흔적을 저장하는 중...
          </div>
        )}

        {!isLoading && !errorMessage ? (
          <div className="absolute bottom-24 right-4 z-20">
            <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAdd}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#3B2A1E] px-5 py-3 shadow-[0_6px_20px_rgba(58,36,24,0.35)]"
        >
          <PencilLine size={16} strokeWidth={2} className="text-white" />
          <span className="text-[14px] font-semibold text-white">흔적 남기기</span>
        </button>
      </div>
      <BottomNavigation />
    </main>
  )
}

export default BoardDetail
