import { motion } from 'framer-motion'
import yellowPaper from '../../assets/postit/yellow.png'

const PAPER_FILTERS = {
  yellow: 'none',
  pink: 'hue-rotate(320deg) saturate(0.95) brightness(1.03)',
  blue: 'hue-rotate(165deg) saturate(0.82) brightness(1.02)',
  beige: 'hue-rotate(28deg) saturate(0.78) brightness(0.98)',
  gray: 'saturate(0.45) brightness(1.08)',
}

function PostIt({ item, onClick, selected, justCreated }) {
  const paperFilter = PAPER_FILTERS[item.color] ?? 'none'

  return (
    <div
      className="absolute"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: item.zIndex ?? 5,
      }}
    >
      <motion.button
        type="button"
        onClick={() => onClick(item.id)}
        whileTap={{ scale: 1.05 }}
        initial={justCreated ? { scale: 0.78, y: 18, rotate: (item.rotation ?? 0) - 4, opacity: 0 } : false}
        animate={{ rotate: item.rotation ?? 0, scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
        className={`relative min-h-[124px] w-[138px] overflow-hidden rounded-md text-left ${
          selected ? 'ring-2 ring-[#7A4E2C]/50' : ''
        }`}
        style={{
          boxShadow: '3px 6px 14px rgba(0,0,0,0.18)',
          padding: '14px 16px 12px',
        }}
      >
        <img
          src={yellowPaper}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ filter: paperFilter }}
        />
        <p
          className="relative whitespace-pre-wrap break-words text-left"
          style={{
            color: item.textColor ?? 'rgba(59,42,31,0.93)',
            fontFamily: item.fontFamily ?? "'Nanum Pen Script', cursive",
            fontSize: `${item.fontSize ?? 18}px`,
            lineHeight: 1.8,
          }}
        >
          {item.text}
        </p>
        <p className="relative mt-1 text-right text-[11px] text-[#745A47]">{item.date}</p>
      </motion.button>
    </div>
  )
}

export default PostIt
