import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flag, Heart } from 'lucide-react'
import { getApiErrorMessage } from '../../api/errors'

import { CANVAS_W, COL_X, ROW_H, COL_STAGGER, CARD_W as CARD_W_CONST } from './PlacementGrid'

const TAPE_COLORS = [
  'rgba(243,217,142,0.80)',
  'rgba(212,200,240,0.80)',
  'rgba(238,183,198,0.80)',
  'rgba(210,212,162,0.80)',
]

const REPORT_REASONS = [
  { value: 'ABUSE', label: '욕설/비방' },
  { value: 'INAPPROPRIATE_IMAGE', label: '부적절한 사진' },
  { value: 'SPAM', label: '광고/도배' },
  { value: 'PRIVACY', label: '개인정보 노출' },
  { value: 'ETC', label: '기타' },
]

function seeded(n) {
  const x = Math.sin(n + 1.5) * 10000
  return x - Math.floor(x)
}

function layoutPosts(posts) {
  return posts.map((post, i) => {
    // cell 정보가 있으면 사용, 없으면 순서 기반 fallback
    const col = post.cell?.col ?? (i % 2)
    const row = post.cell?.row ?? Math.floor(i / 2)
    const s = i + 1

    const dx = (seeded(s * 1.31 + 2.71) - 0.5) * 24
    const dy = (seeded(s * 2.13 + 5.37) - 0.5) * 24
    const rotate = (seeded(s * 3.71 + 8.13) - 0.5) * 7
    const tapeRotate = (seeded(s * 4.23 + 1.09) - 0.5) * 5
    const tapeColor = TAPE_COLORS[i % TAPE_COLORS.length]
    const stagger = col === 1 ? COL_STAGGER : 0

    return {
      ...post,
      _x: COL_X[col] - CARD_W_CONST / 2 + dx,
      _y: row * ROW_H + stagger + 60 + dy,
      _rotate: rotate,
      _tapeRotate: tapeRotate,
      _tapeColor: tapeColor,
      _cardW: CARD_W_CONST,
    }
  })
}

function getActionErrorMessage(error) {
  return getApiErrorMessage(error, {
    fallback: '처리하지 못했습니다.',
    statusMessages: {
      401: '로그인이 필요합니다.',
      403: '이 작업을 수행할 권한이 없습니다.',
      404: '흔적을 찾을 수 없습니다.',
      409: '이미 신고했거나 상태가 변경된 흔적입니다.',
      500: '처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    },
  })
}

function TraceActions({ post, onToggleLike, onReport }) {
  const [isLikePending, setIsLikePending] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportKind, setReportKind] = useState(REPORT_REASONS[0].value)
  const [isReportPending, setIsReportPending] = useState(false)
  const [message, setMessage] = useState('')

  const stopBoardGesture = (event) => {
    event.stopPropagation()
  }

  const handleLikeClick = async (event) => {
    event.stopPropagation()
    if (!onToggleLike || isLikePending) return

    setIsLikePending(true)
    setMessage('')

    try {
      await onToggleLike(post)
    } catch (error) {
      setMessage(getActionErrorMessage(error))
    } finally {
      setIsLikePending(false)
    }
  }

  const handleReportSubmit = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!onReport || isReportPending) return

    setIsReportPending(true)
    setMessage('')

    try {
      await onReport(post, reportKind)
      setMessage('신고가 접수되었습니다.')
      setIsReportOpen(false)
    } catch (error) {
      setMessage(getActionErrorMessage(error))
    } finally {
      setIsReportPending(false)
    }
  }

  return (
    <div
      className="absolute -bottom-10 right-0 z-30"
      onPointerDown={stopBoardGesture}
      onMouseDown={stopBoardGesture}
      onTouchStart={stopBoardGesture}
      onClick={stopBoardGesture}
    >
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isLikePending}
          aria-label={post.liked ? '추천 취소' : '추천'}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-2.5 text-[12px] font-bold text-[#3D2B1F] shadow-md backdrop-blur-sm disabled:opacity-60"
        >
          <Heart
            size={15}
            fill={post.liked ? '#E84855' : 'none'}
            className={post.liked ? 'text-[#E84855]' : 'text-[#6B5344]'}
            strokeWidth={2}
          />
          <span>{post.likes ?? 0}</span>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setIsReportOpen((open) => !open)
            setMessage('')
          }}
          aria-label="신고하기"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6B5344] shadow-md backdrop-blur-sm"
        >
          <Flag size={15} strokeWidth={2} />
        </button>

        {isReportOpen ? (
          <form
            onSubmit={handleReportSubmit}
            className="absolute bottom-10 right-0 w-[190px] rounded-[8px] bg-white p-3 text-[#3D2B1F] shadow-[0_10px_28px_rgba(42,28,20,0.20)]"
          >
            <label className="block text-[12px] font-bold" htmlFor={`report-${post.id}`}>
              신고 사유
            </label>
            <select
              id={`report-${post.id}`}
              value={reportKind}
              onChange={(event) => setReportKind(event.target.value)}
              className="mt-2 h-9 w-full rounded-[6px] border border-[#D8CEC2] bg-[#F8F4EE] px-2 text-[12px] outline-none"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isReportPending}
              className="mt-2 h-9 w-full rounded-[6px] bg-[#3D2B1F] text-[12px] font-bold text-white disabled:opacity-60"
            >
              {isReportPending ? '접수 중' : '신고하기'}
            </button>
          </form>
        ) : null}
      </div>

      {message ? (
        <p className="mt-1 max-w-[190px] rounded-full bg-white/90 px-2 py-1 text-right text-[11px] font-semibold text-[#7A4D3B] shadow-sm">
          {message}
        </p>
      ) : null}
    </div>
  )
}

// 모든 카드 — capturedImage를 그대로 표시
function TraceCard({ post }) {
  const cardW = post._cardW ?? CARD_W_CONST
  const isPolaroid = post.type === 'polaroid'
  const w = cardW
  const h = isPolaroid ? cardW * 1.5 : cardW

  if (!post.capturedImage) return null

  return (
    <img
      src={post.capturedImage}
      alt=""
      style={{
        position: 'absolute',
        left: post._x,
        top: post._y,
        width: w,
        height: h,
        objectFit: 'fill',
        transform: `rotate(${post._rotate}deg)`,
        boxShadow: '0 6px 20px rgba(42,28,20,0.15)',
        transformOrigin: 'top left',
      }}
    />
  )
}

const PostItCard = TraceCard
const PolaroidCard = TraceCard
const CapturedCard = TraceCard

function EmptyBoard({ onAdd }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
      <p
        className="text-center text-[38px] leading-[1.4] text-[#5C4030]"
        style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
      >
        아직 아무도{'\n'}흔적을 남기지{'\n'}않았어요
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full bg-[#3D2B1F] px-7 py-3 text-[17px] font-semibold text-white shadow-lg"
      >
        첫 흔적을 남겨보세요 ✍️
      </button>
    </div>
  )
}

// 피그마 스타일 줌/패닝 훅
function useBoardTransform(transformRef, onZoomChange, initialScale) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialScale })
  const stateRef = useRef({ x: 0, y: 0, scale: initialScale })
  const panStart = useRef(null)
  const pinchRef = useRef(null)
  const containerRef = useRef(null)

  // transformRef에 현재 상태 노출 (PlacementOverlay가 읽음)
  const applyZoom = useCallback((nextScale, origin) => {
    const MIN = 0.3, MAX = 3.0
    nextScale = Math.min(MAX, Math.max(MIN, nextScale))
    const { x, y, scale } = stateRef.current

    let nextX = x, nextY = y
    if (origin) {
      // origin(화면 좌표) 기준으로 줌
      const ratio = nextScale / scale
      nextX = origin.x - (origin.x - x) * ratio
      nextY = origin.y - (origin.y - y) * ratio
    }

    stateRef.current = { x: nextX, y: nextY, scale: nextScale }
    setTransform({ x: nextX, y: nextY, scale: nextScale })
    onZoomChange?.(Math.round(nextScale / initialScale * 100))
  }, [initialScale, onZoomChange])

  useEffect(() => {
    if (transformRef) {
      transformRef.current = {
        state: { scale: stateRef.current.scale, positionX: stateRef.current.x, positionY: stateRef.current.y },
        zoomIn: (step = 0.25) => applyZoom(stateRef.current.scale + step, null),
        zoomOut: (step = 0.25) => applyZoom(stateRef.current.scale - step, null),
      }
    }
  }, [applyZoom, transformRef])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const origin = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const delta = -e.deltaY * 0.001
    applyZoom(stateRef.current.scale * (1 + delta), origin)
  }, [applyZoom])

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    panStart.current = { px: e.clientX, py: e.clientY, x: stateRef.current.x, y: stateRef.current.y }
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!panStart.current) return
    const dx = e.clientX - panStart.current.px
    const dy = e.clientY - panStart.current.py
    const next = { ...stateRef.current, x: panStart.current.x + dx, y: panStart.current.y + dy }
    stateRef.current = next
    setTransform({ ...next })
  }, [])

  const onPointerUp = useCallback(() => {
    panStart.current = null
  }, [])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      panStart.current = null
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale: stateRef.current.scale,
        mx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        my: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    } else if (e.touches.length === 1) {
      pinchRef.current = null
      panStart.current = { px: e.touches[0].clientX, py: e.touches[0].clientY, x: stateRef.current.x, y: stateRef.current.y }
    }
  }, [])

  const onTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const nextScale = pinchRef.current.scale * (dist / pinchRef.current.dist)
      const rect = containerRef.current?.getBoundingClientRect()
      const origin = rect ? {
        x: pinchRef.current.mx - rect.left,
        y: pinchRef.current.my - rect.top,
      } : null
      applyZoom(nextScale, origin)
    } else if (e.touches.length === 1 && panStart.current) {
      const dx = e.touches[0].clientX - panStart.current.px
      const dy = e.touches[0].clientY - panStart.current.py
      const next = { ...stateRef.current, x: panStart.current.x + dx, y: panStart.current.y + dy }
      stateRef.current = next
      setTransform({ ...next })
    }
  }, [applyZoom])

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
    panStart.current = null
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })

    // window에서 pointermove/up 처리 → 카드 위에서 드래그해도 패닝 동작
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onWheel, onTouchMove, onPointerMove, onPointerUp])

  return { transform, containerRef, onPointerDown, onPointerMove, onPointerUp, onTouchStart, onTouchEnd }
}

function BoardCanvas({ posts, onAdd, transformRef, onZoomChange, onToggleLike, onReport }) {
  const navigate = useNavigate()
  const { id: boardId } = useParams()
  const laid = useMemo(() => layoutPosts(posts), [posts])
  const rows = Math.ceil(posts.length / 2)
  const canvasH = Math.max(1200, rows * ROW_H + 400)

  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const initialScale = Math.min(0.9, (vw - 16) / CANVAS_W)

  const { transform, containerRef, onPointerDown, onTouchStart, onTouchEnd } =
    useBoardTransform(transformRef, onZoomChange, initialScale)

  const pointerDownPos = useRef(null)
  const handleCardPointerDown = useCallback((e) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    onPointerDown(e) // 카드 클릭해도 패닝 시작
  }, [onPointerDown])

  const handleCardClick = useCallback((post, e) => {
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x)
      const dy = Math.abs(e.clientY - pointerDownPos.current.y)
      if (dx > 6 || dy > 6) return // 드래그였으면 무시
    }
    navigate(`/board/${boardId}/trace/${post.id}`, { state: { post } })
  }, [navigate, boardId])

  if (posts.length === 0) {
    return <EmptyBoard onAdd={onAdd} />
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          width: CANVAS_W,
          height: canvasH,
          willChange: 'transform',
        }}
      >
        {laid.map((post) => (
          <div
            key={post.id}
            onPointerDown={handleCardPointerDown}
            onClick={(e) => handleCardClick(post, e)}
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'auto', display: 'contents', cursor: 'grab' }}>
              {post.capturedImage ? (
                <CapturedCard post={post} />
              ) : post.type === 'polaroid' ? (
                <PolaroidCard post={post} onToggleLike={onToggleLike} onReport={onReport} />
              ) : (
                <PostItCard post={post} onToggleLike={onToggleLike} onReport={onReport} />
              )}
              <div
                style={{
                  position: 'absolute',
                  left: post._x + post._cardW - 12,
                  top: post._y + (post.type === 'polaroid' ? post._cardW * 1.5 : post._cardW) - 8,
                  pointerEvents: 'auto',
                }}
              >
                <TraceActions post={post} onToggleLike={onToggleLike} onReport={onReport} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BoardCanvas
