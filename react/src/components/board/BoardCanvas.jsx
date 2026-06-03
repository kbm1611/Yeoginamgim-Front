import { useMemo, useState } from 'react'
import { Flag, Heart } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import postitYellow from '../../assets/images/postits/yellow.png'
import postitPink from '../../assets/images/postits/pink-torn.png'
import postitGreen from '../../assets/images/postits/green.png'
import postitCream from '../../assets/images/postits/grid-cream.png'

const CANVAS_W = 800

// 컬럼 중심 x 좌표
const COL_X = [210, 600]

// 포스트잇 텍스처 (paperColor 키 → 이미지)
const POSTIT_TEXTURE = {
  yellow: postitYellow,
  pink: postitPink,
  green: postitGreen,
  cream: postitCream,
}

// 포스트잇 색상 (텍스처 없는 경우 fallback)
const POSTIT_COLOR = {
  white: '#F8F6F0',
  yellow: '#F3D98E',
  pink: '#EEB7C6',
  green: '#D2D4A2',
  peach: '#E6B2A6',
  cream: '#F0EAD6',
  lavender: '#D4C8F0',
}

// 테이프 색상 순환
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

// 시드 기반 난수 (0~1)
function seeded(n) {
  const x = Math.sin(n + 1.5) * 10000
  return x - Math.floor(x)
}

// 포스트 배치 좌표 계산
function layoutPosts(posts) {
  return posts.map((post, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const s = i + 1

    const dx = (seeded(s * 1.31 + 2.71) - 0.5) * 44
    const dy = (seeded(s * 2.13 + 5.37) - 0.5) * 44
    const rotate = (seeded(s * 3.71 + 8.13) - 0.5) * 10
    const tapeRotate = (seeded(s * 4.23 + 1.09) - 0.5) * 6
    const tapeColor = TAPE_COLORS[i % TAPE_COLORS.length]

    const cardW = post.type === 'polaroid' ? 320 : 270
    const colStagger = col === 1 ? 130 : 0

    return {
      ...post,
      _x: COL_X[col] - cardW / 2 + dx,
      _y: row * 400 + colStagger + 100 + dy,
      _rotate: rotate,
      _tapeRotate: tapeRotate,
      _tapeColor: tapeColor,
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
      className="absolute bg-white"
      style={{
        left: post._x,
        top: post._y,
        width: 320,
        transform: `rotate(${post._rotate}deg)`,
        borderRadius: 10,
        backgroundColor: post.style?.backgroundColor ?? '#FFFFFF',
        boxShadow: '0 6px 22px rgba(42,28,20,0.20), 0 2px 6px rgba(42,28,20,0.10)',
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

function PostItCard({ post, onToggleLike, onReport }) {
  const paperColor = post.style?.paperColor ?? 'yellow'
  const texture = POSTIT_TEXTURE[paperColor]
  const bgColor = POSTIT_COLOR[paperColor] ?? '#F3D98E'
  const contentLength = post.content?.length ?? 0
  const savedFontSize = Number(post.style?.fontSize)
  const fontSize = Number.isFinite(savedFontSize) && savedFontSize > 0 ? savedFontSize : contentLength > 60 ? 24 : contentLength > 35 ? 29 : 34
  const fontFamily = post.style?.fontFamily ?? "'Nanum Pen Script', 'Gaegu', cursive"

  return (
    <article
      className="absolute"
      style={{
        left: post._x,
        top: post._y,
        width: 270,
        height: 270,
        transform: `rotate(${post._rotate}deg)`,
        borderRadius: 4,
        backgroundColor: bgColor,
        backgroundImage: texture ? `url(${texture})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 6px 20px rgba(42,28,20,0.18), 0 2px 6px rgba(42,28,20,0.10)',
      }}
    >
      <Tape color={post._tapeColor} rotate={post._tapeRotate} />
      <div className="flex h-full items-center justify-center overflow-hidden p-6">
        <p
          className="max-h-full whitespace-pre-line break-words text-center leading-[1.3]"
          style={{
            color: post.style?.textColor ?? '#2A211A',
            fontFamily,
            fontSize,
          }}
        >
          {post.content}
        </p>
      </div>
      <TraceActions post={post} onToggleLike={onToggleLike} onReport={onReport} />
    </article>
  )
}

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

function BoardCanvas({ posts, onAdd, onToggleLike, onReport }) {
  const laid = useMemo(() => layoutPosts(posts), [posts])

  const rows = Math.ceil(posts.length / 2)
  const canvasH = Math.max(1800, rows * 400 + 800)

  if (posts.length === 0) {
    return <EmptyBoard onAdd={onAdd} />
  }

  // 800px 캔버스가 390px 기기에 꽉 차는 scale = 390/800 ≈ 0.49
  // 캔버스 높이 canvasH * 0.49 가 860px(기기높이)보다 크면 세로도 채워짐
  const SCALE = 0.49
  const posX = 0
  const posY = -Math.max(0, (canvasH * SCALE - 860) / 2)

  return (
    <TransformWrapper
      minScale={SCALE}
      maxScale={2.0}
      initialScale={SCALE}
      initialPositionX={posX}
      initialPositionY={posY}
      limitToBounds
      wheel={{ step: 0.06, smoothStep: 0.003 }}
      pinch={{ step: 5 }}
      panning={{ velocityDisabled: false }}
      doubleClick={{ disabled: true }}
    >
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <div
          className="relative"
          style={{ width: CANVAS_W, height: canvasH }}
        >
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
