import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import yellowPaper from '../../assets/postit/yellow.png'
import Polaroid from './Polaroid'
import PostIt from './PostIt'

const PAPER_FILTERS = {
  yellow: 'none',
  pink: 'hue-rotate(320deg) saturate(0.95) brightness(1.03)',
  blue: 'hue-rotate(165deg) saturate(0.82) brightness(1.02)',
  beige: 'hue-rotate(28deg) saturate(0.78) brightness(0.98)',
  gray: 'saturate(0.45) brightness(1.08)',
}

function BoardCanvas({
  postIts,
  polaroids,
  onSelectItem,
  selectedItemId,
  justCreatedId,
  placementDraft,
  onDraftPositionChange,
}) {
  const containerRef = useRef(null)
  const [draftPosition, setDraftPosition] = useState({ x: 42, y: 40 })
  const [isDraftArrived, setIsDraftArrived] = useState(false)
  const draftDragRef = useRef({ dragging: false, pointerId: null, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    if (placementDraft) {
      const next = { x: placementDraft.x ?? 42, y: placementDraft.y ?? 40 }
      setDraftPosition(next)
      setIsDraftArrived(false)
    }
  }, [placementDraft])

  useEffect(() => {
    if (!placementDraft) return
    const timer = setTimeout(() => setIsDraftArrived(true), 430)
    return () => clearTimeout(timer)
  }, [placementDraft])

  useEffect(() => {
    const onWindowUp = () => {
      if (draftDragRef.current.dragging) {
        draftDragRef.current.dragging = false
        onDraftPositionChange?.(draftPosition)
      }
    }
    window.addEventListener('mouseup', onWindowUp)
    window.addEventListener('touchcancel', onWindowUp)
    return () => {
      window.removeEventListener('mouseup', onWindowUp)
      window.removeEventListener('touchcancel', onWindowUp)
    }
  }, [draftPosition, onDraftPositionChange])

  const startDraftDrag = (event) => {
    if (!isDraftArrived || !placementDraft) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const px = (draftPosition.x / 100) * rect.width
    const py = (draftPosition.y / 100) * rect.height

    draftDragRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - px,
      offsetY: event.clientY - py,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDraftDrag = (event) => {
    if (!isDraftArrived || !draftDragRef.current.dragging || !placementDraft) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const nextX = event.clientX - rect.left - draftDragRef.current.offsetX
    const nextY = event.clientY - rect.top - draftDragRef.current.offsetY

    const next = {
      x: Math.max(10, Math.min(90, (nextX / rect.width) * 100)),
      y: Math.max(10, Math.min(90, (nextY / rect.height) * 100)),
    }
    setDraftPosition(next)
    onDraftPositionChange?.(next)
  }

  const endDraftDrag = (event) => {
    if (!isDraftArrived || !draftDragRef.current.dragging || !placementDraft) return
    draftDragRef.current.dragging = false
    event.currentTarget.releasePointerCapture(draftDragRef.current.pointerId)
    onDraftPositionChange?.(draftPosition)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-[28px]"
      style={{
        backgroundColor: '#D9C9B4',
        backgroundImage: 'radial-gradient(circle, #BEA882 0.7px, transparent 0.7px)',
        backgroundSize: '14px 14px',
      }}
    >
      <TransformWrapper disabled={!!placementDraft} minScale={0.85} maxScale={2.4}>
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%', position: 'relative' }}
        >
          {postIts.map((item) => (
            <PostIt
              key={item.id}
              item={item}
              onClick={onSelectItem}
              selected={selectedItemId === item.id}
              justCreated={justCreatedId === item.id}
            />
          ))}
          {polaroids.map((item) => (
            <Polaroid key={item.id} item={item} onClick={onSelectItem} selected={selectedItemId === item.id} />
          ))}
        </TransformComponent>
      </TransformWrapper>

      {placementDraft ? (
        placementDraft.type === 'polaroid' ? (
          <motion.button
            type="button"
            onPointerDown={startDraftDrag}
            onPointerMove={moveDraftDrag}
            onPointerUp={endDraftDrag}
            className="absolute z-30 w-[156px] rounded-xl bg-[#FFFCF8] p-2 text-left shadow-[0_14px_30px_rgba(34,20,12,0.18)] ring-2 ring-[#6e4a2e]/25"
            initial={{ left: '50%', top: '86%', x: '-50%', y: '-50%', rotate: 0, scale: 0.92, opacity: 0.88 }}
            animate={{ left: `${draftPosition.x}%`, top: `${draftPosition.y}%`, x: '-50%', y: '-50%', rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ pointerEvents: isDraftArrived ? 'auto' : 'none' }}
          >
            <span className="absolute left-1/2 top-0 h-2.5 w-16 -translate-x-1/2 -translate-y-1 rotate-2 bg-[#F2E5D8]/90" />
            <img src={placementDraft.image} alt="" className="h-[104px] w-full rounded-lg object-cover" />
            <p
              className="mt-2 whitespace-pre-line text-[12px] leading-5"
              style={{ color: placementDraft.textColor, fontFamily: placementDraft.fontFamily }}
            >
              {placementDraft.text}
            </p>
            <p className="mt-1 text-center text-[11px] text-[#8A705F]">{placementDraft.dateLabel}</p>
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onPointerDown={startDraftDrag}
            onPointerMove={moveDraftDrag}
            onPointerUp={endDraftDrag}
            className="absolute z-30 min-h-[124px] w-[138px] overflow-hidden rounded-md text-left ring-2 ring-[#6e4a2e]/25"
            initial={{ left: '50%', top: '86%', x: '-50%', y: '-50%', rotate: 0, scale: 0.9, opacity: 0.88 }}
            animate={{ left: `${draftPosition.x}%`, top: `${draftPosition.y}%`, x: '-50%', y: '-50%', rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              pointerEvents: isDraftArrived ? 'auto' : 'none',
              boxShadow: '3px 5px 12px rgba(0,0,0,0.15)',
              padding: '14px 16px 12px',
            }}
          >
            <img
              src={yellowPaper}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ filter: PAPER_FILTERS[placementDraft.color] ?? 'none' }}
            />
            <p
              className="relative whitespace-pre-line text-left"
              style={{
                color: placementDraft.textColor,
                fontFamily: placementDraft.fontFamily ?? "'Nanum Pen Script', cursive",
                fontSize: `${placementDraft.fontSize ?? 18}px`,
                lineHeight: 1.8,
              }}
            >
              {placementDraft.text}
            </p>
          </motion.button>
        )
      ) : null}
    </div>
  )
}

export default BoardCanvas
