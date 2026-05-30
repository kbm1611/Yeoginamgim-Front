import { useEffect, useMemo, useRef, useState } from 'react'
import boardBg from '../../assets/board-bg.png'
import Polaroid from './Polaroid'
import PostIt from './PostIt'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function distance(a, b) {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}

function BoardCanvas({
  postIts,
  polaroids,
  onSelectItem,
  selectedItemId,
  justCreatedId,
  placementDraft,
  onPlaceDraft,
}) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [draftPosition, setDraftPosition] = useState({ x: 42, y: 40 })

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 })
  const pinchRef = useRef({ pinching: false, startDist: 0, startScale: 1 })
  const draftDragRef = useRef({ dragging: false, pointerId: null, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    if (placementDraft) {
      setDraftPosition({ x: 42, y: 40 })
    }
  }, [placementDraft])

  const limitOffset = (targetScale, targetOffset) => {
    const container = containerRef.current
    if (!container) return targetOffset
    const { width, height } = container.getBoundingClientRect()
    const maxX = ((targetScale - 1) * width) / 2
    const maxY = ((targetScale - 1) * height) / 2

    return {
      x: clamp(targetOffset.x, -maxX, maxX),
      y: clamp(targetOffset.y, -maxY, maxY),
    }
  }

  const onPointerDown = (event) => {
    if (placementDraft) return
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    }
  }

  const onPointerMove = (event) => {
    if (placementDraft) return
    if (!dragRef.current.dragging) return
    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY
    const next = limitOffset(scale, {
      x: dragRef.current.startOffsetX + dx,
      y: dragRef.current.startOffsetY + dy,
    })
    setOffset(next)
  }

  const endPointerDrag = () => {
    dragRef.current.dragging = false
  }

  const onTouchStart = (event) => {
    if (placementDraft) return
    if (event.touches.length === 2) {
      pinchRef.current = {
        pinching: true,
        startDist: distance(event.touches[0], event.touches[1]),
        startScale: scale,
      }
      dragRef.current.dragging = false
      return
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      dragRef.current = {
        dragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      }
    }
  }

  const onTouchMove = (event) => {
    if (placementDraft) return
    if (pinchRef.current.pinching && event.touches.length === 2) {
      event.preventDefault()
      const nextScale = clamp(
        (distance(event.touches[0], event.touches[1]) / pinchRef.current.startDist) * pinchRef.current.startScale,
        0.8,
        2.5,
      )
      setScale(nextScale)
      setOffset((prev) => limitOffset(nextScale, prev))
      return
    }

    if (dragRef.current.dragging && event.touches.length === 1) {
      event.preventDefault()
      const touch = event.touches[0]
      const dx = touch.clientX - dragRef.current.startX
      const dy = touch.clientY - dragRef.current.startY
      const next = limitOffset(scale, {
        x: dragRef.current.startOffsetX + dx,
        y: dragRef.current.startOffsetY + dy,
      })
      setOffset(next)
    }
  }

  const onTouchEnd = (event) => {
    if (event.touches.length < 2) pinchRef.current.pinching = false
    if (event.touches.length === 0) dragRef.current.dragging = false
  }

  useEffect(() => {
    const onWindowUp = () => {
      dragRef.current.dragging = false
      pinchRef.current.pinching = false
      if (draftDragRef.current.dragging && placementDraft) {
        draftDragRef.current.dragging = false
        onPlaceDraft?.(draftPosition)
      }
    }
    window.addEventListener('mouseup', onWindowUp)
    window.addEventListener('touchcancel', onWindowUp)
    return () => {
      window.removeEventListener('mouseup', onWindowUp)
      window.removeEventListener('touchcancel', onWindowUp)
    }
  }, [draftPosition, onPlaceDraft, placementDraft])

  const transformStyle = useMemo(
    () => ({ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }),
    [offset.x, offset.y, scale],
  )

  const startDraftDrag = (event) => {
    if (!placementDraft) return
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
    if (!draftDragRef.current.dragging || !placementDraft) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const nextX = event.clientX - rect.left - draftDragRef.current.offsetX
    const nextY = event.clientY - rect.top - draftDragRef.current.offsetY

    setDraftPosition({
      x: clamp((nextX / rect.width) * 100, 10, 90),
      y: clamp((nextY / rect.height) * 100, 10, 90),
    })
  }

  const endDraftDrag = (event) => {
    if (!draftDragRef.current.dragging || !placementDraft) return
    draftDragRef.current.dragging = false
    event.currentTarget.releasePointerCapture(draftDragRef.current.pointerId)
    onPlaceDraft?.(draftPosition)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl shadow-[0_10px_26px_rgba(72,47,30,0.2)]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointerDrag}
      onPointerLeave={endPointerDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${boardBg})` }} />

      <div className="absolute inset-0 touch-none" style={transformStyle}>
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
      </div>

      {placementDraft ? (
        <button
          type="button"
          onPointerDown={startDraftDrag}
          onPointerMove={moveDraftDrag}
          onPointerUp={endDraftDrag}
          className="absolute z-30 min-h-[120px] w-[132px] rounded-[3px] bg-[#F6E9B8] p-3 text-left shadow-[0_8px_18px_rgba(50,33,20,0.16)] ring-2 ring-[#6e4a2e]/25"
          style={{
            left: `${draftPosition.x}%`,
            top: `${draftPosition.y}%`,
            transform: `translate(-50%, -50%) rotate(${placementDraft.rotation ?? 0}deg)`,
          }}
        >
          <span className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1 rounded-full bg-gradient-to-b from-[#D8B98E] to-[#9D6B3E] shadow" />
          <p
            className="whitespace-pre-line"
            style={{
              color: placementDraft.textColor,
              fontFamily: placementDraft.fontFamily,
              fontSize: `${placementDraft.fontSize}px`,
              lineHeight: 1.45,
            }}
          >
            {placementDraft.text}
          </p>
          <p className="mt-2 text-[11px] text-[#7F6552]">드래그해서 위치 선택</p>
        </button>
      ) : null}
    </div>
  )
}

export default BoardCanvas
