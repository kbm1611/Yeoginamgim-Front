import { motion } from 'framer-motion'

function PostIt({ item, onClick, selected, justCreated }) {
  const colorClass =
    item.color === 'pink'
      ? 'bg-[#F7DDDF]'
      : item.color === 'blue'
        ? 'bg-[#DDE9F5]'
        : item.color === 'ivory'
          ? 'bg-[#F7F1E6]'
          : 'bg-[#F6E9B8]'

  return (
    <motion.button
      type="button"
      onClick={() => onClick(item.id)}
      initial={justCreated ? { scale: 0.78, y: 18, rotate: (item.rotation ?? 0) - 4, opacity: 0 } : false}
      animate={{ scale: 1, y: 0, rotate: item.rotation ?? 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
      className={`absolute min-h-[120px] w-[132px] rounded-[3px] p-3 text-left shadow-[0_8px_16px_rgba(50,33,20,0.14)] transition ${colorClass} ${
        selected ? 'ring-2 ring-[#7A4E2C]/50' : ''
      }`}
      style={{ left: `${item.x}%`, top: `${item.y}%` }}
    >
      <span className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1 rounded-full bg-gradient-to-b from-[#D8B98E] to-[#9D6B3E] shadow" />
      <p
        className="whitespace-pre-line"
        style={{
          color: item.textColor ?? 'rgba(59,42,31,0.93)',
          fontFamily: item.fontFamily ?? "'Nanum Pen Script', cursive",
          fontSize: `${item.fontSize ?? 18}px`,
          lineHeight: 1.45,
          letterSpacing: '0.01em',
          textShadow: '0 0.3px 0 rgba(59,42,31,0.12)',
        }}
      >
        {item.text}
      </p>
      <p className="mt-2 text-right text-[12px] text-[#745A47]">{item.date}</p>
    </motion.button>
  )
}

export default PostIt
