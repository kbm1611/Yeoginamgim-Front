import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, LocateFixed, Minus, MoreHorizontal, PencilLine, Plus } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import boardBg from '../assets/board-bg-3000x2200.png'
import recentPhoto1 from '../assets/images/home/recent/recent-1.jpg'
import recentPhoto2 from '../assets/images/home/recent/recent-2.jpg'
import recentPhoto3 from '../assets/images/home/recent/recent-3.jpg'

const BOARD_WIDTH = 3000
const BOARD_HEIGHT = 2200
const INITIAL_ZOOM = 0.65
const MIN_ZOOM = 0.45
const MAX_ZOOM = 1.6
const ZOOM_STEP = 0.15
const WHEEL_ZOOM_INTENSITY = 0.0015
const DUMMY_TRACES = [
  {
    id: 'dummy-postit-1',
    type: 'postit',
    x: 430,
    y: 340,
    width: 260,
    height: 260,
    rotation: -2.4,
    zIndex: 2,
    color: '#FFE79E',
    content: '커피 너무 맛있었다\n다음에도 또 올게요',
    date: '25.05.20',
  },
  {
    id: 'dummy-postit-2',
    type: 'postit',
    x: 970,
    y: 560,
    width: 250,
    height: 250,
    rotation: 1.8,
    zIndex: 3,
    color: '#BFE6F2',
    content: '창가 자리에서\n책 읽기 좋았어요',
    date: '25.05.21',
  },
  {
    id: 'dummy-photo-1',
    type: 'photocard',
    x: 1360,
    y: 410,
    width: 310,
    height: 380,
    rotation: -1.2,
    zIndex: 4,
    image: recentPhoto1,
    content: '오늘의 라떼',
    date: '25.05.21',
  },
  {
    id: 'dummy-postit-3',
    type: 'postit',
    x: 1850,
    y: 470,
    width: 270,
    height: 270,
    rotation: 2.6,
    zIndex: 5,
    color: '#FFC6D6',
    content: '사장님이 너무 친절했어요.\n또 올게요!',
    date: '25.05.22',
  },
  {
    id: 'dummy-photo-2',
    type: 'photocard',
    x: 1130,
    y: 980,
    width: 330,
    height: 405,
    rotation: 2.2,
    zIndex: 6,
    image: recentPhoto2,
    content: '햇살 들어오는 오후',
    date: '25.05.22',
  },
  {
    id: 'dummy-postit-4',
    type: 'postit',
    x: 1640,
    y: 1120,
    width: 255,
    height: 255,
    rotation: -1.7,
    zIndex: 7,
    color: '#FFF4D6',
    content: '조용해서 대화하기\n편한 곳',
    date: '25.05.23',
  },
  {
    id: 'dummy-postit-5',
    type: 'postit',
    x: 720,
    y: 1410,
    width: 265,
    height: 265,
    rotation: 2.1,
    zIndex: 8,
    color: '#DCC1F1',
    content: '여기 오면\n힘이 나요',
    date: '25.05.24',
  },
  {
    id: 'dummy-photo-3',
    type: 'photocard',
    x: 2010,
    y: 1370,
    width: 320,
    height: 395,
    rotation: -2.8,
    zIndex: 9,
    image: recentPhoto3,
    content: '기억 남기고 갑니다',
    date: '25.05.24',
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getBounds(viewport, zoom) {
  const scaledWidth = BOARD_WIDTH * zoom
  const scaledHeight = BOARD_HEIGHT * zoom
  const width = viewport.width || 390
  const height = viewport.height || 720

  const minX = scaledWidth > width ? width - scaledWidth : (width - scaledWidth) / 2
  const maxX = scaledWidth > width ? 0 : (width - scaledWidth) / 2
  const minY = scaledHeight > height ? height - scaledHeight : (height - scaledHeight) / 2
  const maxY = scaledHeight > height ? 0 : (height - scaledHeight) / 2

  return { maxX, maxY, minX, minY }
}

function clampTransform(transform, viewport) {
  const zoom = clamp(transform.zoom, MIN_ZOOM, MAX_ZOOM)
  const bounds = getBounds(viewport, zoom)

  return {
    x: clamp(transform.x, bounds.minX, bounds.maxX),
    y: clamp(transform.y, bounds.minY, bounds.maxY),
    zoom,
  }
}

function getTransformForBoardPoint(point, zoom, viewport) {
  return clampTransform({
    x: (viewport.width || 390) / 2 - point.x * zoom,
    y: (viewport.height || 720) / 2 - point.y * zoom,
    zoom,
  }, viewport)
}

function getViewportPoint(event, element) {
  const rect = element.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function getPointerDistance(first, second) {
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
}

function getPointerMidpoint(first, second, element) {
  const rect = element.getBoundingClientRect()

  return {
    x: (first.clientX + second.clientX) / 2 - rect.left,
    y: (first.clientY + second.clientY) / 2 - rect.top,
  }
}

function PostitDummyTrace({ trace, selected, onSelect }) {
  return (
    <button
      type="button"
      data-board-trace
      onClick={() => onSelect(trace.id)}
      className={`absolute rounded-[7px] px-5 pb-4 pt-7 text-left shadow-[0_12px_22px_rgba(74,48,29,0.16)] transition-transform duration-150 ${
        selected ? 'ring-[6px] ring-[#F5C84C]/45' : ''
      }`}
      style={{
        backgroundColor: trace.color,
        height: trace.height,
        left: trace.x,
        top: trace.y,
        transform: `rotate(${trace.rotation}deg) scale(${selected ? 1.06 : 1})`,
        transformOrigin: 'center',
        width: trace.width,
        zIndex: trace.zIndex,
      }}
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-7 w-24 -translate-x-1/2 -translate-y-3 rotate-[-3deg] rounded-[3px] bg-[#E9D8BD]/78 shadow-[0_3px_6px_rgba(51,35,20,0.08)]" />
      <span className="pointer-events-none absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 rounded-full bg-white/72 shadow-[0_2px_6px_rgba(65,43,22,0.16)]" />
      <p
        className="whitespace-pre-wrap break-keep text-[31px] leading-[1.12] text-[#3A2A20]"
        style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
      >
        {trace.content}
      </p>
      <p className="absolute bottom-5 left-5 text-[20px] text-[#8A735E]" style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}>
        - {trace.date}
      </p>
    </button>
  )
}

function PhotocardDummyTrace({ trace, selected, onSelect }) {
  return (
    <button
      type="button"
      data-board-trace
      onClick={() => onSelect(trace.id)}
      className={`absolute rounded-[5px] bg-[#FFFDF8] p-4 pb-8 text-left shadow-[0_14px_24px_rgba(54,34,20,0.17)] transition-transform duration-150 ${
        selected ? 'ring-[6px] ring-[#F5C84C]/45' : ''
      }`}
      style={{
        height: trace.height,
        left: trace.x,
        top: trace.y,
        transform: `rotate(${trace.rotation}deg) scale(${selected ? 1.05 : 1})`,
        transformOrigin: 'center',
        width: trace.width,
        zIndex: trace.zIndex,
      }}
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-8 w-24 -translate-x-1/2 -translate-y-3 rotate-[4deg] rounded-[3px] bg-[#E8B8B0]/78 shadow-[0_3px_6px_rgba(51,35,20,0.08)]" />
      <img src={trace.image} alt="" className="h-[72%] w-full rounded-[2px] object-cover" draggable="false" />
      <p
        className="mt-4 line-clamp-1 text-center text-[24px] leading-none text-[#3A2A20]"
        style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
      >
        {trace.content}
      </p>
      <p className="mt-1 text-center text-[17px] text-[#9A806A]" style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}>
        {trace.date}
      </p>
    </button>
  )
}

function DummyTrace({ trace, selected, onSelect }) {
  if (trace.type === 'photocard') {
    return <PhotocardDummyTrace trace={trace} selected={selected} onSelect={onSelect} />
  }

  return <PostitDummyTrace trace={trace} selected={selected} onSelect={onSelect} />
}

function BoardV2() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const viewportRef = useRef(null)
  const transformRef = useRef({ x: 0, y: 0, zoom: INITIAL_ZOOM })
  const viewportSizeRef = useRef({ width: 390, height: 720 })
  const dragRef = useRef(null)
  const suppressTraceClickRef = useRef(false)
  const activePointersRef = useRef(new Map())
  const pinchRef = useRef(null)
  const initializedRef = useRef(false)
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: INITIAL_ZOOM })
  const [isDragging, setIsDragging] = useState(false)
  const [selectedTraceId, setSelectedTraceId] = useState(null)

  const placeName = location.state?.boardName || location.state?.placeName || '커피정기구독 성결대점'

  const applyTransform = useCallback((nextTransform) => {
    const next = clampTransform(nextTransform, viewportSizeRef.current)
    transformRef.current = next
    setTransform(next)
    return next
  }, [])

  const moveToBoardCenter = useCallback(() => {
    applyTransform(getTransformForBoardPoint(
      { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
      transformRef.current.zoom,
      viewportSizeRef.current,
    ))
  }, [applyTransform])

  const zoomAtViewportPoint = useCallback((nextZoom, origin, baseTransform = transformRef.current) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    const ratio = clampedZoom / baseTransform.zoom

    applyTransform({
      x: origin.x - (origin.x - baseTransform.x) * ratio,
      y: origin.y - (origin.y - baseTransform.y) * ratio,
      zoom: clampedZoom,
    })
  }, [applyTransform])

  const zoomBy = useCallback((delta) => {
    zoomAtViewportPoint(transformRef.current.zoom + delta, {
      x: (viewportSizeRef.current.width || 390) / 2,
      y: (viewportSizeRef.current.height || 720) / 2,
    })
  }, [zoomAtViewportPoint])

  const handleWheel = useCallback((event) => {
    event.preventDefault()

    const viewport = viewportRef.current
    if (!viewport) return

    const origin = getViewportPoint(event, viewport)
    const nextZoom = transformRef.current.zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_INTENSITY)
    zoomAtViewportPoint(nextZoom, origin)
  }, [zoomAtViewportPoint])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined

    const updateSize = () => {
      const rect = viewport.getBoundingClientRect()
      viewportSizeRef.current = { width: rect.width, height: rect.height }

      if (!initializedRef.current) {
        initializedRef.current = true
        applyTransform(getTransformForBoardPoint(
          { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
          INITIAL_ZOOM,
          viewportSizeRef.current,
        ))
        return
      }

      applyTransform(transformRef.current)
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(viewport)

    return () => resizeObserver.disconnect()
  }, [applyTransform])

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target.closest('[data-board-control], a, input, textarea, select')) return

    event.currentTarget.setPointerCapture?.(event.pointerId)
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    })

    const pointers = Array.from(activePointersRef.current.values())
    if (event.pointerType !== 'mouse' && pointers.length >= 2) {
      const [first, second] = pointers
      const viewport = viewportRef.current
      if (!viewport) return

      pinchRef.current = {
        distance: getPointerDistance(first, second),
        origin: getPointerMidpoint(first, second, viewport),
        transform: transformRef.current,
      }
      dragRef.current = null
      setIsDragging(true)
      return
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      transform: transformRef.current,
    }
    suppressTraceClickRef.current = false
    setIsDragging(true)
  }, [])

  const handlePointerMove = useCallback((event) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
      })
    }

    if (pinchRef.current && activePointersRef.current.size >= 2) {
      const viewport = viewportRef.current
      if (!viewport) return

      const [first, second] = Array.from(activePointersRef.current.values())
      const distance = getPointerDistance(first, second)
      if (pinchRef.current.distance <= 0) return

      const zoom = pinchRef.current.transform.zoom * (distance / pinchRef.current.distance)
      const origin = getPointerMidpoint(first, second, viewport)
      const boardPoint = {
        x: (pinchRef.current.origin.x - pinchRef.current.transform.x) / pinchRef.current.transform.zoom,
        y: (pinchRef.current.origin.y - pinchRef.current.transform.y) / pinchRef.current.transform.zoom,
      }

      applyTransform({
        x: origin.x - boardPoint.x * clamp(zoom, MIN_ZOOM, MAX_ZOOM),
        y: origin.y - boardPoint.y * clamp(zoom, MIN_ZOOM, MAX_ZOOM),
        zoom,
      })
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const movedX = event.clientX - drag.startX
    const movedY = event.clientY - drag.startY
    if (Math.hypot(movedX, movedY) > 6) {
      suppressTraceClickRef.current = true
    }

    applyTransform({
      ...drag.transform,
      x: drag.transform.x + movedX,
      y: drag.transform.y + movedY,
    })
  }, [applyTransform])

  const endDrag = useCallback((event) => {
    activePointersRef.current.delete(event.pointerId)

    if (suppressTraceClickRef.current) {
      window.setTimeout(() => {
        suppressTraceClickRef.current = false
      }, 0)
    }

    if (pinchRef.current && activePointersRef.current.size < 2) {
      pinchRef.current = null

      const remainingPointer = Array.from(activePointersRef.current.values())[0]
      if (remainingPointer) {
        dragRef.current = {
          pointerId: remainingPointer.pointerId,
          startX: remainingPointer.clientX,
          startY: remainingPointer.clientY,
          transform: transformRef.current,
        }
        setIsDragging(true)
        return
      }
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      setIsDragging(false)
      return
    }
    if (activePointersRef.current.size === 0) setIsDragging(false)
  }, [])

  const handleSelectTrace = useCallback((traceId) => {
    if (suppressTraceClickRef.current) {
      suppressTraceClickRef.current = false
      return
    }

    setSelectedTraceId(traceId)
  }, [])

  return (
    <main className="app-device relative flex flex-col overflow-hidden bg-[#F4EEE5]" style={{ letterSpacing: 0 }}>
      <header className="relative z-20 border-b border-[#E8DDD0]/80 bg-[#F8F1E8]/94 px-3 pb-3 pt-3 shadow-[0_8px_18px_rgba(64,42,25,0.06)] backdrop-blur">
        <div className="flex h-10 items-center justify-between">
          <button
            type="button"
            data-board-control
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2F241B] active:bg-[#E9DDD0]"
          >
            <ChevronLeft size={25} strokeWidth={1.8} />
          </button>

          <h1 className="min-w-0 flex-1 truncate px-2 text-center text-[16px] font-bold leading-none text-[#251A12]">
            {placeName}
          </h1>

          <button
            type="button"
            data-board-control
            aria-label="더보기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2F241B] active:bg-[#E9DDD0]"
          >
            <MoreHorizontal size={24} strokeWidth={1.9} />
          </button>
        </div>

        <div className="mt-1 flex h-7 items-center justify-center gap-2 text-[13px] font-semibold text-[#4C3A2C]">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span>첫 번째 장</span>
          <ChevronLeft size={16} strokeWidth={1.8} className="rotate-180" />
        </div>
      </header>

      <section
        ref={viewportRef}
        className="relative flex-1 overflow-hidden bg-[#D8C8B6]"
        aria-label={`보드 ${id || 'v2'} 캔버스`}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onWheel={handleWheel}
      >
        <div
          className="absolute left-0 top-0 overflow-hidden shadow-[0_10px_35px_rgba(70,44,25,0.18)]"
          style={{
            backgroundImage: `url(${boardBg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            height: BOARD_HEIGHT,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.zoom})`,
            transformOrigin: '0 0',
            width: BOARD_WIDTH,
            willChange: 'transform',
          }}
        >
          {DUMMY_TRACES.map((trace) => (
            <DummyTrace
              key={trace.id}
              trace={trace}
              selected={selectedTraceId === trace.id}
              onSelect={handleSelectTrace}
            />
          ))}
        </div>

        <div className="absolute bottom-[96px] right-4 z-20 flex flex-col gap-3">
          <button
            type="button"
            data-board-control
            onClick={() => zoomBy(ZOOM_STEP)}
            aria-label="확대"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white/94 text-[#2D2219] shadow-[0_8px_18px_rgba(56,36,22,0.16)] backdrop-blur active:scale-95"
          >
            <Plus size={24} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            data-board-control
            onClick={() => zoomBy(-ZOOM_STEP)}
            aria-label="축소"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white/94 text-[#2D2219] shadow-[0_8px_18px_rgba(56,36,22,0.16)] backdrop-blur active:scale-95"
          >
            <Minus size={24} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            data-board-control
            onClick={moveToBoardCenter}
            aria-label="현재 위치"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white/94 text-[#2D2219] shadow-[0_8px_18px_rgba(56,36,22,0.16)] backdrop-blur active:scale-95"
          >
            <LocateFixed size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-0 right-0 z-20 flex justify-center px-5">
          <button
            type="button"
            data-board-control
            className="pointer-events-auto flex h-[52px] min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#FFD86F] px-7 text-[16px] font-extrabold text-[#2A2119] shadow-[0_10px_24px_rgba(83,55,25,0.23)] active:scale-[0.98]"
          >
            <PencilLine size={18} strokeWidth={2.2} />
            이곳에 남기기
          </button>
        </div>
      </section>
    </main>
  )
}

export default BoardV2
