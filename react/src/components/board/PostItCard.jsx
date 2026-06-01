import { Heart } from 'lucide-react'
import tapeBasic from '../../assets/images/tapes/tape-basic.png'
import yellowPaper from '../../assets/images/postits/yellow.png'
import pinkPaper from '../../assets/images/postits/pink-torn.png'
import greenPaper from '../../assets/images/postits/green.png'
import gridPaper from '../../assets/images/postits/grid-cream.png'

const bgByColor = {
  yellow: yellowPaper,
  pink: pinkPaper,
  green: greenPaper,
  grid: gridPaper,
}

function hashValue(seed) {
  return Array.from(String(seed)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

function PostItCard({ post }) {
  const hash = hashValue(post.id)
  const bg = bgByColor[post.color] ?? yellowPaper
  const tape = tapeBasic
  const signed = hash % 2 === 0 ? 1 : -1
  const cardRotation = signed * (1 + (hash % 3)) // 1~3deg
  const tapeRotation = `${cardRotation * -0.6 + ((hash % 5) - 2) * 0.5}deg`
  const tapeW = 84 + (hash % 34)
  const textTilt = ((hash % 5) - 2) * 0.2
  const grainOpacity = 0.06 + (hash % 5) * 0.01

  return (
    <article
      className="absolute h-[260px] w-[260px] box-border drop-shadow-[0_10px_16px_rgba(66,44,28,0.20)]"
      style={{
        left: `${post.x}px`,
        top: `${post.y}px`,
        transform: `rotate(${cardRotation}deg)`,
        zIndex: 10 + (hash % 4),
      }}
    >
      <div
        className="absolute inset-0 z-10 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bg})`,
          // trim transparent padding in source image
          clipPath: 'inset(7% 7% 7% 7%)',
        }}
      />

      <img
        src={tape}
        alt=""
        className="pointer-events-none absolute left-1/2 top-0 z-20 h-8 -translate-x-1/2 -translate-y-2 object-contain opacity-90"
        style={{
          width: `${tapeW}px`,
          transform: `translateX(-50%) rotate(${tapeRotation})`,
          clipPath: hash % 2 === 0 ? 'polygon(2% 14%, 98% 10%, 95% 88%, 3% 92%)' : 'polygon(0 18%, 100% 12%, 97% 85%, 4% 95%)',
        }}
      />

      <div className="absolute inset-[18px] z-[12] overflow-hidden">
        <span
          className="pointer-events-none absolute inset-0 z-[11]"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(86,63,43,0.22) 0.6px, transparent 0.8px), radial-gradient(circle at 78% 70%, rgba(104,80,58,0.2) 0.5px, transparent 0.8px)',
            backgroundSize: '12px 12px, 16px 16px',
            mixBlendMode: 'multiply',
            opacity: grainOpacity,
          }}
        />

        <p
          className="absolute left-3 right-3 top-3 z-[12] whitespace-pre-line text-[31px] leading-[1.34] text-[#2F2118]"
          style={{
            fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
            transform: `rotate(${textTilt}deg)`,
            textShadow: '0 0.4px 0 rgba(30,20,14,0.2)',
          }}
        >
          {post.text}
        </p>

        <div className="absolute bottom-3 left-3 right-3 z-[12] flex items-center justify-between text-[#5B4738]">
          <div className="min-w-0">
            <p className="truncate text-[14px]" style={{ fontFamily: "'Gaegu', 'Nanum Pen Script', cursive" }}>
              - {post.author} -
            </p>
            <p className="mt-0.5 text-[13px]" style={{ fontFamily: "'Gaegu', 'Nanum Pen Script', cursive" }}>
              {post.date}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[14px]" style={{ fontFamily: "'Gaegu', 'Nanum Pen Script', cursive" }}>
            <Heart size={16} color="#E06153" />
            {post.likes}
          </span>
        </div>
      </div>
    </article>
  )
}

export default PostItCard
