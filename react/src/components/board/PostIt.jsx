import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const PASTEL_BG = ['#F7EDC6', '#F0E4F7', '#E7F2D8', '#F6E7D5']

function hashValue(seed) {
  return Array.from(String(seed)).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function PostIt({ item, onClick, selected, justCreated }) {
  const hash = hashValue(item.id)
  const paperColor = PASTEL_BG[hash % PASTEL_BG.length]
  const likeCount = 6 + (hash % 12)
  const rotation = item.rotation ?? ((hash % 5) - 2)

  return (
    <motion.button
      type="button"
      onClick={() => onClick(item.id)}
      whileTap={{ scale: 1.02 }}
      initial={justCreated ? { scale: 0.92, y: 10, opacity: 0 } : false}
      animate={{ scale: 1, y: 0, opacity: 1, rotate: rotation }}
      transition={{ type: 'spring', stiffness: 230, damping: 24 }}
      className={`relative aspect-square w-full rounded-[6px] p-3 text-left shadow-[0_10px_18px_rgba(58,38,23,0.18)] ${
        selected ? 'ring-2 ring-[#6E8A63]/45' : ''
      }`}
      style={{ backgroundColor: paperColor }}
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-3 w-14 -translate-x-1/2 -translate-y-1 rotate-[-4deg] rounded-[2px] bg-[#E6D7BF]/80 shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />

      <p
        className="whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-[#2F2118]"
        style={{ fontFamily: item.fontFamily ?? "'Nanum Pen Script', cursive" }}
      >
        {item.text}
      </p>

      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-[#4D3A2E]">
        <span>{item.date || '2시간 전'}</span>
        <span className="inline-flex items-center gap-1">
          <Heart size={12} strokeWidth={1.8} />
          {likeCount}
        </span>
      </div>
    </motion.button>
  )
}

export default PostIt
