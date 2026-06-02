import { useMemo } from 'react'
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

function PolaroidCard({ post }) {
  return (
    <article
      className="absolute bg-white"
      style={{
        left: post._x,
        top: post._y,
        width: 320,
        transform: `rotate(${post._rotate}deg)`,
        borderRadius: 10,
        boxShadow: '0 6px 22px rgba(42,28,20,0.20), 0 2px 6px rgba(42,28,20,0.10)',
      }}
    >
      <Tape color={post._tapeColor} rotate={post._tapeRotate} />
      <div className="p-[10px] pb-0">
        <img
          src={post.media?.image}
          alt=""
          loading="lazy"
          className="h-[250px] w-full rounded-[6px] object-cover"
        />
      </div>
      <div className="px-3 pb-4 pt-2 text-center">
        <p
          className="text-[30px] leading-[1.25] text-[#1E1712]"
          style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
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
    </article>
  )
}

function PostItCard({ post }) {
  const paperColor = post.style?.paperColor ?? 'yellow'
  const texture = POSTIT_TEXTURE[paperColor]
  const bgColor = POSTIT_COLOR[paperColor] ?? '#F3D98E'

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
      <div className="flex h-full items-center justify-center p-6">
        <p
          className="whitespace-pre-line text-center text-[34px] leading-[1.3] text-[#2A211A]"
          style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
        >
          {post.content}
        </p>
      </div>
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

function BoardCanvas({ posts, onAdd }) {
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
              <PolaroidCard key={post.id} post={post} />
            ) : (
              <PostItCard key={post.id} post={post} />
            ),
          )}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default BoardCanvas
