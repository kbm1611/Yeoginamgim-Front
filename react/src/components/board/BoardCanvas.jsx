import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import boardCanvasBg from '../../assets/board-bg-3000x2200.png'
import postitTexture from '../../assets/editor/image.png'

export const BOARD_WIDTH = 3000
export const BOARD_HEIGHT = 2200
const INITIAL_SCALE = 0.65
const MIN_SCALE = 0.45
const MAX_SCALE = 1.6
const TRACE_CARD_W = 260
const POSTIT_TRIMMED_SIZE = {
  width: 809,
  height: 958,
}
const POSTIT_CAPTURED_ASPECT_RATIO = POSTIT_TRIMMED_SIZE.width / POSTIT_TRIMMED_SIZE.height
const POLAROID_TRIMMED_SIZE = {
  width: 900,
  height: 1200,
}

function seeded(value) {
  const x = Math.sin(value + 1.5) * 10000
  return x - Math.floor(x)
}

function hashSeed(value) {
  const text = String(value ?? '')
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000
  }

  return hash || 1
}

function isPolaroidTrace(post) {
  return post.type === 'POLAROID' || post.type === 'polaroid'
}

function hasSavedPostitImage(post) {
  return Boolean(post.capturedImage || post.imageUrl)
}

function getPostitAspectRatio(post) {
  if (hasSavedPostitImage(post)) {
    return Number(post.style?.capturedAspectRatio) || (isPolaroidTrace(post) ? POLAROID_TRIMMED_SIZE.width / POLAROID_TRIMMED_SIZE.height : POSTIT_CAPTURED_ASPECT_RATIO)
  }

  return isPolaroidTrace(post)
    ? POLAROID_TRIMMED_SIZE.width / POLAROID_TRIMMED_SIZE.height
    : POSTIT_TRIMMED_SIZE.width / POSTIT_TRIMMED_SIZE.height
}

function getTraceId(post) {
  return post.traceId ?? post.id
}

function getCardHeight(post) {
  return post._cardH ?? getTraceSize(post).height
}

function hasOverlap(rect, placedRects) {
  const padding = 28

  return placedRects.some((placed) => {
    return !(
      rect.x + rect.width + padding < placed.x ||
      placed.x + placed.width + padding < rect.x ||
      rect.y + rect.height + padding < placed.y ||
      placed.y + placed.height + padding < rect.y
    )
  })
}

function rectsOverlap(a, b, padding = 28) {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  )
}

function getTraceSize(post) {
  const explicitWidth = Number(post.width ?? post.style?.boardPosition?.width)
  const width = Number.isFinite(explicitWidth) && explicitWidth > 0 ? explicitWidth : TRACE_CARD_W
  const explicitHeight = Number(post.height ?? post.style?.boardPosition?.height)

  if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
    return { width, height: explicitHeight }
  }

  const isPolaroid = isPolaroidTrace(post)
  const hasSavedImage = Boolean(post.capturedImage || post.imageUrl)
  const aspectRatio = hasSavedImage
    ? (Number(post.style?.capturedAspectRatio) || (isPolaroid ? 3 / 4 : 1))
    : (isPolaroid ? 3 / 4 : 1)

  return { width, height: Math.round(width / aspectRatio) }
}

function clampBoardPosition(x, y, width, height) {
  return {
    x: Math.min(Math.max(x, 80), BOARD_WIDTH - width - 80),
    y: Math.min(Math.max(y, 80), BOARD_HEIGHT - height - 80),
  }
}

function getExplicitTracePosition(post) {
  const stylePosition = post.style?.boardPosition
  const x = Number(post.x ?? stylePosition?.x)
  const y = Number(post.y ?? stylePosition?.y)

  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y }
  }

  return null
}

function getTraceLayoutPosition(post, index) {
  const explicit = getExplicitTracePosition(post)
  if (explicit) return explicit

  const traceSeed = hashSeed(getTraceId(post) ?? index)
  const anchors = [
    { x: 420, y: 360 },
    { x: 760, y: 430 },
    { x: 1110, y: 330 },
    { x: 1510, y: 520 },
    { x: 1900, y: 380 },
    { x: 520, y: 760 },
    { x: 930, y: 860 },
    { x: 1370, y: 780 },
    { x: 1780, y: 930 },
    { x: 2200, y: 780 },
    { x: 680, y: 1190 },
    { x: 1080, y: 1320 },
    { x: 1540, y: 1210 },
    { x: 1990, y: 1390 },
    { x: 2380, y: 1180 },
  ]
  const anchor = anchors[index % anchors.length]
  const layer = Math.floor(index / anchors.length)
  const offsetX = (seeded(traceSeed * 2.17) - 0.5) * 96 + layer * 34
  const offsetY = (seeded(traceSeed * 3.41) - 0.5) * 86 + layer * 42

  return {
    x: anchor.x + offsetX,
    y: anchor.y + offsetY,
  }
}

export function migrateLegacyTracePosition(post, index = 0) {
  const explicit = getExplicitTracePosition(post)
  if (explicit) return post

  const fallback = getTraceLayoutPosition(post, index)
  return {
    ...post,
    x: fallback.x,
    y: fallback.y,
    style: {
      ...(post.style ?? {}),
      boardPosition: {
        ...(post.style?.boardPosition ?? {}),
        x: fallback.x,
        y: fallback.y,
      },
    },
  }
}

function layoutPosts(posts) {
  const placedRects = []

  return posts.map((post, index) => {
    const migratedPost = migrateLegacyTracePosition(post, index)
    const base = getTraceLayoutPosition(migratedPost, index)
    const size = getTraceSize(post)
    const cardW = size.width
    const cardH = size.height
    const clamped = clampBoardPosition(base.x, base.y, cardW, cardH)
    let x = clamped.x
    let y = clamped.y
    let attempts = 0

    while (hasOverlap({ x, y, width: cardW, height: cardH }, placedRects) && attempts < 28) {
      const ring = Math.floor(attempts / 8) + 1
      const angle = attempts * 0.78
      const next = clampBoardPosition(
        base.x + Math.cos(angle) * ring * 86,
        base.y + Math.sin(angle) * ring * 68,
        cardW,
        cardH,
      )
      x = next.x
      y = next.y
      attempts += 1
    }

    placedRects.push({ x, y, width: cardW, height: cardH })
    const rotation = Number(post.rotation ?? post.style?.boardPosition?.rotation)
    const scale = Number(post.scale ?? post.style?.boardPosition?.scale)
    const zIndex = Number(post.zIndex ?? post.style?.boardPosition?.zIndex)

    return {
      ...post,
      _x: x,
      _y: y,
      _rotate: Number.isFinite(rotation) ? Math.min(3, Math.max(-3, rotation)) : (seeded(hashSeed(getTraceId(post) ?? index) * 4.73) - 0.5) * 6,
      _cardW: cardW,
      _cardH: cardH,
      _scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
      _zIndex: Number.isFinite(zIndex) ? zIndex : 10 + index,
    }
  })
}

export function findEmptySpotNear(center, newTraceSize, existingTraces = []) {
  const size = {
    width: newTraceSize?.width ?? TRACE_CARD_W,
    height: newTraceSize?.height ?? TRACE_CARD_W,
  }
  const existingRects = existingTraces.map((trace, index) => {
    const migratedTrace = migrateLegacyTracePosition(trace, index)
    const traceSize = getTraceSize(migratedTrace)
    return {
      x: migratedTrace._x ?? migratedTrace.x ?? migratedTrace.style?.boardPosition?.x ?? 0,
      y: migratedTrace._y ?? migratedTrace.y ?? migratedTrace.style?.boardPosition?.y ?? 0,
      width: migratedTrace._cardW ?? traceSize.width,
      height: migratedTrace._cardH ?? traceSize.height,
    }
  })

  const start = clampBoardPosition(center.x - size.width / 2, center.y - size.height / 2, size.width, size.height)
  for (let step = 0; step < 80; step += 1) {
    const ring = Math.floor(step / 8)
    const angle = step * 0.785
    const candidate = clampBoardPosition(
      start.x + Math.cos(angle) * ring * 92,
      start.y + Math.sin(angle) * ring * 72,
      size.width,
      size.height,
    )
    const rect = { ...candidate, ...size }
    if (!existingRects.some((existing) => rectsOverlap(rect, existing))) return candidate
  }

  return start
}

function PostItTraceCard({ post, isHighlighted }) {
  const cardW = post._cardW ?? TRACE_CARD_W
  const hasSavedImage = Boolean(post.capturedImage || post.imageUrl)
  const isPolaroid = isPolaroidTrace(post)
  const aspectRatio = hasSavedImage
    ? (Number(post.style?.capturedAspectRatio) || (isPolaroid ? 3 / 4 : 1))
    : (isPolaroid ? 3 / 4 : POSTIT_TRIMMED_SIZE.width / POSTIT_TRIMMED_SIZE.height)
  const cardH = post._cardH ?? Math.round(cardW / aspectRatio)
  const postitImage = post.capturedImage ?? post.imageUrl ?? null
  const shouldRenderText = !hasSavedImage

  return (
    <article
      className={`absolute flex flex-col text-[#35241A] ${isHighlighted ? 'trace-card-highlight' : ''}`}
      style={{
        borderRadius: hasSavedImage ? 0 : 4,
        boxShadow: isHighlighted
          ? '0 0 0 0 transparent'
          : '2px 4px 0px rgba(0,0,0,0.08), 3px 8px 16px rgba(0,0,0,0.14)',
        filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'none',
        height: cardH,
        left: post._x,
        overflow: 'hidden',
        pointerEvents: 'auto',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${(post._scale ?? 1) * (isHighlighted ? 1.08 : 1)})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
        zIndex: post._zIndex,
      }}
    >
      {postitImage ? (
        // capturedImage가 있으면 그 자체가 완성된 이미지 — 그대로 표시
        <img
          src={postitImage}
          alt=""
          draggable={false}
          className="pointer-events-none block h-full w-full"
          style={{ objectFit: 'fill', borderRadius: 0 }}
        />
      ) : (
        // 서버에서 온 레거시 포스트잇 (capturedImage 없음)
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: post.style?.postitColor ?? '#F7E58A' }}>
          <div className="relative z-10 flex h-full flex-col px-[15px] pb-[12px] pt-[21px]">
            {shouldRenderText && (
              <p
                className="min-h-0 flex-1 overflow-hidden text-[23px] leading-[1.12]"
                style={{
                  display: '-webkit-box',
                  fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 4,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {post.content}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

function PolaroidTraceCard({ post, isHighlighted }) {
  const cardW = post._cardW ?? TRACE_CARD_W
  const cardH = post._cardH ?? cardW * (POLAROID_TRIMMED_SIZE.height / POLAROID_TRIMMED_SIZE.width)
  const savedPolaroidImage = post.capturedImage ?? null
  const fallbackPhotoImage = post.media?.image ?? post.imageUrl
  const shouldRenderFrameLayers = !savedPolaroidImage
  const crop = post.style?.photoCrop ?? {}
  const photoScale = Number(crop.scale)

  return (
    <article
      className={`absolute text-[#35241A] ${isHighlighted ? 'trace-card-highlight' : ''}`}
      style={{
        filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'none',
        height: cardH,
        left: post._x,
        pointerEvents: 'auto',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${(post._scale ?? 1) * (isHighlighted ? 1.08 : 1)})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
        zIndex: post._zIndex,
      }}
    >
      {savedPolaroidImage ? (
        <img
          src={savedPolaroidImage}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          draggable="false"
        />
      ) : null}

      {shouldRenderFrameLayers ? (
        <div
          className="absolute inset-0 bg-white"
          style={{
            borderRadius: 4,
            boxShadow: '2px 4px 0 rgba(0,0,0,0.08), 5px 14px 24px rgba(0,0,0,0.16)',
            padding: Math.max(9, cardW * 0.055),
          }}
        >
          <div
            className="relative w-full overflow-hidden bg-[#E8E0D4]"
            style={{ height: '73%' }}
          >
            {fallbackPhotoImage ? (
              <img
                src={fallbackPhotoImage}
                alt=""
                className="h-full w-full object-cover"
                draggable="false"
                style={{
                  objectPosition: `${(Number(crop.x) || 0.5) * 100}% ${(Number(crop.y) || 0.5) * 100}%`,
                  transform: `scale(${Number.isFinite(photoScale) && photoScale > 1 ? photoScale : 1})`,
                  transformOrigin: `${(Number(crop.x) || 0.5) * 100}% ${(Number(crop.y) || 0.5) * 100}%`,
                }}
              />
            ) : null}
          </div>

          {post.content ? (
            <p
              className="mt-[7%] overflow-hidden text-center text-[20px] leading-[1.05] text-[#3A2A20]"
              style={{
                display: '-webkit-box',
                fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}
            >
              {post.content}
            </p>
          ) : null}

          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[-10px] h-[20px] w-[58px] -translate-x-1/2 rotate-[-3deg]"
            style={{
              backgroundColor: 'rgba(200, 171, 126, 0.62)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 4px rgba(70,45,20,0.12)',
            }}
          />
        </div>
      ) : null}
    </article>
  )
}

function EmptyBoard({ onAdd }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="rounded-[18px] bg-[#FFF8EC]/84 px-6 py-6 shadow-[0_10px_28px_rgba(74,48,29,0.10)] backdrop-blur-sm">
        <p
          className="text-[34px] leading-[1.3] text-[#5C4030]"
          style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
        >
          아직 남겨진 흔적이 없어요
        </p>
        <p className="mt-2 text-[14px] font-semibold text-[#8A6A50]">첫 번째 흔적을 남겨보세요</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full bg-[#3D2B1F] px-7 py-3 text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(61,36,21,0.24)]"
      >
        흔적 남기기
      </button>
    </div>
  )
}

function getClampedTransform(transform, viewport) {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale))
  const scaledWidth = BOARD_WIDTH * scale
  const scaledHeight = BOARD_HEIGHT * scale
  const viewportWidth = viewport?.width ?? 390
  const viewportHeight = viewport?.height ?? 600
  const minX = Math.min(0, viewportWidth - scaledWidth)
  const minY = Math.min(0, viewportHeight - scaledHeight)
  const maxX = scaledWidth <= viewportWidth ? (viewportWidth - scaledWidth) / 2 : 0
  const maxY = scaledHeight <= viewportHeight ? (viewportHeight - scaledHeight) / 2 : 0

  return {
    x: Math.min(maxX, Math.max(minX, transform.x)),
    y: Math.min(maxY, Math.max(minY, transform.y)),
    scale,
  }
}

function getViewportCenter(transform, viewport) {
  return {
    x: ((viewport?.width ?? 390) / 2 - transform.x) / transform.scale,
    y: ((viewport?.height ?? 600) / 2 - transform.y) / transform.scale,
  }
}

function getInitialTransform(viewport, posts) {
  const latest = posts?.[0]
  const target = latest
    ? { x: latest._x + (latest._cardW ?? TRACE_CARD_W) / 2, y: latest._y + (latest._cardH ?? TRACE_CARD_W) / 2 }
    : { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 }

  return getClampedTransform({
    x: (viewport?.width ?? 390) / 2 - target.x * INITIAL_SCALE,
    y: (viewport?.height ?? 600) / 2 - target.y * INITIAL_SCALE,
    scale: INITIAL_SCALE,
  }, viewport)
}

function useBoardTransform(transformRef, onZoomChange, laidPosts) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: INITIAL_SCALE })
  const stateRef = useRef({ x: 0, y: 0, scale: INITIAL_SCALE })
  const viewportRef = useRef({ width: 390, height: 600 })
  const panStart = useRef(null)
  const pinchRef = useRef(null)
  const containerRef = useRef(null)
  const initializedRef = useRef(false)

  const applyZoom = useCallback((nextScale, origin) => {
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    const { x, y, scale } = stateRef.current
    let nextX = x
    let nextY = y

    if (origin) {
      const ratio = clampedScale / scale
      nextX = origin.x - (origin.x - x) * ratio
      nextY = origin.y - (origin.y - y) * ratio
    }

    const next = getClampedTransform({ x: nextX, y: nextY, scale: clampedScale }, viewportRef.current)
    stateRef.current = next
    setTransform(next)
    onZoomChange?.(Math.round(next.scale * 100))
  }, [onZoomChange])

  const setClampedTransform = useCallback((nextTransform) => {
    const next = getClampedTransform(nextTransform, viewportRef.current)
    stateRef.current = next
    setTransform(next)
    onZoomChange?.(Math.round(next.scale * 100))
    return next
  }, [onZoomChange])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const updateViewport = () => {
      const rect = element.getBoundingClientRect()
      viewportRef.current = { width: rect.width, height: rect.height }
      setClampedTransform(stateRef.current)
    }

    updateViewport()
    const resizeObserver = new ResizeObserver(updateViewport)
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [setClampedTransform])

  useEffect(() => {
    if (initializedRef.current) return
    if (!laidPosts?.length) return
    const element = containerRef.current
    if (!element) return

    initializedRef.current = true
    const rect = element.getBoundingClientRect()
    viewportRef.current = { width: rect.width, height: rect.height }
    const initial = getInitialTransform(viewportRef.current, laidPosts)
    stateRef.current = initial
    setTransform(initial)
    onZoomChange?.(Math.round(initial.scale * 100))
  }, [laidPosts, onZoomChange])

  useEffect(() => {
    if (!transformRef) return

    transformRef.current = {
      state: {
        scale: stateRef.current.scale,
        positionX: stateRef.current.x,
        positionY: stateRef.current.y,
      },
      zoomIn: (step = 0.25) => {
        const vp = viewportRef.current
        applyZoom(stateRef.current.scale + step, { x: vp.width / 2, y: vp.height / 2 })
      },
      zoomOut: (step = 0.25) => {
        const vp = viewportRef.current
        applyZoom(stateRef.current.scale - step, { x: vp.width / 2, y: vp.height / 2 })
      },
      getViewportCenter: () => getViewportCenter(stateRef.current, viewportRef.current),
    }
  }, [applyZoom, transformRef])

  const onWheel = useCallback((event) => {
    event.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const origin = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    applyZoom(stateRef.current.scale * (1 - event.deltaY * 0.001), origin)
  }, [applyZoom])

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0) return
    panStart.current = {
      px: event.clientX,
      py: event.clientY,
      x: stateRef.current.x,
      y: stateRef.current.y,
    }
  }, [])

  const onPointerMove = useCallback((event) => {
    if (!panStart.current) return

    const next = {
      ...stateRef.current,
      x: panStart.current.x + event.clientX - panStart.current.px,
      y: panStart.current.y + event.clientY - panStart.current.py,
    }
    setClampedTransform(next)
  }, [setClampedTransform])

  const onPointerUp = useCallback(() => {
    panStart.current = null
  }, [])

  const onTouchStart = useCallback((event) => {
    if (event.touches.length === 2) {
      panStart.current = null
      const dx = event.touches[0].clientX - event.touches[1].clientX
      const dy = event.touches[0].clientY - event.touches[1].clientY
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale: stateRef.current.scale,
        mx: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        my: (event.touches[0].clientY + event.touches[1].clientY) / 2,
      }
      return
    }

    if (event.touches.length === 1) {
      pinchRef.current = null
      panStart.current = {
        px: event.touches[0].clientX,
        py: event.touches[0].clientY,
        x: stateRef.current.x,
        y: stateRef.current.y,
      }
    }
  }, [])

  const onTouchMove = useCallback((event) => {
    event.preventDefault()

    if (event.touches.length === 2 && pinchRef.current) {
      const dx = event.touches[0].clientX - event.touches[1].clientX
      const dy = event.touches[0].clientY - event.touches[1].clientY
      const rect = containerRef.current?.getBoundingClientRect()
      const origin = rect ? {
        x: pinchRef.current.mx - rect.left,
        y: pinchRef.current.my - rect.top,
      } : null

      applyZoom(pinchRef.current.scale * (Math.hypot(dx, dy) / pinchRef.current.dist), origin)
      return
    }

    if (event.touches.length === 1 && panStart.current) {
      const next = {
        ...stateRef.current,
        x: panStart.current.x + event.touches[0].clientX - panStart.current.px,
        y: panStart.current.y + event.touches[0].clientY - panStart.current.py,
      }
      setClampedTransform(next)
    }
  }, [applyZoom, setClampedTransform])

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
    panStart.current = null
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onWheel, onPointerMove, onPointerUp, onTouchMove])

  return {
    containerRef,
    onPointerDown,
    onTouchEnd,
    onTouchStart,
    setTransform,
    stateRef,
    transform,
    viewportRef,
  }
}

function BoardCanvas({
  posts,
  onAdd,
  onRefresh,
  transformRef,
  onZoomChange,
  onToggleLike,
  onReport,
  onPostDeleted,
  newPostId,
  onNewPostFocused,
}) {
  const navigate = useNavigate()
  const { id: boardId } = useParams()
  const laid = useMemo(() => layoutPosts(posts), [posts])
  const [highlightId, setHighlightId] = useState(null)
  const pointerDownInfo = useRef(null)

  const {
    containerRef,
    onPointerDown,
    onTouchEnd,
    onTouchStart,
    setTransform,
    stateRef,
    transform,
    viewportRef,
  } = useBoardTransform(transformRef, onZoomChange, laid)

  useEffect(() => {
    if (!newPostId) return undefined

    const post = laid.find((item) => getTraceId(item) === newPostId || item.id === newPostId)
    if (!post) return undefined

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return undefined

    const start = { x: stateRef.current.x, y: stateRef.current.y, scale: stateRef.current.scale }
    const targetScale = Math.min(1.05, Math.max(start.scale, 0.75))
    const targetX = rect.width / 2 - (post._x + (post._cardW ?? TRACE_CARD_W) / 2) * targetScale
    const targetY = rect.height / 2 - (post._y + getCardHeight(post) / 2) * targetScale
    const target = getClampedTransform({ x: targetX, y: targetY, scale: targetScale }, viewportRef.current)
    const startTime = performance.now()
    const duration = 600
    let timeoutId

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      stateRef.current = {
        ...stateRef.current,
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        scale: start.scale + (target.scale - start.scale) * ease,
      }
      setTransform({ ...stateRef.current })

      const canvasElement = containerRef.current?.querySelector('[data-board-canvas]')
      if (canvasElement) {
        canvasElement.style.transform = `translate(${stateRef.current.x}px, ${stateRef.current.y}px) scale(${stateRef.current.scale})`
      }

      if (t < 1) {
        requestAnimationFrame(animate)
        return
      }

      setHighlightId(newPostId)
      onZoomChange?.(Math.round(target.scale * 100))
      timeoutId = window.setTimeout(() => {
        setHighlightId(null)
        onNewPostFocused?.()
      }, 1000)
    }

    requestAnimationFrame(animate)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [containerRef, laid, newPostId, onNewPostFocused, onZoomChange, setTransform, stateRef, viewportRef])

  const handleContainerPointerDown = useCallback((event) => {
    pointerDownInfo.current = { x: event.clientX, y: event.clientY }
    onPointerDown(event)
  }, [onPointerDown])

  const handleContainerClick = useCallback((event) => {
    if (!pointerDownInfo.current) return

    const dx = Math.abs(event.clientX - pointerDownInfo.current.x)
    const dy = Math.abs(event.clientY - pointerDownInfo.current.y)
    if (dx > 8 || dy > 8) return

    const { x: tx, y: ty, scale } = stateRef.current
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const cx = (event.clientX - rect.left - tx) / scale
    const cy = (event.clientY - rect.top - ty) / scale

    for (let index = laid.length - 1; index >= 0; index -= 1) {
      const post = laid[index]
      const cardW = post._cardW ?? TRACE_CARD_W
      const cardH = post._cardH ?? getCardHeight(post)
      const rotate = post._rotate ?? 0
      const rad = (rotate * Math.PI) / 180
      const cos = Math.cos(-rad)
      const sin = Math.sin(-rad)
      const dx = cx - post._x
      const dy = cy - post._y
      const lx = cos * dx - sin * dy
      const ly = sin * dx + cos * dy
      if (lx >= 0 && lx <= cardW && ly >= 0 && ly <= cardH) {
        const traceId = getTraceId(post)
        navigate(`/board/${boardId}/trace/${traceId}`, { state: { post } })
        return
      }
    }
  }, [containerRef, laid, stateRef])

  if (posts.length === 0) {
    return <EmptyBoard onAdd={onAdd} />
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ cursor: 'grab', position: 'relative', touchAction: 'none' }}
      onClick={handleContainerClick}
      onPointerDown={handleContainerPointerDown}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      <div
        data-board-canvas
        className="absolute overflow-hidden"
        style={{
          backgroundImage: `url(${boardCanvasBg})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          height: BOARD_HEIGHT,
          pointerEvents: 'none',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: BOARD_WIDTH,
          willChange: 'transform',
        }}
      >
        {laid.map((post) => {
          const key = getTraceId(post)
          const isHighlighted = highlightId === key

          return (
            <div key={key}>
              {isPolaroidTrace(post) ? (
                <PolaroidTraceCard post={post} isHighlighted={isHighlighted} />
              ) : (
                <PostItTraceCard post={post} isHighlighted={isHighlighted} />
              )}
            </div>
          )
        })}
      </div>

      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="흔적 새로고침"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/76 text-[#5E4938] shadow-[0_4px_14px_rgba(58,36,24,0.14)] backdrop-blur-sm active:bg-white/90"
        >
          <RefreshCw size={15} strokeWidth={1.9} />
        </button>
      ) : null}

    </div>
  )
}

export default BoardCanvas
