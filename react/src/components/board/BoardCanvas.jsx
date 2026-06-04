import { useMemo, useState } from 'react'
import { Flag, Heart } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import postitYellow from '../../assets/postit/postit.png'
import polaroidBg from '../../assets/poloaroid/폴라로이드.png'

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

function Tape({ color, rotate }) {
  return (
    <div
      className="absolute left-1/2 top-0 z-10 h-[22px] w-[68px] rounded-[3px]"
      style={{
        backgroundColor: color,
        transform: `translateX(-50%) translateY(-11px) rotate(${rotate}deg)`,
      }}
    />
  )
}

function getActionErrorMessage(error) {
  if (error?.status === 401) return '로그인이 필요합니다.'
  if (error?.status === 409) return '이미 신고한 흔적입니다.'

  return error?.message ?? '처리하지 못했습니다.'
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

function PolaroidCard({ post, onToggleLike, onReport }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = post.media?.image
  const captionLength = post.content?.length ?? 0
  const savedFontSize = Number(post.style?.fontSize)
  const captionFontSize = Number.isFinite(savedFontSize) && savedFontSize > 0 ? savedFontSize : captionLength > 40 ? 24 : 30
  const captionFontFamily = post.style?.fontFamily ?? "'Nanum Pen Script', 'Gaegu', cursive"

  return (
    <article
      className="absolute"
      style={{
        left: post._x,
        top: post._y,
        width: 320,
        transform: `rotate(${post._rotate}deg)`,
        borderRadius: 10,
        boxShadow: '0 6px 22px rgba(42,28,20,0.20), 0 2px 6px rgba(42,28,20,0.10)',
        backgroundImage: `url(${polaroidBg})`,
        backgroundSize: '100% 100%',
        backgroundColor: 'transparent',
      }}
    >
      <Tape color={post._tapeColor} rotate={post._tapeRotate} />
      <div className="p-[10px] pb-0">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            className="h-[250px] w-full rounded-[6px] object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-[250px] w-full items-center justify-center rounded-[6px] bg-[#EEE7DC] text-[15px] font-semibold text-[#8A6A58]">
            이미지 없음
          </div>
        )}
      </div>
      <div className="px-3 pb-4 pt-2 text-center">
        <p
          className="break-words leading-[1.25]"
          style={{
            color: post.style?.color ?? '#1E1712',
            fontFamily: captionFontFamily,
            fontSize: captionFontSize,
          }}
        >
          {post.content}
        </p>
        <p
          className="mt-1 text-[17px] text-[#7A6357]"
          style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
        >
          {post.media?.dateLabel}
        </p>
      </div>
      <TraceActions post={post} onToggleLike={onToggleLike} onReport={onReport} />
    </article>
  )
}

// POST_IT 전용 컴포넌트 — 노란 포스트잇 PNG만 렌더링
function BoardPostIt({ post, onToggleLike, onReport }) {
  const contentLength = post.content?.length ?? 0
  const savedFontSize = Number(post.style?.fontSize)
  const fontSize = Number.isFinite(savedFontSize) && savedFontSize > 0
    ? savedFontSize
    : contentLength > 60 ? 24 : contentLength > 35 ? 29 : 34
  const fontFamily = post.style?.fontFamily ?? "'Nanum Pen Script', 'Gaegu', cursive"
  const cardW = post._cardW ?? CARD_W_CONST

  return (
    <div
      style={{
        position: 'absolute',
        left: post._x,
        top: post._y,
        width: cardW,
        height: cardW,
        transform: `rotate(${post._rotate}deg)`,
        backgroundImage: `url(${postitYellow})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 6px 20px rgba(42,28,20,0.18), 0 2px 6px rgba(42,28,20,0.10)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <p
          style={{
            color: post.style?.textColor ?? '#2A1E14',
            fontFamily,
            fontSize,
            margin: 0,
            lineHeight: 1.3,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'center',
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          {post.content}
        </p>
      </div>

      <TraceActions post={post} onToggleLike={onToggleLike} onReport={onReport} />
    </div>
  )
}

// 호환성 유지 (기존 PostItCard 이름 사용)
const PostItCard = BoardPostIt

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

function BoardCanvas({ posts, onAdd, transformRef, onZoomChange, onToggleLike, onReport }) {
  const laid = useMemo(() => layoutPosts(posts), [posts])
  const rows = Math.ceil(posts.length / 2)
  const canvasH = Math.max(1200, rows * ROW_H + 400)

  if (posts.length === 0) {
    return <EmptyBoard onAdd={onAdd} />
  }

  // 화면 너비 기준 scale 계산: 캔버스 480px이 화면에 딱 맞게
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const scale = Math.min(0.9, (vw - 16) / CANVAS_W)  // 좌우 8px 여백
  const posX = 0
  const posY = 0  // 첫 번째 포스트잇부터 바로 보이게

  return (
    <TransformWrapper
      ref={transformRef}
      minScale={Math.min(scale, 0.5)}
      maxScale={2.0}
      initialScale={scale}
      initialPositionX={posX}
      initialPositionY={posY}
      limitToBounds
      wheel={{ step: 0.06, smoothStep: 0.003 }}
      pinch={{ step: 5 }}
      panning={{ velocityDisabled: false }}
      doubleClick={{ disabled: true }}
      onTransformed={(_, state) => {
        onZoomChange?.(Math.round(state.scale * (100 / scale)))
      }}
    >
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <div className="relative" style={{ width: CANVAS_W, height: canvasH }}>
          {laid.map((post) =>
            post.type === 'polaroid' ? (
              <PolaroidCard key={post.id} post={post} onToggleLike={onToggleLike} onReport={onReport} />
            ) : (
              <PostItCard key={post.id} post={post} onToggleLike={onToggleLike} onReport={onReport} />
            ),
          )}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default BoardCanvas
