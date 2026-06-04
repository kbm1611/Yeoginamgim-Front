import { motion } from 'framer-motion'
import postitYellow from '../assets/postit/postit.png'
import bgImage from '../assets/배경.png'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
]

const PEN_COLORS = ['#2C1A0E', '#6B3A2A', '#B09070', '#E89090', '#F5C842', '#4D96FF', '#6BCB77']
const TEXT_COLORS = ['#2C1A0E', '#5C3D2E', '#8B5E3C', '#C9843A', '#4D96FF', '#E89090', '#6BCB77']
const POSTIT_BG_COLORS = ['#F5EDD5', '#F5D5D5', '#D5EDD5', '#D5E5F5', '#E8D5F5', '#F5E0D0']
const STICKERS = ['🌸', '💗', '⭐', '🌙', '🍀', '🎀', '🦋', '🌈', '☀️', '🌊', '🍃', '✨']
const TAPE_COLORS = ['#C9D6C6', '#D4B896', '#B8C9D6', '#D6B8C9', '#C6D4B8', '#D6C9B8']

const FONTS = [
  { label: '손글씨', family: "'Nanum Pen Script',cursive" },
  { label: '고딕',   family: 'sans-serif' },
  { label: '명조',   family: 'serif' },
  { label: '둥근체', family: "'Nanum Gothic',sans-serif" },
]


const SIZE_MAP = { S: 18, M: 24, L: 32 }

function today() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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

// 포토카드 모드 툴 (사진 추가됨)
const PHOTO_TOOLS = [
  { key: 'photo', label: '사진',   Icon: IconPhoto },
  { key: 'text',  label: '텍스트', Icon: IconText },
  { key: 'pen',   label: '펜',     Icon: IconPen },
  { key: 'decor', label: '꾸미기', Icon: IconDecor },
]

// ─── TextObject ───────────────────────────────────────────────────────────────

function TextObject({ obj, selected, editing, containerRef, onSelect, onStartEdit, onEndEdit, onChange, onMove }) {
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
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit() }}
    >
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
  textObjects, selectedTextId, editingTextId,
  onCanvasClick, onSelectText, onStartEditText, onEndEditText, onChangeText, onMoveText,
  penActive, penColor, penSize, eraser, canvasRef,
}) {
  const containerRef = useRef(null)

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
    <div style={{ transform: 'rotate(-1.5deg)' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '92%',
        }}
        onClick={penActive ? undefined : onCanvasClick}
      >
        {/* ① postit-bg: flow에 놔서 컨테이너 높이를 자연스럽게 결정 */}
        <img
          src={postitYellow}
          alt=""
          draggable={false}
          style={{ display: 'block', width: '100%', mixBlendMode: 'multiply' }}
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
    </div>
  )
}

// ─── PolaroidPreview ──────────────────────────────────────────────────────────

function PolaroidPreview({
  selectedPhoto, captionText, onCaptionChange, onAddPhoto,
  penActive, penColor, penSize, eraser, canvasRef,
  textObjects, selectedTextId, editingTextId,
  onSelectText, onStartEditText, onEndEditText, onChangeText, onMoveText, onCanvasClick,
}) {
  const containerRef = useRef(null)

  const PHOTO_H = 214

  return (
    <div style={{ transform: 'rotate(-1deg)' }}>
      <div
        ref={containerRef}
        className="relative bg-white"
        style={{
          width: 250,
          padding: '12px 12px 56px',
          borderRadius: 4,
          boxShadow: '0 10px 36px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}
        onClick={penActive ? undefined : onCanvasClick}
      >
        {/* ① 사진 영역 — z-index:2 (펜 캔버스 위) */}
        <div
          className="relative overflow-hidden"
          style={{ height: PHOTO_H, borderRadius: 2, backgroundColor: '#EEE7DC', zIndex: 2, position: 'relative' }}
        >
          {selectedPhoto ? (
            <>
              <img src={selectedPhoto} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={onAddPhoto}
                className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                style={{ pointerEvents: penActive ? 'none' : 'auto', zIndex: 10 }}
              >
                변경
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddPhoto() }}
              className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-[#A89080]"
              style={{ pointerEvents: penActive ? 'none' : 'auto' }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E0D5C8]">
                <IconPhoto />
              </div>
              <span className="text-[13px] font-medium">사진 추가</span>
            </button>
          )}
        </div>

        {/* ② 캡션 영역 */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-4 pb-4 pt-2"
          style={{ pointerEvents: penActive ? 'none' : 'auto', zIndex: 3 }}
        >
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onCaptionChange(e.currentTarget.textContent ?? '')}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: "'Nanum Pen Script','Gaegu',cursive",
              fontSize: 20, color: '#2A1A0E', lineHeight: 1.5,
              textAlign: 'center', minWidth: 60, minHeight: 28,
              outline: 'none', background: 'transparent',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {captionText || null}
          </div>
        </div>

        {/* ③ 펜 드로잉 캔버스 — z:1, 사진(z:2) 아래에 그려져 흰 영역에만 보임 */}
        <DrawingCanvas
          active={penActive}
          penColor={penColor}
          penSize={penSize}
          eraser={eraser}
          canvasRef={canvasRef}
          containerRef={containerRef}
        />

        {/* ④ TextObject — containerRef에 직접 배치 */}
        {(textObjects ?? []).map((obj) => (
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
            penActive={penActive}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Option Panels ────────────────────────────────────────────────────────────

function PhotoPanel({ selectedPhoto, onSelect }) {
  return (
    <div className="px-5 pt-4 pb-5">
      <p className="mb-3 text-[12px] font-semibold text-[#6B5A4C]">사진 선택</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* 앨범 버튼 */}
        <button
          type="button"
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#D4C9BB] bg-[#F8F4EE] text-[#8B7A6B]"
        >
          <span className="text-[26px] leading-none font-light">+</span>
          <span className="text-[10px]">앨범</span>
        </button>
        {/* 목 사진 썸네일 */}
        {MOCK_PHOTOS.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(photo)}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition"
            style={{
              outline: selectedPhoto === photo ? '3px solid #3B2418' : '3px solid transparent',
              outlineOffset: 2,
            }}
          >
            <img src={photo} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function TextToolPanel({ textColor, onTextColor, fontSize, onFontSize, fontFamily, onFontFamily, textAlign, onTextAlign, onAddText }) {
  return (
    <div className="px-5 pt-2 pb-5 space-y-4">
      {/* 텍스트 추가 버튼 */}
      <button
        type="button"
        onClick={onAddText}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-bold text-white transition active:opacity-80"
        style={{ backgroundColor: '#2C1A0E' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        텍스트 추가
      </button>
      {/* 글꼴 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">글꼴</p>
        <div className="flex gap-2">
          {FONTS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onFontFamily(f.family)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border py-2.5 transition ${
                fontFamily === f.family ? 'border-[#3B2418] bg-[#F5EDD5]' : 'border-[#E8DDD1] bg-white'
              }`}
            >
              <span className="text-[16px] text-[#3B2418]" style={{ fontFamily: f.family }}>가</span>
              <span className="text-[10px] text-[#8B7A6B]">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 크기 + 정렬 */}
      <div className="flex gap-4">
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
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                  <rect x={i === 2 ? 4 : 0} y="0" width={i === 1 ? 16 : 12} height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.35} />
                  <rect x="0" y="5" width="16" height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.35} />
                  <rect x={i === 2 ? 4 : 0} y="10" width={i === 0 ? 10 : i === 1 ? 16 : 12} height="2" rx="1" fill="#3B2418" opacity={textAlign === align ? 1 : 0.35} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 글자색 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">글자색</p>
        <div className="flex gap-2.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onTextColor(c)}
              className="h-8 w-8 rounded-full transition"
              style={{
                backgroundColor: c,
                outline: textColor === c ? '3px solid #3B2418' : '3px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PenToolPanel({ penColor, onPenColor, penSize, onPenSize, eraser, onEraser, onClear }) {
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

        {/* 전체 지우기 */}
        <div style={{ minWidth: 64 }}>
          <p className="mb-2 text-[12px] font-semibold text-[#6B5A4C]">전체</p>
          <button
            type="button"
            onClick={onClear}
            className="flex h-[42px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-[#E8DDD1] bg-white text-[11px] font-semibold text-[#8B7A6B] transition active:bg-[#FEE2E2] active:border-red-300 active:text-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
            </svg>
            지우기
          </button>
        </div>
      </div>
    </div>
  )
}

function DecorToolPanel({ postitBg, onPostitBg }) {
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
              <button key={s} type="button" className="flex h-11 items-center justify-center rounded-xl border border-[#EDE5DA] bg-[#F8F4EE] text-[22px]">{s}</button>
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

  const [type, setType] = useState(location.state?.initialTab === 'postit' ? 'postit' : 'polaroid')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [captionText, setCaptionText] = useState('')

  const tools = type === 'polaroid' ? PHOTO_TOOLS : POSTIT_TOOLS
  const [activeTool, setActiveTool] = useState(null)
  const [penColor, setPenColor] = useState('#2C1A0E')
  const [penSize, setPenSize] = useState('medium')
  const [eraser, setEraser] = useState(false)
  const [postitBg, setPostitBg] = useState('#F5EDD5')
  const postitCanvasRef = useRef(null)
  const polaroidCanvasRef = useRef(null)

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

  // 텍스트 버튼 = 패널 열기/닫기 토글
  const handleTool = (key) => {
    setActiveTool((prev) => (prev === key ? null : key))
  }

  // 텍스트 추가 버튼 = 오브젝트 생성 + 텍스트 시트 유지
  const handleAddText = () => {
    const newId = Date.now()
    // polaroid: 사진 아래 캡션 영역(약 85% 지점), postit: 중앙
    const yPct = type === 'polaroid' ? 86 : 45
    setTextObjects((prev) => [
      ...prev,
      { id: newId, xPct: 50, yPct, text: '', color: textColor, fontSize, fontFamily, align: textAlign },
    ])
    setSelectedTextId(newId)
    setEditingTextId(newId)
    setActiveTool('text')
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
  const handleCanvasClick = (e) => {
    e.stopPropagation()  // canvas-area까지 버블링 방지
    setSelectedTextId(null)
    setEditingTextId(null)
  }

  const handleComplete = () => {
    const baseId = Date.now()
    const content = textObjects.map((o) => o.text).join('\n')

    console.log('📝 남기기 클릭:', {
      textObjects: textObjects.map(o => ({ id: o.id, text: o.text })),
      content,
      type,
    })

    navigate(`/board/${boardId}`, {
      state: {
        placementDraft:
          type === 'polaroid'
            ? {
                id: `polaroid-${baseId}`,
                type: 'polaroid',
                content: captionText,
                media: { image: selectedPhoto ?? MOCK_PHOTOS[0], dateLabel: today() },
                style: { color: textColor, fontSize, fontFamily },
                createdAt: new Date().toISOString(),
              }
            : {
                id: `postit-${baseId}`,
                type: 'postit',
                content,
                style: {
                  paperColor: postitBg,
                  textColor,
                  fontSize,
                  fontFamily,
                  align: textAlign,
                },
                createdAt: new Date().toISOString(),
              },
      },
    })
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
    if (activeTool === 'decor') return <DecorToolPanel postitBg={postitBg} onPostitBg={setPostitBg} />
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
          style={{ borderRadius: 999, backgroundColor: '#2C1A0E', padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff' }}
        >
          남기기
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
            onClick={() => { setType(key); setActiveTool(null); setSelectedTextId(null); setEditingTextId(null) }}
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
          animate={{ paddingBottom: panelOpen ? 220 : 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '12px 20px',
            paddingBottom: 12,
          }}
        >
          {type === 'polaroid' ? (
            <PolaroidPreview
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
              textObjects={textObjects}
              selectedTextId={selectedTextId}
              editingTextId={editingTextId}
              onCanvasClick={handleCanvasClick}
              onSelectText={handleSelectText}
              onStartEditText={handleStartEditText}
              onEndEditText={handleEndEditText}
              onChangeText={handleChangeText}
              onMoveText={handleMoveText}
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
            maxHeight: 220,
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
