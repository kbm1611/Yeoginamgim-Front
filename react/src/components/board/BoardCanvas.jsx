import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import postitTexture from '../../assets/editor/postit.png'
import polaroidFrame from '../../assets/editor/polaroid.png'
import TraceBottomSheet from './TraceBottomSheet'

const BOARD_CANVAS_W = 760
const TRACE_CARD_W = 190
const GRID_COLUMNS = 3
const GRID_GAP_X = 42
const GRID_GAP_Y = 68
const GRID_PADDING_X = 34
const GRID_PADDING_Y = 52
const POSTIT_TRIMMED_SIZE = {
  width: 1536,
  height: 1024,
}
const POSTIT_CAPTURED_ASPECT_RATIO = POSTIT_TRIMMED_SIZE.width / POSTIT_TRIMMED_SIZE.height
const POLAROID_TRIMMED_SIZE = {
  width: 608,
  height: 656,
}
const POLAROID_SOURCE_CROP = { x: 464, y: 148, width: 608, height: 656 }

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
    return Number(post.style?.capturedAspectRatio) || POSTIT_CAPTURED_ASPECT_RATIO
  }

  return POSTIT_TRIMMED_SIZE.width / POSTIT_TRIMMED_SIZE.height
}

function getTraceId(post) {
  return post.traceId ?? post.id
}

function cropImageStyle(crop, sourceWidth = 1536, sourceHeight = 1024) {
  return {
    height: `${(sourceHeight / crop.height) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
    width: `${(sourceWidth / crop.width) * 100}%`,
  }
}

function getCardHeight(post) {
  const cardW = post._cardW ?? TRACE_CARD_W
  return isPolaroidTrace(post)
    ? cardW * (POLAROID_TRIMMED_SIZE.height / POLAROID_TRIMMED_SIZE.width)
    : cardW / getPostitAspectRatio(post)
}

function hasOverlap(rect, placedRects) {
  const padding = 18

  return placedRects.some((placed) => {
    return !(
      rect.x + rect.width + padding < placed.x ||
      placed.x + placed.width + padding < rect.x ||
      rect.y + rect.height + padding < placed.y ||
      placed.y + placed.height + padding < rect.y
    )
  })
}

function getTraceLayoutPosition(post, index) {
  const traceSeed = hashSeed(getTraceId(post) ?? index)
  const col = index % GRID_COLUMNS
  const row = Math.floor(index / GRID_COLUMNS)
  const baseX = GRID_PADDING_X + col * (TRACE_CARD_W + GRID_GAP_X)
  const baseY = GRID_PADDING_Y + row * (TRACE_CARD_W * 1.5 + GRID_GAP_Y)
  const offsetX = (seeded(traceSeed * 2.17) - 0.5) * 26
  const offsetY = (seeded(traceSeed * 3.41) - 0.5) * 34
  const rotation = (seeded(traceSeed * 4.73) - 0.5) * 6

  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
    rotation,
  }
}

function layoutPosts(posts) {
  const placedRects = []

  return posts.map((post, index) => {
    const base = getTraceLayoutPosition(post, index)
    const cardW = TRACE_CARD_W
    const cardH = isPolaroidTrace(post)
      ? cardW * (POLAROID_TRIMMED_SIZE.height / POLAROID_TRIMMED_SIZE.width)
      : cardW / getPostitAspectRatio(post)
    let x = base.x
    let y = base.y
    let attempts = 0

    while (hasOverlap({ x, y, width: cardW, height: cardH }, placedRects) && attempts < 16) {
      y += 26
      attempts += 1

      if (attempts % 4 === 0) {
        x += attempts % 8 === 0 ? -18 : 18
      }
    }

    placedRects.push({ x, y, width: cardW, height: cardH })

    return {
      ...post,
      _x: x,
      _y: y,
      _rotate: isPolaroidTrace(post) ? base.rotation : 0,
      _cardW: cardW,
    }
  })
}

function PostItTraceCard({ post, isHighlighted }) {
  const cardW = post._cardW ?? TRACE_CARD_W
  const hasSavedImage = Boolean(post.capturedImage || post.imageUrl)
  const postitImage = post.capturedImage ?? post.imageUrl ?? postitTexture
  const shouldRenderText = !hasSavedImage

  return (
    <article
      className="absolute flex flex-col overflow-hidden text-[#35241A]"
      style={{
        filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'none',
        height: cardW / getPostitAspectRatio(post),
        left: post._x,
        pointerEvents: 'auto',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${isHighlighted ? 1.08 : 1})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
      }}
    >
      <img
        src={postitImage}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
      />
      <div className="relative z-10 flex h-full flex-col px-[15px] pb-[12px] pt-[21px]">
        {shouldRenderText ? (
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
        ) : (
          <div className="min-h-0 flex-1" />
        )}
      </div>
    </article>
  )
}

function PolaroidTraceCard({ post, isHighlighted }) {
  const cardW = post._cardW ?? TRACE_CARD_W
  const cardH = cardW * (POLAROID_TRIMMED_SIZE.height / POLAROID_TRIMMED_SIZE.width)
  const savedPolaroidImage = post.capturedImage ?? null
  const fallbackPhotoImage = post.media?.image ?? post.imageUrl
  const shouldRenderFrameLayers = !savedPolaroidImage

  return (
    <article
      className="absolute overflow-hidden text-[#35241A]"
      style={{
        filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'none',
        height: cardH,
        left: post._x,
        pointerEvents: 'auto',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${isHighlighted ? 1.08 : 1})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
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

      {shouldRenderFrameLayers && fallbackPhotoImage ? (
        <div className="absolute left-[6.4%] top-[6.1%] h-[74.4%] w-[87%] overflow-hidden">
          <img src={fallbackPhotoImage} alt="" className="h-full w-full object-cover" draggable="false" />
        </div>
      ) : null}

      {shouldRenderFrameLayers ? (
        <img
          src={polaroidFrame}
          alt=""
          className="pointer-events-none absolute object-fill"
          style={cropImageStyle(POLAROID_SOURCE_CROP)}
          draggable="false"
        />
      ) : null}

      {shouldRenderFrameLayers && post.content ? (
        <p
          className="absolute bottom-[6.5%] left-[10%] right-[10%] overflow-hidden text-center text-[21px] leading-[1.05] text-[#3A2A20]"
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

function useBoardTransform(transformRef, onZoomChange, initialScale) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialScale })
  const stateRef = useRef({ x: 0, y: 0, scale: initialScale })
  const panStart = useRef(null)
  const pinchRef = useRef(null)
  const containerRef = useRef(null)

  const applyZoom = useCallback((nextScale, origin) => {
    const min = 0.3
    const max = 3
    const clampedScale = Math.min(max, Math.max(min, nextScale))
    const { x, y, scale } = stateRef.current
    let nextX = x
    let nextY = y

    if (origin) {
      const ratio = clampedScale / scale
      nextX = origin.x - (origin.x - x) * ratio
      nextY = origin.y - (origin.y - y) * ratio
    }

    stateRef.current = { x: nextX, y: nextY, scale: clampedScale }
    setTransform({ x: nextX, y: nextY, scale: clampedScale })
    onZoomChange?.(Math.round((clampedScale / initialScale) * 100))
  }, [initialScale, onZoomChange])

  useEffect(() => {
    if (!transformRef) return

    transformRef.current = {
      state: {
        scale: stateRef.current.scale,
        positionX: stateRef.current.x,
        positionY: stateRef.current.y,
      },
      zoomIn: (step = 0.25) => applyZoom(stateRef.current.scale + step, null),
      zoomOut: (step = 0.25) => applyZoom(stateRef.current.scale - step, null),
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
    stateRef.current = next
    setTransform({ ...next })
  }, [])

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
      stateRef.current = next
      setTransform({ ...next })
    }
  }, [applyZoom])

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
  showTraceSheet = true,
}) {
  const laid = useMemo(() => layoutPosts(posts), [posts])
  const canvasH = Math.max(1200, ...laid.map((post) => post._y + getCardHeight(post) + 220))
  const [selectedPost, setSelectedPost] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const pointerDownInfo = useRef(null)

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390
  const initialScale = Math.min(0.74, (viewportWidth - 18) / BOARD_CANVAS_W)
  const {
    containerRef,
    onPointerDown,
    onTouchEnd,
    onTouchStart,
    setTransform,
    stateRef,
    transform,
  } = useBoardTransform(transformRef, onZoomChange, initialScale)

  useEffect(() => {
    if (!newPostId) return undefined

    const post = laid.find((item) => getTraceId(item) === newPostId || item.id === newPostId)
    if (!post) return undefined

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return undefined

    const start = { x: stateRef.current.x, y: stateRef.current.y, scale: stateRef.current.scale }
    const targetScale = Math.min(1.05, Math.max(start.scale, 0.78))
    const targetX = rect.width / 2 - (post._x + (post._cardW ?? TRACE_CARD_W) / 2) * targetScale
    const targetY = rect.height / 2 - (post._y + (post._cardW ?? TRACE_CARD_W) / 2) * targetScale
    const startTime = performance.now()
    const duration = 600
    let timeoutId

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      stateRef.current = {
        ...stateRef.current,
        x: start.x + (targetX - start.x) * ease,
        y: start.y + (targetY - start.y) * ease,
        scale: start.scale + (targetScale - start.scale) * ease,
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
      onZoomChange?.(Math.round((targetScale / initialScale) * 100))
      timeoutId = window.setTimeout(() => {
        setHighlightId(null)
        onNewPostFocused?.()
      }, 1500)
    }

    requestAnimationFrame(animate)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [containerRef, initialScale, laid, newPostId, onNewPostFocused, onZoomChange, setTransform, stateRef])

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
      const cardH = isPolaroidTrace(post)
        ? cardW * (POLAROID_TRIMMED_SIZE.height / POLAROID_TRIMMED_SIZE.width)
        : cardW / getPostitAspectRatio(post)
      if (cx >= post._x && cx <= post._x + cardW && cy >= post._y && cy <= post._y + cardH) {
        setSelectedPost(post)
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
      style={{ cursor: 'grab', touchAction: 'none' }}
      onClick={handleContainerClick}
      onPointerDown={handleContainerPointerDown}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      <div
        data-board-canvas
        className="absolute"
        style={{
          height: canvasH,
          pointerEvents: 'none',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: BOARD_CANVAS_W,
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

      {showTraceSheet && selectedPost ? (
        <TraceBottomSheet
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDeleted={(id) => {
            onPostDeleted?.(id)
            setSelectedPost(null)
          }}
        />
      ) : null}
    </div>
  )
}

export default BoardCanvas
