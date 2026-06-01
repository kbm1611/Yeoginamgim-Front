import { Heart } from 'lucide-react'

function Polaroid({ item, onClick, selected }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`absolute w-[156px] rounded-xl bg-[#FFFCF8] p-2 text-left shadow-[0_12px_26px_rgba(34,20,12,0.16)] transition ${
        selected ? 'ring-2 ring-[#7A4E2C]/55 shadow-[0_18px_34px_rgba(34,20,12,0.22)]' : ''
      }`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`, zIndex: item.zIndex ?? 6 }}
    >
      <span className="absolute left-1/2 top-0 h-2.5 w-16 -translate-x-1/2 -translate-y-1 rotate-2 bg-[#F2E5D8]/90" />
      <img src={item.image} alt="" className="h-[104px] w-full rounded-lg object-cover" />
      <p className="mt-2 whitespace-pre-line text-[12px] leading-5" style={{ color: item.textColor ?? '#3E2A1E', fontFamily: item.fontFamily }}>
        {item.text}
      </p>
      <div className="mt-1.5 flex items-center justify-between text-[#B0927A]">
        <span className="text-[10px]">{item.dateLabel ?? ''}</span>
        <Heart size={14} />
      </div>
    </button>
  )
}

export default Polaroid
