import { motion } from 'framer-motion'
import postitYellow from '../assets/postit/postit.png'
import polaroidBg from '../assets/poloaroid/폴라로이드.png'
import bgImage from '../assets/배경.png'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const PEN_COLORS = ['#2C1A0E', '#6B3A2A', '#C9843A', '#E89090', '#F5C842', '#9B7FD4', '#A8C5A0']
const TEXT_COLORS = ['#2C1A0E', '#6B3A2A', '#C9843A', '#E89090', '#F5C842', '#9B7FD4', '#FFFFFF']
const POSTIT_BG_COLORS = ['#F0E4C8', '#ECC0C0', '#BDD6BD', '#BDD0E8', '#D0BDE8', '#ECC8A8']
const STICKERS = ['🌸', '💗', '⭐', '🌙', '🍀', '🎀', '🦋', '🌈', '☀️', '🌊', '🍃', '✨']
const TAPE_COLORS = ['#C9D6C6', '#D4B896', '#B8C9D6', '#D6B8C9', '#C6D4B8', '#D6C9B8']

const FONTS = [
  { label: '손글씨', family: "'Nanum Pen Script', cursive" },
  { label: '귀여운', family: "'Gaegu', cursive" },
  { label: '고딕',   family: "'Pretendard', sans-serif" },
  { label: '명조',   family: "'Noto Serif KR', serif" },
]


const SIZE_MAP = { S: 18, M: 24, L: 32 }

function today() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function drawTextObjects(ctx, objects, width, height, { baseWidth = 300 } = {}) {
  objects.forEach((obj) => {
    const x = (obj.xPct / 100) * width
    const y = (obj.yPct / 100) * height
    const fontScale = width / baseWidth
    const fontSizePx = (obj.fontSize ?? 24) * fontScale
    const lineH = fontSizePx * 1.3
    const lines = (obj.text ?? '').split('\n')

    ctx.save()
    ctx.font = `${fontSizePx}px ${obj.fontFamily ?? 'sans-serif'}`
    ctx.fillStyle = obj.color ?? '#2A1E14'
    ctx.textAlign = obj.align ?? 'center'
    ctx.textBaseline = 'middle'
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + (li - (lines.length - 1) / 2) * lineH)
    })
    ctx.restore()
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconText = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)
const IconPen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)
const IconDecor = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
)
const IconPhoto = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

// 포스트잇 모드 툴
const POSTIT_TOOLS = [
  { key: 'text',  label: '텍스트', Icon: IconText },
  { key: 'pen',   label: '펜',     Icon: IconPen },
  { key: 'decor', label: '꾸미기', Icon: IconDecor },
]

// 포토카드 모드 툴 (사진 + 텍스트만)
const PHOTO_TOOLS = [
  { key: 'photo', label: '사진',   Icon: IconPhoto },
  { key: 'text',  label: '텍스트', Icon: IconText },
  { key: 'decor', label: '꾸미기', Icon: IconDecor },
]

// ─── TextObject ───────────────────────────────────────────────────────────────

function TextObject({ obj, selected, editing, textToolActive, containerRef, onSelect, onStartEdit, onEndEdit, onChange, onMove, onDelete }) {
  const editRef = useRef(null)
  const dragState = useRef(null)

  // 편집 모드 진입: textContent 설정 + focus + 커서 끝
  useEffect(() => {
    if (!editing || !editRef.current) return
    const el = editRef.current
    el.textContent = obj.text   // React children 충돌 없이 직접 설정
    el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const getContainerRect = () => containerRef.current?.getBoundingClientRect()

  const handlePointerDown = (e) => {
    if (editing) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    const containerRect = getContainerRect()
    if (!containerRect) return

    // clamp 범위: 텍스트 중심이 포스트잇 안에 머물도록
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    dragState.current = {
      startClientX: clientX,
      startClientY: clientY,
      startXPct: obj.xPct,
      startYPct: obj.yPct,
    }

    const onMove_ = (ev) => {
      if (!dragState.current) return
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY
      const r = getContainerRect()
      const dxPct = ((cx - dragState.current.startClientX) / r.width) * 100
      const dyPct = ((cy - dragState.current.startClientY) / r.height) * 100
      onMove(
        obj.id,
        Math.max(5, Math.min(95, dragState.current.startXPct + dxPct)),
        Math.max(5, Math.min(95, dragState.current.startYPct + dyPct)),
      )
    }

    const onUp = () => {
      dragState.current = null
      window.removeEventListener('mousemove', onMove_)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove_)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove_)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove_, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const baseTextStyle = {
    fontFamily: obj.fontFamily ?? "'Nanum Pen Script','Gaegu',cursive",
    fontSize: obj.fontSize ?? 24,
    color: obj.color ?? '#2A1E14',
    lineHeight: 1.7,
    textAlign: obj.align ?? 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: 'transparent',
    padding: '4px 8px',
    minHeight: 32,
    boxSizing: 'border-box',
  }

  return (
    // 외부 div: 위치 결정. 너비는 자연스럽게 (translate로 중앙 정렬)
    <div
      style={{
        position: 'absolute',
        left: `${obj.xPct}%`,
        top: `${obj.yPct}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: selected ? 10 : 1,
        touchAction: 'none',
        cursor: editing ? 'text' : selected ? 'grab' : 'pointer',
        userSelect: 'none',
        outline: 'none',
        border: selected
          ? (editing ? '1.5px solid rgba(59,36,24,0.4)' : '1.5px dashed rgba(59,36,24,0.35)')
          : 'none',
        borderRadius: 3,
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation()
        // 텍스트 툴 활성 시 단일 탭으로 바로 편집
        if (textToolActive && !editing) onStartEdit()
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit() }}
    >
      {/* 선택 시 삭제 버튼 */}
      {selected && !editing && (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete?.(obj.id) }}
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#3B2A1E',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            zIndex: 20,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
      {editing ? (
        // 편집 모드: contentEditable div. children 없음 — useEffect로 textContent 직접 주입
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(obj.id, e.currentTarget.textContent ?? '')}
          onBlur={onEndEdit}
          onClick={(e) => e.stopPropagation()}
          style={{ ...baseTextStyle, outline: 'none', minWidth: 80, userSelect: 'text' }}
        />
      ) : (
        // 표시 모드: 그냥 텍스트 레이어
        <div style={{ ...baseTextStyle, pointerEvents: 'none' }}>
          {obj.text || (selected
            ? <span style={{ opacity: 0.25, fontSize: 13, fontFamily: 'sans-serif' }}>텍스트</span>
            : null
          )}
        </div>
      )}
    </div>
  )
}

// ─── DrawingCanvas ───────────────────────────────────────────────────────────

const PEN_SIZE_PX = { thin: 3, medium: 7, thick: 16 }
const ERASER_SIZE_PX = { thin: 12, medium: 24, thick: 40 }

function DrawingCanvas({ active, penColor, penSize, eraser, canvasRef, containerRef }) {
  const isDrawing = useRef(false)
  const lastPos = useRef(null)

  // 펜 모드 활성화 시 canvas를 포스트잇 wrapper 크기에 맞춰 초기화
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    // canvas 자체 rect 대신 containerRef(포스트잇 wrapper) rect를 기준으로 함
    const container = containerRef?.current ?? canvas
    if (!canvas || !container) return
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const targetW = Math.round(rect.width * dpr)
    const targetH = Math.round(rect.height * dpr)
    if (canvas.width === targetW && canvas.height === targetH) return
    const ctx = canvas.getContext('2d')
    const backup = canvas.width > 0 && canvas.height > 0
      ? ctx.getImageData(0, 0, canvas.width, canvas.height)
      : null
    canvas.width = targetW
    canvas.height = targetH
    ctx.scale(dpr, dpr)
    if (backup) ctx.putImageData(backup, 0, 0)
  }, [active, canvasRef, containerRef])

  // 좌표 계산: 반드시 canvas 경계 내로 clamp
  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return {
      x: Math.max(0, Math.min(rect.width,  clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    }
  }

  const applyStroke = (ctx, pos, isStart = false) => {
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.width / dpr
    const cssH = canvas.height / dpr

    const sizePx = eraser
      ? ERASER_SIZE_PX[penSize] ?? ERASER_SIZE_PX.medium
      : PEN_SIZE_PX[penSize] ?? PEN_SIZE_PX.medium

    ctx.save()
    // canvas 경계를 clip region으로 설정 → 포스트잇 밖으로 절대 못 나감
    ctx.beginPath()
    ctx.rect(0, 0, cssW, cssH)
    ctx.clip()

    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = sizePx

    if (isStart || !lastPos.current) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, sizePx / 2, 0, Math.PI * 2)
      ctx.fillStyle = eraser ? 'rgba(0,0,0,1)' : penColor
      ctx.fill()
    } else {
      ctx.strokeStyle = eraser ? 'rgba(0,0,0,1)' : penColor
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  const handleStart = (e) => {
    if (!active) return
    e.preventDefault()
    e.stopPropagation()
    isDrawing.current = true
    const pos = getPos(e)
    if (!pos) return
    applyStroke(canvasRef.current.getContext('2d'), pos, true)
    lastPos.current = pos
  }

  const handleMove = (e) => {
    if (!isDrawing.current || !active) return
    e.preventDefault()
    const pos = getPos(e)
    if (!pos) return
    applyStroke(canvasRef.current.getContext('2d'), pos)
    lastPos.current = pos
  }

  const handleEnd = () => {
    isDrawing.current = false
    lastPos.current = null
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').globalCompositeOperation = 'source-over'
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: active ? 'auto' : 'none',
        touchAction: active ? 'none' : 'auto',
        cursor: active ? (eraser ? 'cell' : 'crosshair') : 'default',
        zIndex: 2,  // postit img(z:1) 위, object-layer(z:3) 아래
      }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  )
}

// ─── PostItPreview ────────────────────────────────────────────────────────────

function PostItPreview({
  previewRef,
  postitBg,
  textActive,
  textObjects, selectedTextId, editingTextId,
  onCanvasClick, onSelectText, onStartEditText, onEndEditText, onChangeText, onMoveText, onDeleteText,
  penActive, penColor, penSize, eraser, canvasRef,
}) {
  const containerRef = previewRef

  return (
    /*
     * [구조 핵심]
     * rotation-wrapper: transform:rotate만 담당. position/overflow 없음.
     *   → transform이 containing block을 만들지만 자식이 없으므로 무해.
     *
     * postit-wrapper (containerRef): position:relative + overflow:hidden.
     *   transform 없음 → 이 div가 absolute 자식들의 명확한 containing block.
     *   overflow:hidden이 transform 간섭 없이 정상 작동.
     */
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: 'min(75vw, 300px)',
        height: 'min(75vw, 300px)',
        transform: 'rotate(-1.5deg)',
        flexShrink: 0,
        cursor: textActive ? 'text' : 'default',
        outline: textActive ? '2px dashed rgba(59,36,24,0.25)' : 'none',
        outlineOffset: 4,
      }}
      onClick={penActive ? undefined : (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const xPct = ((e.clientX - rect.left) / rect.width) * 100
        const yPct = ((e.clientY - rect.top) / rect.height) * 100
        onCanvasClick(e, { xPct, yPct })
      }}
    >
        {/* ① postit-bg: 정사각형에 꽉 */}
        <img
          src={postitYellow}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            zIndex: 0,
          }}
        />

        {/* ① 배경색 오버레이 — multiply로 포스트잇 색상 적용 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: postitBg,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* ② pen-canvas: z:2, absolute inset:0 */}
        <DrawingCanvas
          active={penActive}
          penColor={penColor}
          penSize={penSize}
          eraser={eraser}
          canvasRef={canvasRef}
          containerRef={containerRef}
        />

        {/* ③ object-layer: z:3, overflow:hidden, 텍스트/스티커 clip */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            zIndex: 3,
            pointerEvents: penActive ? 'none' : 'auto',
          }}
        >
          {textObjects.map((obj) => (
            <TextObject
              key={obj.id}
              obj={obj}
              selected={selectedTextId === obj.id}
              editing={editingTextId === obj.id}
              textToolActive={textActive}
              containerRef={containerRef}
              onSelect={() => onSelectText(obj.id)}
              onStartEdit={() => onStartEditText(obj.id)}
              onEndEdit={onEndEditText}
              onChange={onChangeText}
              onMove={onMoveText}
              onDelete={onDeleteText}
            />
          ))}
        </div>
    </div>
    </div>
  )
}

// ─── PolaroidPreview ──────────────────────────────────────────────────────────

function PolaroidPreview({
  previewRef,
  selectedPhoto, onCaptionChange, onAddPhoto,
  penActive, penColor, penSize, eraser, canvasRef,
  onCanvasClick,
  textObjects, selectedTextId, editingTextId,
  onSelectText, onStartEditText, onEndEditText, onChangeText, onMoveText,
}) {
  const containerRef = previewRef

  return (
    <div
      ref={previewRef}
      style={{
        position: 'relative',
        width: 'min(60vw, 240px)',
        aspectRatio: '2 / 3',
        transform: 'rotate(-1deg)',
        flexShrink: 0,
      }}
      onClick={penActive ? undefined : onCanvasClick}
    >
      {/* 폴라로이드 PNG 프레임 */}
      <img
        src={polaroidBg}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* 사진 영역 — PNG 프레임 안쪽 */}
      <div
        style={{
          position: 'absolute',
          top: '9%',
          left: '9%',
          right: '9%',
          bottom: '22%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {selectedPhoto ? (
          <>
            <img src={selectedPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={onAddPhoto}
              style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(0,0,0,0.4)', color: '#fff',
                border: 'none', borderRadius: 20, padding: '3px 10px',
                fontSize: 11, cursor: 'pointer',
                pointerEvents: penActive ? 'none' : 'auto',
              }}
            >
              변경
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddPhoto() }}
            style={{
              width: '100%', height: '100%', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#A89080', pointerEvents: penActive ? 'none' : 'auto',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E0D5C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPhoto />
            </div>
            <span style={{ fontSize: 12 }}>사진 추가</span>
          </button>
        )}
      </div>

      {/* 하단 캡션+펜+텍스트 영역 — 사진 침범 안 함 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '9%',
          right: '9%',
          height: '22%',
          zIndex: 4,
          overflow: 'hidden',
        }}
      >
        {/* 캡션 텍스트 */}
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onCaptionChange(e.currentTarget.textContent ?? '')}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: "'Nanum Pen Script','Gaegu',cursive",
            fontSize: 16, color: '#2A1A0E', lineHeight: 1.4,
            textAlign: 'center', minHeight: 24,
            outline: 'none', background: 'transparent',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            padding: '8px 4px',
            pointerEvents: penActive ? 'none' : 'auto',
          }}
        />

        {/* 펜 — 하단 영역에만 */}
        <DrawingCanvas
          active={penActive}
          penColor={penColor}
          penSize={penSize}
          eraser={eraser}
          canvasRef={canvasRef}
          containerRef={{ current: null }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 5,
          pointerEvents: penActive ? 'none' : 'auto',
        }}
      >
        {textObjects.map((obj) => (
          <TextObject
            key={obj.id}
            obj={obj}
            selected={selectedTextId === obj.id}
            editing={editingTextId === obj.id}
            containerRef={containerRef}
            onSelect={() => onSelectText(obj.id)}
            onStartEdit={() => onStartEditText(obj.id)}
            onEndEdit={onEndEditText}
            onChange={onChangeText}
            onMove={onMoveText}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Option Panels ────────────────────────────────────────────────────────────

function PhotoPanel({ selectedPhoto, onSelect }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onSelect(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="px-5 pt-4 pb-5">
      <p className="mb-3 text-[12px] font-semibold text-[#6B5A4C]">사진 선택</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* 앨범 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#D4C9BB] bg-[#F8F4EE] text-[#8B7A6B]"
        >
          <span className="text-[26px] leading-none font-light">+</span>
          <span className="text-[10px]">앨범</span>
        </button>
        {/* 선택된 사진 미리보기 */}
        {selectedPhoto && (
          <button
            type="button"
            onClick={() => onSelect(selectedPhoto)}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
            style={{ outline: '3px solid #3B2418', outlineOffset: 2 }}
          >
            <img src={selectedPhoto} alt="" className="h-full w-full object-cover" />
          </button>
        )}
      </div>
    </div>
  )
}

function TextToolPanel({ textColor, onTextColor, fontSize, onFontSize, fontFamily, onFontFamily, textAlign, onTextAlign }) {
  return (
    <div className="px-5 pt-3 pb-5 space-y-3">
      {/* 안내 */}
      <p className="rounded-2xl bg-[#F5EDD5] px-4 py-2.5 text-center text-[13px] font-medium text-[#6B5A4C]">
        포스트잇을 탭하면 그 위치에 바로 입력돼요
      </p>

      {/* 글자색 — 가장 자주 쓰는 옵션 최상단 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">글자색</p>
        <div className="flex gap-2.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onTextColor(c)}
              className="h-9 w-9 rounded-full transition"
              style={{
                backgroundColor: c,
                outline: textColor === c ? '3px solid #3B2418' : '2px solid #E8DDD1',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* 글꼴 — 2열 그리드 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">글꼴</p>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onFontFamily(f.family)}
              className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition ${
                fontFamily === f.family ? 'border-[#3B2418] bg-[#F5EDD5]' : 'border-[#E8DDD1] bg-white'
              }`}
            >
              <span className="text-[20px] text-[#3B2418] leading-none" style={{ fontFamily: f.family }}>안녕</span>
              <span className="text-[11px] text-[#8B7A6B] font-semibold">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 크기 + 정렬 — 한 행 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">크기</p>
          <div className="flex gap-1.5">
            {Object.keys(SIZE_MAP).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onFontSize(SIZE_MAP[s])}
                className={`flex flex-1 items-center justify-center rounded-xl border py-2 text-[13px] font-semibold transition ${
                  fontSize === SIZE_MAP[s] ? 'border-[#3B2418] bg-[#F5EDD5] text-[#3B2418]' : 'border-[#E8DDD1] bg-white text-[#8B7A6B]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">정렬</p>
          <div className="flex gap-1.5">
            {(['left', 'center', 'right']).map((align, i) => (
              <button
                key={align}
                type="button"
                onClick={() => onTextAlign(align)}
                className={`flex flex-1 items-center justify-center rounded-xl border py-2 transition ${
                  textAlign === align ? 'border-[#3B2418] bg-[#F5EDD5]' : 'border-[#E8DDD1] bg-white'
                }`}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <rect x={i === 2 ? 5 : 0} y="0" width={i === 1 ? 18 : 13} height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.3} />
                  <rect x="0" y="5" width="18" height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.3} />
                  <rect x={i === 2 ? 5 : 0} y="10" width={i === 0 ? 11 : i === 1 ? 18 : 13} height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.3} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PenToolPanel({ penColor, onPenColor, penSize, onPenSize, eraser, onEraser, onClear }) {
  const [confirmingClear, setConfirmingClear] = useState(false)

  const handleClearClick = () => {
    if (confirmingClear) {
      onClear()
      setConfirmingClear(false)
    } else {
      setConfirmingClear(true)
      setTimeout(() => setConfirmingClear(false), 2500)
    }
  }

  return (
    <div className="px-5 pt-4 pb-5 space-y-4">
      {/* 색상 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">색상</p>
        <div className="flex gap-2.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onPenColor(c); onEraser(false) }}
              className="h-8 w-8 rounded-full transition"
              style={{
                backgroundColor: c,
                outline: !eraser && penColor === c ? '3px solid #3B2418' : '3px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* 굵기 + 지우개 + 전체 지우기 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">굵기</p>
          <div className="flex gap-1.5">
            {[{ key: 'thin', w: 16, h: 2 }, { key: 'medium', w: 24, h: 4 }, { key: 'thick', w: 30, h: 6 }].map(({ key, w, h }) => (
              <button
                key={key}
                type="button"
                onClick={() => onPenSize(key)}
                className={`flex flex-1 items-center justify-center rounded-xl border py-2.5 transition ${
                  penSize === key ? 'border-[#3B2418] bg-[#F5EDD5]' : 'border-[#E8DDD1] bg-white'
                }`}
              >
                <div className="rounded-full bg-[#3B2418]" style={{ width: w, height: h }} />
              </button>
            ))}
          </div>
        </div>

        {/* 지우개 */}
        <div style={{ minWidth: 64 }}>
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">지우개</p>
          <button
            type="button"
            onClick={() => onEraser((v) => !v)}
            className={`flex h-[42px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-semibold transition ${
              eraser ? 'border-[#3B2418] bg-[#F5EDD5] text-[#3B2418]' : 'border-[#E8DDD1] bg-white text-[#8B7A6B]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16l10-10 7 7-3.5 3.5" /><path d="m6.5 17.5 3-3" />
            </svg>
            지우개
          </button>
        </div>

        {/* 전체 지우기 — 2단계 확인 */}
        <div style={{ minWidth: 64 }}>
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">전체</p>
          <button
            type="button"
            onClick={handleClearClick}
            className={`flex h-[42px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-semibold transition ${
              confirmingClear
                ? 'border-red-300 bg-[#FEE2E2] text-red-500'
                : 'border-[#E8DDD1] bg-white text-[#8B7A6B]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
            </svg>
            {confirmingClear ? '확인?' : '지우기'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DecorToolPanel({ postitBg, onPostitBg, onAddSticker }) {
  const [subTab, setSubTab] = useState('color')

  return (
    <div className="pt-3 pb-5">
      <div className="mb-3 flex gap-1 overflow-x-auto px-5 pb-1">
        {[{ key: 'color', label: '배경색' }, { key: 'tape', label: '테이프' }, { key: 'sticker', label: '스티커' }, { key: 'deco', label: '장식' }].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              subTab === key ? 'bg-[#3B2418] text-white' : 'bg-[#F0EAE0] text-[#8B7A6B]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="px-5">
        {subTab === 'color' && (
          <div className="flex gap-3">
            {POSTIT_BG_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => onPostitBg(c)} className="h-10 w-10 rounded-full transition"
                style={{ backgroundColor: c, outline: postitBg === c ? '3px solid #3B2418' : '3px solid transparent', outlineOffset: 2 }} />
            ))}
          </div>
        )}
        {subTab === 'tape' && (
          <div className="flex gap-2.5">
            {TAPE_COLORS.map((c) => (
              <button key={c} type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD1] bg-white">
                <div className="h-6 w-full rounded-sm opacity-80" style={{ backgroundColor: c }} />
              </button>
            ))}
          </div>
        )}
        {subTab === 'sticker' && (
          <div className="grid grid-cols-6 gap-2">
            {STICKERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAddSticker?.(s)}
                className="flex h-11 items-center justify-center rounded-xl border border-[#EDE5DA] bg-[#F8F4EE] text-[22px] active:bg-[#F0E8DC]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {subTab === 'deco' && (
          <div className="flex flex-wrap gap-2">
            {['✿', '♡', '✦', '◇', '☆', '✱', '❀', '◈'].map((d) => (
              <button key={d} type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#EDE5DA] bg-[#F8F4EE] text-[20px]">{d}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tool Tab Bar ─────────────────────────────────────────────────────────────

function ToolTabBar({ tools, activeTool, onTool }) {
  return (
    <div className="mx-5 flex items-center justify-around bg-white px-4 py-2"
      style={{ borderRadius: 28, boxShadow: '0 2px 20px rgba(59,36,24,0.10)' }}
    >
      {tools.map(({ key, label, Icon }) => {
        const active = activeTool === key
        return (
          <button key={key} type="button" onClick={() => onTool(key)} className="flex flex-col items-center gap-1 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: active ? '#F2EBE0' : 'transparent', color: '#3B2418' }}>
              <Icon />
            </div>
            <span className="text-[12px] transition-colors"
              style={{ color: active ? '#3B2418' : '#A8978A', fontWeight: active ? 600 : 500 }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}


// ─── Main ─────────────────────────────────────────────────────────────────────

function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [type, setType] = useState(location.state?.initialTab === 'polaroid' ? 'polaroid' : 'postit')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [captionText, setCaptionText] = useState('')
  const [editorError, setEditorError] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)

  const tools = type === 'polaroid' ? PHOTO_TOOLS : POSTIT_TOOLS
  const [activeTool, setActiveTool] = useState(null)
  const [penColor, setPenColor] = useState('#2C1A0E')
  const [penSize, setPenSize] = useState('medium')
  const [eraser, setEraser] = useState(false)
  const [postitBg, setPostitBg] = useState('#F5EDD5')
  const postitCanvasRef = useRef(null)
  const polaroidCanvasRef = useRef(null)
  const previewRef = useRef(null)  // 캡처 대상 ref

  const clearCanvas = () => {
    const canvas = (type === 'polaroid' ? polaroidCanvasRef : postitCanvasRef).current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  // 텍스트 오브젝트
  const [textObjects, setTextObjects] = useState([])
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [editingTextId, setEditingTextId] = useState(null)

  // 현재 텍스트 스타일 (패널에서 조작 → 선택된 오브젝트에 반영)
  const [textColor, setTextColor] = useState('#2A1E14')
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("'Nanum Pen Script',cursive")
  const [textAlign, setTextAlign] = useState('left')

  // 선택된 오브젝트 스타일 동기화
  useEffect(() => {
    if (!selectedTextId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTextObjects((prev) =>
      prev.map((o) =>
        o.id === selectedTextId ? { ...o, color: textColor, fontSize, fontFamily, align: textAlign } : o
      )
    )
  }, [textColor, fontSize, fontFamily, textAlign, selectedTextId])

  const createTextId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // 텍스트 버튼 = 패널 열기/닫기 토글만
  const handleTool = (key) => {
    setActiveTool((prev) => {
      if (prev === key) return null
      return key
    })
  }

  // 텍스트 추가 버튼 = 오브젝트 생성 + 텍스트 시트 유지
  const handleAddText = () => {
    const newId = createTextId()
    setTextObjects((prev) => {
      const baseY = type === 'polaroid' ? 88 : 30
      const yPct = Math.min(baseY + prev.length * 20, 78)
      return [...prev, { id: newId, xPct: 50, yPct, text: '', color: textColor, fontSize, fontFamily, align: textAlign }]
    })
    setSelectedTextId(newId)
    setEditingTextId(newId)
    setActiveTool('text')
  }

  const handleDeleteText = (id) => {
    setTextObjects((prev) => prev.filter((o) => o.id !== id))
    setSelectedTextId(null)
    setEditingTextId(null)
  }

  const handleAddSticker = (emoji) => {
    const newId = createTextId()
    setTextObjects((prev) => {
      const yPct = Math.min(40 + prev.length * 18, 75)
      return [...prev, { id: newId, xPct: 50, yPct, text: emoji, color: '#2A1E14', fontSize: 36, fontFamily: 'sans-serif', align: 'center' }]
    })
    setSelectedTextId(newId)
    setEditingTextId(null)
  }

  const handleMoveText = (id, xPct, yPct) => {
    setTextObjects((prev) => prev.map((o) => (o.id === id ? { ...o, xPct, yPct } : o)))
  }
  const handleChangeText = (id, text) => {
    setTextObjects((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)))
  }
  const handleSelectText = (id) => {
    setSelectedTextId(id)
    setEditingTextId(null)
    // 선택된 오브젝트의 스타일을 패널에 반영
    const obj = textObjects.find((o) => o.id === id)
    if (obj) {
      if (obj.color) setTextColor(obj.color)
      if (obj.fontSize) setFontSize(obj.fontSize)
      if (obj.fontFamily) setFontFamily(obj.fontFamily)
      if (obj.align) setTextAlign(obj.align)
    }
    // 텍스트 선택 = 텍스트 시트 열기 유지
    setActiveTool('text')
  }
  const handleStartEditText = (id) => {
    setSelectedTextId(id)
    setEditingTextId(id)
  }
  const handleEndEditText = () => setEditingTextId(null)

  // postit-wrapper 내부 빈 영역 클릭: 선택만 해제, 시트는 유지
  const handleCanvasClick = (e, position) => {
    e.stopPropagation()
    if (activeTool === 'text' && position) {
      // 이미 선택된 텍스트가 있으면 → 선택 해제만 (새 텍스트 생성 안 함)
      if (selectedTextId) {
        setSelectedTextId(null)
        setEditingTextId(null)
        return
      }
      // 선택된 것 없으면 → 탭한 위치에 새 텍스트 생성
      const newId = createTextId()
      setTextObjects((prev) => [
        ...prev,
        {
          id: newId,
          xPct: Math.round(position.xPct),
          yPct: Math.round(position.yPct),
          text: '',
          color: textColor,
          fontSize,
          fontFamily,
          align: textAlign,
        },
      ])
      setSelectedTextId(newId)
      setEditingTextId(newId)
      return
    }
    setSelectedTextId(null)
    setEditingTextId(null)
  }

  const handleComplete = async () => {
    if (isCompleting) return
    const baseId = Date.now()
    setEditorError('')
    setIsCompleting(true)

    setSelectedTextId(null)
    setEditingTextId(null)
    await new Promise((r) => setTimeout(r, 80))

    const loadImageAsBlob = (src) => new Promise((resolve, reject) => {
      fetch(src)
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
          img.onerror = reject
          img.src = url
        })
        .catch(reject)
    })

    let capturedImage
    try {
      if (type === 'postit') {
        // 포스트잇: 600x600 캔버스에 PNG + 펜 + 텍스트 합성
        const SIZE = 600
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')

        const bgImg = await loadImageAsBlob(postitYellow)
        const srcSize = Math.min(bgImg.naturalWidth, bgImg.naturalHeight)
        ctx.drawImage(bgImg, 0, 0, srcSize, srcSize, 0, 0, SIZE, SIZE)

        // 배경색 multiply 적용
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = postitBg
        ctx.fillRect(0, 0, SIZE, SIZE)
        ctx.globalCompositeOperation = 'source-over'

        const drawingCanvas = postitCanvasRef.current
        if (drawingCanvas?.width > 0) {
          ctx.drawImage(drawingCanvas, 0, 0, SIZE, SIZE)
        }

        drawTextObjects(ctx, textObjects, SIZE, SIZE, { baseWidth: 300 })

        capturedImage = canvas.toDataURL('image/png')

      } else {
        // 폴라로이드: 400x600 캔버스에 프레임 + 사진 + 캡션 합성
        const W = 400, H = 600
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')

        // 사진 먼저 그리기 (프레임 안쪽 영역)
        if (selectedPhoto) {
          const photoImg = await loadImageAsBlob(selectedPhoto).catch(() => null)
          if (photoImg) {
            const px = W * 0.09, py = H * 0.09
            const pw = W * 0.82, ph = H * 0.69
            ctx.save()
            ctx.rect(px, py, pw, ph)
            ctx.clip()
            ctx.drawImage(photoImg, px, py, pw, ph)
            ctx.restore()
          }
        }

        // 폴라로이드 프레임 PNG 위에 덮기
        const frameImg = await loadImageAsBlob(polaroidBg)
        ctx.drawImage(frameImg, 0, 0, W, H)

        // 캡션
        if (captionText) {
          ctx.save()
          ctx.font = `${20}px 'Nanum Pen Script', cursive`
          ctx.fillStyle = '#2A1A0E'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(captionText, W / 2, H * 0.92)
          ctx.restore()
        }

        drawTextObjects(ctx, textObjects, W, H, { baseWidth: 240 })

        capturedImage = canvas.toDataURL('image/png')
      }
    } catch {
      setEditorError('흔적 이미지를 준비하지 못했습니다. 다시 시도해주세요.')
      setIsCompleting(false)
      return
    }

    navigate(`/board/${boardId}`, {
      state: {
        placementDraft: {
          id: `${type}-${baseId}`,
          type,
          capturedImage,
          content: type === 'polaroid'
            ? [captionText, ...textObjects.map((o) => o.text)].filter(Boolean).join('\n')
            : textObjects.map((o) => o.text).join('\n'),
          media: type === 'polaroid' ? { image: selectedPhoto ?? '', dateLabel: today() } : undefined,
          style: type === 'polaroid'
            ? { color: textColor, fontSize, fontFamily }
            : { paperColor: postitBg, textColor, fontSize, fontFamily, align: textAlign },
          createdAt: new Date().toISOString(),
        },
      },
    })
    setIsCompleting(false)
  }

  const renderPanelContent = () => {
    if (activeTool === 'photo') return (
      <PhotoPanel
        selectedPhoto={selectedPhoto}
        onSelect={(photo) => { setSelectedPhoto(photo); setActiveTool(null) }}
      />
    )
    if (activeTool === 'text') return (
      <TextToolPanel
        textColor={textColor} onTextColor={setTextColor}
        fontSize={fontSize} onFontSize={setFontSize}
        fontFamily={fontFamily} onFontFamily={setFontFamily}
        textAlign={textAlign} onTextAlign={setTextAlign}
        onAddText={handleAddText}
      />
    )
    if (activeTool === 'pen') return (
      <PenToolPanel
        penColor={penColor} onPenColor={setPenColor}
        penSize={penSize} onPenSize={setPenSize}
        eraser={eraser} onEraser={setEraser}
        onClear={clearCanvas}
      />
    )
    if (activeTool === 'decor') return <DecorToolPanel postitBg={postitBg} onPostitBg={setPostitBg} onAddSticker={handleAddSticker} />
    return null
  }

  const renderPanel = () => {
    if (!activeTool) return null
    const PANEL_LABELS = { text: '텍스트', pen: '펜', decor: '꾸미기', photo: '사진' }
    return (
      <div>
        {/* 패널 헤더: 제목 + 닫기 버튼 */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[13px] font-semibold text-[#3B2418]">
            {PANEL_LABELS[activeTool] ?? ''}
          </span>
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0EAE0] text-[#6B5A4C] transition active:bg-[#E0D5C8]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {renderPanelContent()}
      </div>
    )
  }

  const panelOpen = activeTool !== null

  return (
    <motion.main
      className="app-device"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── 배경 이미지 (z:0) ── */}
      <img
        src={bgImage}
        aria-hidden
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
      />
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 1, pointerEvents: 'none' }} />

      {/* ── header-area (flex:none, z:10) ── */}
      <header
        style={{
          flex: 'none',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '16px 16px 8px',
          padding: '10px 16px',
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(59,36,24,0.08)',
        }}
      >
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-[#3B2418]">
          <X size={22} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E' }}>흔적 남기기</span>
        <button
          type="button"
          onClick={handleComplete}
          disabled={isCompleting || (type === 'polaroid' && !selectedPhoto)}
          style={{
            borderRadius: 999,
            backgroundColor: (isCompleting || (type === 'polaroid' && !selectedPhoto)) ? '#C0B0A0' : '#2C1A0E',
            padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff',
            cursor: (isCompleting || (type === 'polaroid' && !selectedPhoto)) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: 1,
          }}
        >
          {isCompleting && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
          {isCompleting ? '저장 중' : '남기기'}
        </button>
      </header>

      {/* ── tab-area (flex:none, z:10) ── */}
      <div
        style={{
          flex: 'none',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          margin: '0 16px 8px',
          padding: 4,
          borderRadius: 18,
          backgroundColor: 'rgba(235,228,218,0.85)',
        }}
      >
        {[{ key: 'postit', label: '포스트잇' }, { key: 'polaroid', label: '포토카드' }].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setType(key); setActiveTool(null); setSelectedTextId(null); setEditingTextId(null); setTextObjects([]) }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor: type === key ? '#fff' : 'transparent',
              color: type === key ? '#2C1A0E' : '#9B8A7B',
              boxShadow: type === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {editorError ? (
        <p
          style={{
            position: 'relative',
            zIndex: 10,
            margin: '0 16px 8px',
            borderRadius: 12,
            backgroundColor: '#FFF7F2',
            padding: '10px 12px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#A74831',
          }}
        >
          {editorError}
        </p>
      ) : null}

      {/* ── canvas-area: 빈 영역 클릭 시만 시트 닫기 ── */}
      <div
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', zIndex: 2 }}
        onClick={() => {
          // postit-wrapper 내부 클릭은 stopPropagation으로 여기까지 안 옴
          // 여기 오면 = 캔버스 빈 영역 클릭
          setSelectedTextId(null)
          setEditingTextId(null)
          setActiveTool(null)
        }}
      >
        {/* 종이 질감 */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(160,140,120,0.05) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* 포스트잇/폴라로이드 중앙 배치
            옵션 시트가 열릴 때 paddingBottom을 시트 높이만큼 줘서 포스트잇이 가려지지 않게 */}
        <motion.div
          animate={{ paddingBottom: panelOpen ? 300 : 20 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {type === 'polaroid' ? (
            <PolaroidPreview
              previewRef={previewRef}
              selectedPhoto={selectedPhoto}
              captionText={captionText}
              onCaptionChange={setCaptionText}
              onAddPhoto={() => setActiveTool('photo')}
              penActive={activeTool === 'pen'}
              penColor={penColor}
              penSize={penSize}
              eraser={eraser}
              canvasRef={polaroidCanvasRef}
              textObjects={textObjects}
              selectedTextId={selectedTextId}
              editingTextId={editingTextId}
              onSelectText={handleSelectText}
              onStartEditText={handleStartEditText}
              onEndEditText={handleEndEditText}
              onChangeText={handleChangeText}
              onMoveText={handleMoveText}
              onCanvasClick={handleCanvasClick}
            />
          ) : (
            <PostItPreview
              previewRef={previewRef}
              postitBg={postitBg}
              textActive={activeTool === 'text'}
              textObjects={textObjects}
              selectedTextId={selectedTextId}
              editingTextId={editingTextId}
              onCanvasClick={handleCanvasClick}
              onSelectText={handleSelectText}
              onStartEditText={handleStartEditText}
              onEndEditText={handleEndEditText}
              onChangeText={handleChangeText}
              onMoveText={handleMoveText}
              onDeleteText={handleDeleteText}
              penActive={activeTool === 'pen'}
              penColor={penColor}
              penSize={penSize}
              eraser={eraser}
              canvasRef={postitCanvasRef}
            />
          )}
        </motion.div>
      </div>

      {/* ── bottom-area (flex:none, relative, z:20) ── */}
      <div
        style={{ flex: 'none', position: 'relative', zIndex: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 옵션 패널 — absolute overlay, 레이아웃 안 밀어냄 */}
        <motion.div
          initial={false}
          animate={{ y: panelOpen ? 0 : '100%', opacity: panelOpen ? 1 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            maxHeight: 300,
            overflowY: 'auto',
            backgroundColor: '#fff',
            borderTop: '1px solid #EDE5DA',
            boxShadow: '0 -4px 20px rgba(59,36,24,0.08)',
            zIndex: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderPanel()}
        </motion.div>

        {/* 툴바 — 항상 보임 */}
        <div
          style={{
            paddingTop: 12,
            paddingBottom: 24,
            backgroundColor: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(59,36,24,0.07)',
          }}
        >
          <ToolTabBar tools={tools} activeTool={activeTool} onTool={handleTool} />
        </div>
      </div>
    </motion.main>
  )
}

export default PostItEditor
