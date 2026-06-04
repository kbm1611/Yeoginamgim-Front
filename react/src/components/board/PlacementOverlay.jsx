import { useRef, useState } from 'react'

// BoardCanvas와 공유하는 그리드 상수
export const CANVAS_W = 480
export const COL_X = [125, 355]
export const CARD_W = 210
export const ROW_H = 280
export const COL_STAGGER = 80

// 셀 인덱스 → 캔버스 중심 좌표
export function cellToCenter(row, col) {
  const stagger = col === 1 ? COL_STAGGER : 0
  return {
    x: COL_X[col],
    y: row * ROW_H + stagger + 60 + CARD_W / 2,
  }
}

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

// 드래프트 미리보기 카드
function DraftPreview({ draft, style }) {
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
        border: isPostit ? 'none' : '1px solid #e0d5c8',
        transform: 'rotate(-2deg)',
        ...style,
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: '#2A1E14',
          textAlign: 'center',
          lineHeight: 1.4,
          fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
          overflow: 'hidden',
          maxHeight: 80,
          wordBreak: 'break-word',
          margin: 0,
        }}
      >
        {draft.content || '(내용 없음)'}
      </p>
    </div>
  )
}

export default function PlacementOverlay({ draft, posts, transformRef, onPlace, onCancel }) {
  const [pointerPos, setPointerPos] = useState(null)
  const [targetCell, setTargetCell] = useState(null)
  const [snapping, setSnapping] = useState(false)
  const dragStartRef = useRef(null)
  const overlayRef = useRef(null)
  const occupied = getOccupied(posts)

  // 화면 좌표 → 타겟 셀 계산
  const updateTarget = (screenX, screenY) => {
    const canvas = screenToCanvas(screenX, screenY, transformRef)
    const rough = canvasToCell(canvas.x, canvas.y)
    const cell = findNearestEmpty(rough.row, rough.col, occupied)
    setTargetCell(cell)
    setPointerPos({ x: screenX, y: screenY })
  }

  // 포인터 다운: 드래그 시작
  const handleMouseDown = (e) => {
    if (e.button !== 0) return  // left button only
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    updateTarget(e.clientX, e.clientY)
  }

  // 포인터 무브: 드래그 중 위치 업데이트
  const handleMouseMove = (e) => {
    if (!dragStartRef.current) return
    updateTarget(e.clientX, e.clientY)
  }

  // 포인터 업: 배치 완료
  const handleMouseUp = () => {
    if (!dragStartRef.current || !targetCell) {
      dragStartRef.current = null
      return
    }

    dragStartRef.current = null
    setSnapping(true)

    // snap 애니메이션 후 배치 → onPlace에서 overlay 닫기 처리
    setTimeout(() => {
      onPlace(targetCell)
    }, 200)
  }

  // 터치 이벤트 (모바일)
  const handleTouchStart = (e) => {
    if (!e.touches[0]) return
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    updateTarget(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e) => {
    if (!dragStartRef.current || !e.touches[0]) return
    e.preventDefault()
    const touch = e.touches[0]
    updateTarget(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    if (!dragStartRef.current || !targetCell) {
      dragStartRef.current = null
      return
    }

    dragStartRef.current = null
    setSnapping(true)

    // snap 애니메이션 후 배치 → onPlace에서 overlay 닫기 처리
    setTimeout(() => {
      onPlace(targetCell)
    }, 200)
  }

  // snap 위치 계산
  const getSnapPos = () => {
    if (!targetCell || !transformRef.current) return null
    const state = transformRef.current.state
    if (!state) return null

    const { x: cx, y: cy } = cellToCenter(targetCell.row, targetCell.col)
    const { scale, positionX, positionY } = state

    return {
      x: cx * scale + positionX,
      y: cy * scale + positionY,
    }
  }

  const snapPos = snapping ? getSnapPos() : null
  const displayPos = snapping && snapPos ? snapPos : pointerPos

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
            top: displayPos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            transition: snapping ? 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            zIndex: 2,
          }}
        >
          <DraftPreview draft={draft} />
        </div>
      )}

      {/* 초기 상태: 안내 메시지 */}
      {!pointerPos && (
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
