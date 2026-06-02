import { useMemo } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 4000

function seededRand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function matrixToPixel(post, columns = 2, rowHeight = 560, colWidth = 760, offsetX = 360, offsetY = 260) {
  const row = Number(post.row ?? 0)
  const col = Number(post.col ?? 0)

  const baseX = offsetX + col * colWidth
  const baseY = offsetY + row * rowHeight

  const sx = seededRand(post.id * 1.13 + 7.3)
  const sy = seededRand(post.id * 1.77 + 3.1)
  const sr = seededRand(post.id * 2.17 + 9.7)

  const jitterX = (sx * 30) - 15
  const jitterY = (sy * 30) - 15
  const rotate = (sr * 4) - 2

  const x = clamp(baseX + jitterX, 40, CANVAS_WIDTH - 420)
  const y = clamp(baseY + jitterY, 40, CANVAS_HEIGHT - 460)

  return { x, y, rotate, columns }
}

function PolaroidCard({ post, x, y, rotate }) {
  return (
    <article
      className="absolute w-[340px] rounded-[10px] bg-white p-3 shadow-[0_10px_28px_rgba(42,28,20,0.22)]"
      style={{ left: x, top: y, transform: `rotate(${rotate}deg)` }}
    >
      <img src={post.image} alt="" className="h-[290px] w-full rounded-[4px] object-cover" />
      <p className="pt-3 text-center text-[46px] leading-[1.1] text-[#1E1712]" style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}>
        {post.text}
      </p>
      <p className="pb-1 pt-2 text-center text-[26px] text-[#4A3B30]">- {post.date} -</p>
    </article>
  )
}

function PostItCard({ post, x, y, rotate }) {
  return (
    <article
      className="absolute w-[320px] rounded-[8px] p-5 shadow-[0_10px_24px_rgba(42,28,20,0.2)]"
      style={{ left: x, top: y, transform: `rotate(${rotate}deg)`, backgroundColor: post.color || '#F6E07F' }}
    >
      <p className="whitespace-pre-line text-[50px] leading-[1.1] text-[#2A211A]" style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}>
        {post.text}
      </p>
      <p className="mt-2 text-[24px] text-[#4A3B30]">{post.date}</p>
    </article>
  )
}

function BoardCanvas({ posts, backgroundImage }) {
  const positionedPosts = useMemo(() => posts.map((post) => ({ ...post, ...matrixToPixel(post) })), [posts])

  return (
    <TransformWrapper
      minScale={0.5}
      maxScale={2}
      initialScale={0.58}
      initialPositionX={-190}
      initialPositionY={-120}
      limitToBounds
      wheel={{ step: 0.08, smoothStep: 0.004 }}
      pinch={{ step: 6 }}
      panning={{ velocityDisabled: true }}
      doubleClick={{ disabled: true }}
    >
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
        <div
          className="relative"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            backgroundColor: '#F7F1E7',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {positionedPosts.map((post) =>
            post.type === 'polaroid' ? (
              <PolaroidCard key={post.id} post={post} x={post.x} y={post.y} rotate={post.rotate} />
            ) : (
              <PostItCard key={post.id} post={post} x={post.x} y={post.y} rotate={post.rotate} />
            ),
          )}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default BoardCanvas
