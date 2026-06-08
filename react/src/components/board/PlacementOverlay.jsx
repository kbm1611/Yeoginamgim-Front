import { useRef, useState } from 'react'
import { CARD_W, COL_STAGGER, COL_X, ROW_H, cellToCenter } from './PlacementGrid'

// 화면 좌표 → 캔버스 좌표 (transform 적용 후)
function screenToCanvas(screenX, screenY, transformRef) {
  const state = transformRef.current?.state
  if (!state) return { x: screenX, y: screenY }

  const { scale, positionX, positionY } = state
  return {
    x: (screenX - positionX) / scale,
    y: (screenY - positionY) / scale,
  }
}

// 캔버스 좌표 → 가장 가까운 (row, col)
function canvasToCell(cx, cy) {
  const col = cx < (COL_X[0] + COL_X[1]) / 2 ? 0 : 1
  const stagger = col === 1 ? COL_STAGGER : 0
  const row = Math.max(0, Math.round((cy - stagger - 60 - CARD_W / 2) / ROW_H))
  return { row, col }
}

// 가장 가까운 빈 셀 탐색 (방사형 BFS)
function findNearestEmpty(targetRow, targetCol, occupied) {
  if (!occupied.has(`${targetRow}-${targetCol}`)) {
    return { row: targetRow, col: targetCol }
  }

  for (let dist = 1; dist <= 20; dist++) {
    for (let dr = -dist; dr <= dist; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (Math.abs(dr) + Math.abs(dc) !== dist) continue
        const r = Math.max(0, targetRow + dr)
        const c = ((targetCol + dc) % 2 + 2) % 2  // 0 또는 1만
        if (!occupied.has(`${r}-${c}`)) {
          return { row: r, col: c }
        }
      }
    }
  }
  return { row: targetRow, col: targetCol }
}

// 기존 posts에서 점유 셀 집합 계산
function getOccupied(posts) {
  const set = new Set()
  posts.forEach((p, i) => {
    const col = p.cell?.col ?? (i % 2)
    const row = p.cell?.row ?? Math.floor(i / 2)
    set.add(`${row}-${col}`)
  })
  return set
}

// 드래프트 미리보기 — 캡처된 이미지를 그대로 표시
function DraftPreview({ draft, style }) {
  if (draft.capturedImage) {
    return (
      <img
        src={draft.capturedImage}
        alt=""
        style={{
          width: 120,
          height: 'auto',
          transform: 'rotate(-2deg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          ...style,
        }}
      />
    )
  }

  // fallback: 캡처 실패 시
  const isPostit = draft.type !== 'polaroid'
  return (
    <div
      style={{
        width: 100,
        height: 100,
        borderRadius: isPostit ? 4 : 6,
        backgroundColor: isPostit ? '#FFE38A' : '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        transform: 'rotate(-2deg)',
        ...style,
      }}
    >
      <p style={{ fontSize: 12, color: '#2A1E14', textAlign: 'center', margin: 0 }}>
        {draft.content || ''}
      </p>
    </div>
  )
}

export default function PlacementOverlay({ draft, posts, transformRef, onPlace, onCancel }) {
  const [pos, setPos] = useState(null)
  const [targetCell, setTargetCell] = useState(null)
  const [snapping, setSnapping] = useState(false)
  const [snapPos, setSnapPos] = useState(null)
  const [isDraggingNow, setIsDraggingNow] = useState(false)
  const isDragging = useRef(false)
  const overlayRef = useRef(null)
  const occupied = getOccupied(posts)

  const getXY = (e) => {
    if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: e.clientX, y: e.clientY }
  }

  const updatePos = (x, y) => {
    const canvas = screenToCanvas(x, y, transformRef)
    const rough = canvasToCell(canvas.x, canvas.y)
    const cell = findNearestEmpty(rough.row, rough.col, occupied)
    setTargetCell(cell)
    setPos({ x, y })
  }

  const handleDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    setIsDraggingNow(true)
    setSnapping(false)
    setSnapPos(null)
    const { x, y } = getXY(e)
    updatePos(x, y)
  }

  const handleMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const { x, y } = getXY(e)
    updatePos(x, y)
  }

  const handleUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setIsDraggingNow(false)
    if (!targetCell) return
    setSnapPos(getSnapPos())
    setSnapping(true)
    setTimeout(() => onPlace(targetCell), 300)
  }

  const getSnapPos = () => {
    if (!targetCell || !transformRef.current?.state) return null
    const { x: cx, y: cy } = cellToCenter(targetCell.row, targetCell.col)
    const { scale, positionX, positionY } = transformRef.current.state
    return { x: cx * scale + positionX, y: cy * scale + positionY }
  }

  const displayPos = snapping ? snapPos : pos

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDraggingNow ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
      onTouchCancel={handleUp}
    >
      {/* 배경 오버레이 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.08)',
          backdropFilter: 'blur(0.5px)',
          pointerEvents: 'none',
        }}
      />

      {/* 드래그 중인 카드 */}
      {displayPos && (
        <div
          style={{
            position: 'fixed',
            left: displayPos.x,
            top: displayPos.y - 20, // 손가락보다 살짝 위
            transform: 'translate(-50%, -50%) scale(1.05)',
            pointerEvents: 'none',
            transition: snapping
              ? 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'none',
            zIndex: 2,
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))',
          }}
        >
          <DraftPreview draft={draft} />
        </div>
      )}

      {/* 초기 상태: 안내 메시지 */}
      {!pos && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'none',
          }}
        >
          <DraftPreview draft={draft} style={{ transform: 'rotate(-2deg) scale(1.1)' }} />
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 24,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: '#3B2A1E',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            원하는 위치로 드래그하세요
          </div>
        </div>
      )}

      {/* 취소 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onCancel()
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: 'none',
          borderRadius: 20,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: '#3B2A1E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        취소
      </button>
    </div>
  )
}
