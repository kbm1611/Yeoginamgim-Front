import { Heart } from 'lucide-react'

function Polaroid({ item, onClick, selected }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`absolute w-[146px] rounded-[4px] bg-white p-2 text-left shadow-[0_8px_18px_rgba(50,33,20,0.18)] transition ${
        selected ? 'ring-2 ring-[#7A4E2C]/55' : ''
      }`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg)` }}
    >
      <span className="absolute left-1/2 top-0 h-2 w-14 -translate-x-1/2 -translate-y-1 rotate-3 bg-[#EFE2D4]/85" />
      <img src={item.image} alt="" className="h-[98px] w-full object-cover" />
      <p className="mt-1.5 whitespace-pre-line text-[12px] leading-5 text-[#3E2A1E]">{item.text}</p>
      <div className="mt-1 flex items-center justify-end text-[#B0927A]">
        <Heart size={14} />
      </div>
    </button>
  )
}

export default Polaroid
