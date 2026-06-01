import { Heart } from 'lucide-react'

function hashValue(seed) {
  return Array.from(String(seed)).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function Polaroid({ item, onClick, selected }) {
  const hash = hashValue(item.id)
  const likeCount = 7 + (hash % 10)
  const rotation = item.rotation ?? ((hash % 5) - 2)

  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`relative w-full rounded-[4px] bg-white p-1.5 pb-3 text-left shadow-[0_10px_18px_rgba(34,20,12,0.16)] transition ${
        selected ? 'ring-2 ring-[#6E8A63]/45' : ''
      }`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1 rounded-full bg-[#C59B6A] shadow-[0_2px_6px_rgba(0,0,0,0.2)]" />
      <span className="pointer-events-none absolute left-1/2 top-0 h-2.5 w-14 -translate-x-1/2 translate-y-1 rotate-[5deg] rounded-[2px] bg-[#C9D6C6]/80" />

      <img src={item.image} alt="" className="h-[96px] w-full object-cover" />

      <p className="mt-2 line-clamp-2 text-[10px] leading-[1.35] text-[#3E2A1E]">{item.text}</p>
      <div className="mt-1.5 flex items-center justify-between text-[#8D735F]">
        <span className="text-[9px]">{item.dateLabel || '오늘'}</span>
        <span className="inline-flex items-center gap-1 text-[9px]">
          <Heart size={11} />
          {likeCount}
        </span>
      </div>
    </button>
  )
}

export default Polaroid
