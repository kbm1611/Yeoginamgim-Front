import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import boardCanvasBg from '../../assets/board-bg.png'

export const BOARD_WIDTH = 3000
export const BOARD_HEIGHT = 2200
const INITIAL_SCALE = 0.85
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

const POSTIT_THEMES = {
  yellow: { bg: '#F7E58A', textColor: '#2A1A0A', asset: null },
  pink:   { bg: '#F6ABBE', textColor: '#2A1A0A', asset: null },
  sky:    { bg: '#A8D8F0', textColor: '#1A2A2A', asset: null },
  green:  { bg: '#B8E0A0', textColor: '#1A2A1A', asset: null },
  cream:  { bg: '#FFF0CC', textColor: '#2A1A0A', asset: null },
  purple: { bg: '#D4B8F0', textColor: '#1A1A2A', asset: null },
}

function resolvePostitTheme(post) {
  const paperColor = post.style?.paperColor ?? post.style?.postitColor
  if (!paperColor) return POSTIT_THEMES.yellow
  const byId = POSTIT_THEMES[paperColor]
  if (byId) return byId
  const byHex = Object.values(POSTIT_THEMES).find(
    (t) => t.bg.toLowerCase() === paperColor.toLowerCase()
  )
  return byHex ?? POSTIT_THEMES.yellow
}

// 보드 뷰 폰트 — PostItEditor의 FONTS 배열과 순서 동일하게 유지
const BOARD_FONTS = [
  "'Gaegu', cursive",
  "'Jua', sans-serif",
  "'Poor Story', cursive",
  "'Dokdo', cursive",
]

// 테이프 에셋 교체 포인트 — PNG 준비되면 이 한 줄만 변경
const TAPE_ASSET = null

// 카드 크기 단계 — seed 기반으로 다양화
const CARD_SIZES = [220, 240, 260, 280]

// ─── 컬럼 기반 배치 ───────────────────────────────────────────────────────────
// 보드 3000px 기준 4컬럼. 모바일(390px) viewport 중심이 컬럼2~3 사이에 오도록 설계.
// 컬럼 center x: 500 / 1000 / 1600 / 2200  (좌우 여백 400px 확보)
const COLUMNS = [
  { cx: 500 },
  { cx: 1000 },
  { cx: 1600 },
  { cx: 2200 },
]
const COLUMN_X_OFFSET_RANGE = 40   // 컬럼 중심 기준 ±40px x offset
const CARD_GAP_MIN = 24            // 카드 사이 최소 세로 간격
const CARD_GAP_MAX = 40            // 카드 사이 최대 세로 간격
const COLUMN_START_Y = 200         // 첫 카드 시작 y

// 주어진 흔적 목록으로 각 컬럼의 현재 최하단 y를 계산
function getColumnBottoms(traces) {
  const bottoms = COLUMNS.map(() => COLUMN_START_Y)
  for (const trace of traces) {
    const x = trace._x ?? trace.x ?? trace.style?.boardPosition?.x
    const y = trace._y ?? trace.y ?? trace.style?.boardPosition?.y
    const h = trace._cardH ?? trace.style?.boardPosition?.height ?? TRACE_CARD_W
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    // 가장 가까운 컬럼 찾기
    let closest = 0
    let minDist = Infinity
    COLUMNS.forEach((col, i) => {
      const dist = Math.abs(x - col.cx)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    const bottom = y + h
    if (bottom > bottoms[closest]) bottoms[closest] = bottom
  }
  return bottoms
}

// 컬럼 기반 다음 배치 위치 계산
// seed: 결정적 랜덤 (같은 흔적이면 항상 같은 위치)
function getColumnBasedPosition(seed, cardH, existingTraces) {
  const bottoms = getColumnBottoms(existingTraces)
  // 가장 낮은 컬럼 선택
  const colIndex = bottoms.indexOf(Math.min(...bottoms))
  const col = COLUMNS[colIndex]
  const bottom = bottoms[colIndex]

  // x: 컬럼 중심 ± offset (seed 기반 결정적)
  const xOffset = (seeded(seed * 2.31) - 0.5) * 2 * COLUMN_X_OFFSET_RANGE
  // y: 이전 카드 bottom + gap (seed 기반 결정적)
  const gap = CARD_GAP_MIN + seeded(seed * 5.17) * (CARD_GAP_MAX - CARD_GAP_MIN)

  return {
    x: Math.round(col.cx + xOffset - cardH / 2),   // cardH/2 → 카드 좌상단 기준
    y: Math.round(bottom + gap),
    colIndex,
  }
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

// ─── 테이프 ──────────────────────────────────────────────────────────────────
// TAPE_ASSET이 null인 동안은 아무것도 렌더하지 않음
// PNG 에셋 준비되면: const TAPE_ASSET = tapeBeigePng (상단 상수 교체만으로 활성화)
function BoardTape({ seed }) {
  if (!TAPE_ASSET) return null

  const positions = ['center', 'left', 'right']
  const pos = positions[seed % 3]
  const rotate = (seed % 11) - 5  // -5 ~ +5도

  const leftByPos = { center: '50%', left: '25%', right: '75%' }

  return (
    <img
      src={TAPE_ASSET}
      aria-hidden="true"
      draggable={false}
      style={{
        height: 36,
        left: leftByPos[pos],
        objectFit: 'fill',
        opacity: 0.9,
        pointerEvents: 'none',
        position: 'absolute',
        top: -16,
        transform: `translateX(-50%) rotate(${rotate}deg)`,
        width: 110,
        zIndex: 2,
      }}
    />
  )
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

function getTraceLayoutPosition(post, index, precedingPosts = []) {
  const explicit = getExplicitTracePosition(post)
  if (explicit) return explicit

  const traceSeed = hashSeed(getTraceId(post) ?? index)
  const cardW = CARD_SIZES[traceSeed % CARD_SIZES.length]
  const { x, y } = getColumnBasedPosition(traceSeed, cardW, precedingPosts)

  return { x, y }
}

export function migrateLegacyTracePosition(post, index = 0, precedingPosts = []) {
  const explicit = getExplicitTracePosition(post)
  if (explicit) return post

  const fallback = getTraceLayoutPosition(post, index, precedingPosts)
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
  const laidSoFar = []

  return posts.map((post, index) => {
    const s = hashSeed(getTraceId(post) ?? index)
    const hasExplicitPos = Boolean(getExplicitTracePosition(post))
    const hasExplicitSize = (() => {
      const w = Number(post.width ?? post.style?.boardPosition?.width)
      const h = Number(post.height ?? post.style?.boardPosition?.height)
      return Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0
    })()

    const size = getTraceSize(post)
    const cardW = hasExplicitSize ? size.width : CARD_SIZES[s % CARD_SIZES.length]
    const cardH = hasExplicitSize ? size.height : Math.round(cardW / (isPolaroidTrace(post) ? 3 / 4 : 1))

    let x, y
    if (hasExplicitPos) {
      const pos = getExplicitTracePosition(post)
      x = pos.x
      y = pos.y
    } else {
      const pos = getColumnBasedPosition(s, cardW, laidSoFar)
      x = pos.x
      y = pos.y
    }

    const clamped = clampBoardPosition(x, y, cardW, cardH)
    x = clamped.x
    y = clamped.y

    const rotation = Number(post.rotation ?? post.style?.boardPosition?.rotation)
    const scale = Number(post.scale ?? post.style?.boardPosition?.scale)
    const zIndex = Number(post.zIndex ?? post.style?.boardPosition?.zIndex)

    const laid = {
      ...post,
      _x: x,
      _y: y,
      _rotate: (() => {
        if (Number.isFinite(rotation)) return Math.min(6, Math.max(-6, rotation))
        const dir = s % 2 === 0 ? 1 : -1
        return dir * (1 + seeded(s * 4.73) * 5)  // 1~6도
      })(),
      _cardW: cardW,
      _cardH: cardH,
      _scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
      _zIndex: Number.isFinite(zIndex) ? zIndex : 10 + index,
    }

    laidSoFar.push(laid)
    return laid
  })
}

export function findEmptySpotNear(center, newTraceSize, existingTraces = []) {
  const cardW = newTraceSize?.width ?? TRACE_CARD_W
  const cardH = newTraceSize?.height ?? TRACE_CARD_W
  const targetCenter = {
    x: Number.isFinite(center?.x) ? center.x : BOARD_WIDTH / 2,
    y: Number.isFinite(center?.y) ? center.y : BOARD_HEIGHT / 2,
  }
  const placedRects = []

  for (let index = 0; index < existingTraces.length; index += 1) {
    const trace = existingTraces[index]
    const size = getTraceSize(trace)
    const position = getExplicitTracePosition(trace) ?? getTraceLayoutPosition(trace, index, placedRects)
    if (!position) continue
    placedRects.push({
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    })
  }

  const makeRect = (x, y) => ({ x, y, width: cardW, height: cardH })
  const tryPosition = (x, y) => {
    const clamped = clampBoardPosition(Math.round(x), Math.round(y), cardW, cardH)
    const rect = makeRect(clamped.x, clamped.y)
    return hasOverlap(rect, placedRects) ? null : clamped
  }
  const initial = tryPosition(targetCenter.x - cardW / 2, targetCenter.y - cardH / 2)
  if (initial) return initial

  for (let radius = 90; radius <= 900; radius += 90) {
    const steps = Math.max(8, Math.round((Math.PI * 2 * radius) / 120))
    for (let step = 0; step < steps; step += 1) {
      const angle = (Math.PI * 2 * step) / steps
      const position = tryPosition(
        targetCenter.x + Math.cos(angle) * radius - cardW / 2,
        targetCenter.y + Math.sin(angle) * radius - cardH / 2,
      )
      if (position) return position
    }
  }

  const seed = Date.now() % 100000
  const fallback = getColumnBasedPosition(seed, cardW, existingTraces)
  return clampBoardPosition(fallback.x, fallback.y, cardW, cardH)
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
  const tapeSeed = hashSeed(getTraceId(post) ?? 0)
  const showTape = tapeSeed % 10 < 7  // 70% 확률로 테이프 표시

  return (
    // wrapper: left/top/transform/zIndex 담당 — overflow: visible로 테이프가 카드 밖으로 나올 수 있게
    <div
      style={{
        height: cardH,
        left: post._x,
        overflow: 'visible',
        pointerEvents: 'none',
        position: 'absolute',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${(post._scale ?? 1) * (isHighlighted ? 1.08 : 1)})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
        zIndex: post._zIndex,
      }}
    >
      {showTape && <BoardTape seed={tapeSeed} />}
      <article
        className={`flex flex-col text-[#35241A] ${isHighlighted ? 'trace-card-highlight' : ''}`}
        style={{
          borderRadius: hasSavedImage ? 0 : 4,
          boxShadow: isHighlighted
            ? '0 0 0 0 transparent'
            : (resolvePostitTheme(post).asset ? 'none' : '0 1px 2px rgba(0,0,0,0.14), 5px 14px 26px rgba(58,36,20,0.26)'),
          filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'drop-shadow(0 0 0 rgba(0,0,0,0))',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'auto',
          position: 'relative',
          width: '100%',
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
          <div className="relative h-full w-full" style={{ backgroundColor: resolvePostitTheme(post).asset ? 'transparent' : resolvePostitTheme(post).bg }}>
            {resolvePostitTheme(post).asset && (
              <img
                src={resolvePostitTheme(post).asset}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ objectFit: 'fill' }}
              />
            )}
            <div className="relative z-10 flex h-full flex-col" style={{ padding: '14% 12% 18% 12%' }}>
              {shouldRenderText && (
                <p
                  className="min-h-0 flex-1 overflow-hidden text-[23px] leading-[1.12]"
                  style={{
                    color: resolvePostitTheme(post).textColor,
                    display: '-webkit-box',
                    fontFamily: (post.style?.textObjects?.[0]?.fontFamily ?? "'Gaegu', cursive").replace('YiSeoYun', 'Gaegu'),
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 4,
                    overflow: 'hidden',
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
    </div>
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
  const tapeSeed = hashSeed(getTraceId(post) ?? 0)
  const showTape = tapeSeed % 10 < 7  // 70% 확률로 테이프 표시

  return (
    // wrapper: left/top/transform/zIndex 담당 — overflow: visible로 테이프가 카드 밖으로 나올 수 있게
    <div
      style={{
        height: cardH,
        left: post._x,
        pointerEvents: 'none',
        position: 'absolute',
        top: post._y,
        transform: `rotate(${post._rotate}deg) scale(${(post._scale ?? 1) * (isHighlighted ? 1.08 : 1)})`,
        transformOrigin: 'top left',
        transition: isHighlighted ? 'transform 0.3s' : 'none',
        width: cardW,
        zIndex: post._zIndex,
      }}
    >
      {showTape && <BoardTape seed={tapeSeed} />}
      <article
        className={`text-[#35241A] ${isHighlighted ? 'trace-card-highlight' : ''}`}
        style={{
          filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,200,50,0.8))' : 'drop-shadow(0 0 0 rgba(0,0,0,0))',
          height: '100%',
          pointerEvents: 'auto',
          position: 'relative',
          width: '100%',
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
              boxShadow: '0 1px 2px rgba(0,0,0,0.14), 6px 18px 30px rgba(58,36,20,0.28)',
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
                  fontFamily: BOARD_FONTS[Math.min(post.style?.polaroidFontIndex ?? 0, BOARD_FONTS.length - 1)],
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                }}
              >
                {post.content}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
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
  const all = posts ?? []

  // 컬럼 배치 구조에 맞게: col0(cx:500)과 col1(cx:1000)에 속한 카드들만 샘플
  // x < 1300 인 카드들 = 모바일 390px viewport에서 scale 0.85로 한 화면에 담기는 범위
  const sample = all.filter(p => p._x < 1300).slice(0, 6)
  const fallback = all.slice(0, 2)
  const cards = sample.length > 0 ? sample : fallback

  const target = cards.length > 0
    ? {
        x: (Math.min(...cards.map(p => p._x)) + Math.max(...cards.map(p => p._x + (p._cardW ?? TRACE_CARD_W)))) / 2,
        y: (Math.min(...cards.map(p => p._y)) + Math.max(...cards.map(p => p._y + (p._cardH ?? TRACE_CARD_W)))) / 2,
      }
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


    </div>
  )
}

export default BoardCanvas
