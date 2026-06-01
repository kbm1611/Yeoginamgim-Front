import { motion } from 'framer-motion'
import yellowPaper from '../../assets/postit/yellow.png'

const COLOR_OVERLAYS = {
  pink: 'rgba(255,150,150,0.5)',
  blue: 'rgba(150,180,255,0.5)',
  mint: 'rgba(150,255,200,0.5)',
}

function PostIt({ item, onClick, selected, justCreated }) {
  const overlayColor = COLOR_OVERLAYS[item.color]

  return (
    <motion.button
      type="button"
      onClick={() => onClick(item.id)}
      whileTap={{ scale: 1.05 }}
      initial={justCreated ? { scale: 0.78, y: 18, rotate: (item.rotation ?? 0) - 4, opacity: 0 } : false}
      animate={{ scale: 1, y: 0, rotate: item.rotation ?? 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
      className={`absolute min-h-[124px] w-[138px] overflow-hidden rounded-md text-left ${
        selected ? 'ring-2 ring-[#7A4E2C]/50' : ''
      } ${justCreated ? 'postit-tack' : ''}`}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: item.zIndex ?? 5,
        backgroundImage: `url(${yellowPaper})`,
        backgroundSize: 'cover',
        boxShadow: '3px 5px 12px rgba(0,0,0,0.15)',
        padding: '18px',
      }}
    >
      {overlayColor && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: overlayColor, mixBlendMode: 'multiply' }}
        />
      )}
      <p
        className="relative whitespace-pre-wrap break-words text-left"
        style={{
          color: item.textColor ?? 'rgba(59,42,31,0.93)',
          fontFamily: "'Nanum Pen Script', cursive",
          fontSize: '18px',
          lineHeight: 1.8,
        }}
      >
        {item.text}
      </p>
      <p className="relative mt-1 text-right text-[11px] text-[#745A47]">{item.date}</p>
    </motion.button>
  )
}

export default PostIt
