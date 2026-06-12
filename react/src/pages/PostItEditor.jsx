import { AnimatePresence, motion } from 'framer-motion'
import { Camera, RotateCcw, X } from 'lucide-react'
import { getStroke } from 'perfect-freehand'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import postitTexture from '../assets/editor/33dab845-d565-4111-b90b-9d2382288463.png'
import bgImage from '../assets/배경.png'
import postitYellowAsset from '../assets/images/postits/postit-yellow.png'


// ─── 상수 ────────────────────────────────────────────────────────────────────

const POSTIT_COLORS = [
  { id: 'yellow', color: '#F7E58A', asset: postitYellowAsset },
  { id: 'pink',   color: '#F6ABBE', asset: null },
  { id: 'sky',    color: '#A8D8F0', asset: null },
  { id: 'green',  color: '#B8E0A0', asset: null },
  { id: 'cream',  color: '#FFF0CC', asset: null },
  { id: 'purple', color: '#D4B8F0', asset: null },
]

const FONTS = [
  { id: 'pretendard', label: '기본',   family: "'Pretendard', sans-serif" },
  { id: 'yiseoyun',   label: '손글씨', family: "'YiSeoYun', cursive" },
]

const TEXT_COLORS = ['#1A1A1A', '#FFFFFF', '#C0392B', '#2D9CDB', '#27AE60', '#F39C12', '#9B59B6', '#F6ABBE']
const PEN_COLORS  = ['#1A1A1A', '#FFFFFF', '#C0392B', '#2D9CDB', '#27AE60', '#F39C12', '#9B59B6']

const TOOL = { NONE: 'none', TEXT: 'text', PEN: 'pen', COLOR: 'color' }
const PEN_TYPE = { NORMAL: 'normal', HIGHLIGHT: 'highlight', ERASER: 'eraser' }

const FREEHAND_OPT = {
  thinning: 0.5, smoothing: 0.6, streamline: 0.5, simulatePressure: true,
  start: { taper: 3, cap: true }, end: { taper: 3, cap: true },
}
const HIGHLIGHT_OPT = {
  thinning: 0, smoothing: 0.6, streamline: 0.5, simulatePressure: false,
  start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
}

const POSTIT_ASPECT = 1        // 1:1 정사각형
const POLAROID_ASPECT = 3 / 4  // 3:4

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function outlineToPath(pts) {
  if (!pts.length) return ''
  const [f, ...r] = pts
  return [`M ${f[0].toFixed(2)} ${f[1].toFixed(2)}`, ...r.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`), 'Z'].join(' ')
}

function getOutline(points, size, isHL) {
  return getStroke(
    points.map(p => [p.x * 100, p.y * 100, p.pressure ?? 0.5]),
    { ...(isHL ? HIGHLIGHT_OPT : FREEHAND_OPT), size: size * 0.5 },
  )
}

function pointFromEvent(e, ref) {
  const rect = ref.current?.getBoundingClientRect()
  if (!rect) return null
  const src = e.touches?.[0] ?? e
  return {
    x: clamp((src.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((src.clientY - rect.top) / rect.height, 0, 1),
  }
}

function isInsideCard(e, ref) {
  const rect = ref.current?.getBoundingClientRect()
  if (!rect) return false
  const src = e.touches?.[0] ?? e
  return (
    src.clientX >= rect.left && src.clientX <= rect.right &&
    src.clientY >= rect.top  && src.clientY <= rect.bottom
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx, text, maxWidth) {
  const lines = []
  for (const para of String(text ?? '').split('\n')) {
    let line = ''
    for (const char of Array.from(para)) {
      const next = line + char
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = char }
      else line = next
    }
    lines.push(line)
  }
  return lines
}

// ─── 펜 SVG 레이어 ────────────────────────────────────────────────────────────

function StrokeLayer({ strokes, activeStroke }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {[...strokes, ...(activeStroke ? [activeStroke] : [])].map(s => {
        const isHL = s.penType === PEN_TYPE.HIGHLIGHT
        const outline = getOutline(s.points, s.size, isHL)
        return (
          <path
            key={s.id}
            d={outlineToPath(outline)}
            fill={s.color}
            fillOpacity={isHL ? 0.38 : 1}
            stroke="none"
          />
        )
      })}
    </svg>
  )
}


// ─── 선택된 텍스트 — corner handle로 크기+회전 ────────────────────────────────
// 우하단 핸들 드래그 → 텍스트 중심 기준 각도/거리 계산해서 scale+rotate 동시 조절

function TextWithHandles({ obj, cardRef, onUpdate, onEdit, onDelete }) {
  const dragRef = useRef(null)
  const clickRef = useRef({ count: 0, timer: null })

  // 텍스트 자체 드래그 (이동)
  const handleTextDown = e => {
    e.stopPropagation()
    e.preventDefault()

    clickRef.current.count += 1
    if (clickRef.current.timer) clearTimeout(clickRef.current.timer)
    clickRef.current.timer = setTimeout(() => { clickRef.current.count = 0 }, 300)
    if (clickRef.current.count >= 2) {
      clickRef.current.count = 0
      onEdit(obj.id)
      return
    }

    const src = e.touches?.[0] ?? e
    dragRef.current = { startX: src.clientX, startY: src.clientY, origX: obj.x, origY: obj.y }

    const onMove = me => {
      if (!dragRef.current) return
      me.preventDefault()
      const cur = me.touches?.[0] ?? me
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      onUpdate(obj.id, {
        x: clamp(dragRef.current.origX + (cur.clientX - dragRef.current.startX) / rect.width, 0.08, 0.88),
        y: clamp(dragRef.current.origY + (cur.clientY - dragRef.current.startY) / rect.height, 0.08, 0.88),
      })
    }
    const onEnd = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  // 우하단 핸들 드래그 (크기 + 회전)
  const handleCornerDown = e => {
    e.stopPropagation()
    e.preventDefault()
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const src = e.touches?.[0] ?? e
    const cx = rect.left + obj.x * rect.width
    const cy = rect.top + obj.y * rect.height
    const initDist = Math.hypot(src.clientX - cx, src.clientY - cy)
    const initAngle = Math.atan2(src.clientY - cy, src.clientX - cx) * (180 / Math.PI)
    const origFontSize = obj.fontSize
    const origRotate = obj.rotate

    const onMove = me => {
      me.preventDefault()
      const cur = me.touches?.[0] ?? me
      const dist = Math.hypot(cur.clientX - cx, cur.clientY - cy)
      const angle = Math.atan2(cur.clientY - cy, cur.clientX - cx) * (180 / Math.PI)
      onUpdate(obj.id, {
        fontSize: clamp(Math.round(origFontSize * (dist / Math.max(initDist, 1))), 8, 72),
        rotate: origRotate + (angle - initAngle),
      })
    }
    const onEnd = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${obj.x * 100}%`,
        top: `${obj.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${obj.rotate}deg)`,
        transformOrigin: 'center',
        zIndex: 10,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* 텍스트 본체 */}
      <div
        onMouseDown={handleTextDown}
        onTouchStart={handleTextDown}
        style={{
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          color: obj.color,
          fontWeight: 600,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textAlign: 'center',
          maxWidth: '200px',
          lineHeight: 1.35,
          cursor: 'grab',
          outline: '2px dashed rgba(255,255,255,0.7)',
          outlineOffset: 6,
          borderRadius: 4,
          padding: '2px 4px',
        }}
      >
        {obj.text}
      </div>

      {/* 삭제 버튼 — 좌상단 */}
      <button
        type="button"
        onMouseDown={e => { e.stopPropagation(); onDelete(obj.id) }}
        onTouchStart={e => { e.stopPropagation(); onDelete(obj.id) }}
        className="absolute flex items-center justify-center rounded-full bg-black/70 text-white"
        style={{ width: 22, height: 22, top: -11, left: -11, fontSize: 13, lineHeight: 1 }}
      >
        ×
      </button>

      {/* 크기+회전 핸들 — 우하단 */}
      <div
        onMouseDown={handleCornerDown}
        onTouchStart={handleCornerDown}
        className="absolute flex items-center justify-center rounded-full bg-white shadow-md"
        style={{ width: 22, height: 22, bottom: -11, right: -11, cursor: 'se-resize', touchAction: 'none' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 8 L8 2 M5 8 L8 5 M8 2 L8 8 L2 8" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

// ─── 카드 위 텍스트 직접 입력 ─────────────────────────────────────────────────
// 카드가 그대로 보이는 상태에서 카드 위에 textarea가 투명하게 올라옴

function CardTextEditor({ initialText, fontIndex, onFontChange, textColor, onColorChange, onConfirm, onCancel }) {
  const [text, setText] = useState(initialText ?? '')
  const taRef = useRef(null)
  const font = FONTS[fontIndex]

  useEffect(() => {
    setTimeout(() => {
      taRef.current?.focus()
      const len = taRef.current?.value.length ?? 0
      taRef.current?.setSelectionRange(len, len)
    }, 60)
  }, [])

  // textarea 높이 자동 조절
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  return (
    <div className="absolute inset-0 z-50 flex flex-col pointer-events-auto">

      {/* ── 상단: 폰트바 (헤더 높이만큼 padding) ── */}
      <div className="pointer-events-auto flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar bg-black/45 px-4 pb-3 backdrop-blur-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
        {FONTS.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFontChange(i)}
            className="shrink-0 rounded-full px-3 py-1.5 transition-all"
            style={{
              fontFamily: f.family,
              fontSize: 15,
              backgroundColor: fontIndex === i ? 'white' : 'rgba(255,255,255,0.12)',
              color: fontIndex === i ? '#1A1A1A' : 'rgba(255,255,255,0.9)',
              border: fontIndex === i ? 'none' : '1px solid rgba(255,255,255,0.2)',
            }}
          >
            가나다
          </button>
        ))}
      </div>

      {/* ── 중앙: 카드 위 textarea (카드를 덮지 않도록 투명) ── */}
      <div className="flex flex-1 items-center justify-center" onClick={() => onConfirm(text)}>
        <div
          className="relative flex items-center justify-center"
          style={{ width: 'min(78vw, 320px)', aspectRatio: '1 / 1' }}
          onClick={e => e.stopPropagation()}
        >
          <textarea
            ref={taRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { onCancel(); return }
            }}
            placeholder="탭해서 입력..."
            maxLength={200}
            rows={1}
            className="card-text-input w-[88%] resize-none bg-transparent text-center outline-none"
            style={{
              fontFamily: font.family,
              fontSize: 24,
              color: textColor,
              lineHeight: 1.5,
              caretColor: textColor,
              overflowY: 'hidden',
            }}
          />
        </div>
      </div>

      {/* ── 하단: 색상 팔레트 ── */}
      <div className="pointer-events-auto flex items-center justify-center gap-2.5 bg-black/45 px-4 py-4 backdrop-blur-sm">
        {TEXT_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c)}
            className="h-7 w-7 rounded-full transition-transform active:scale-90"
            style={{
              backgroundColor: c,
              outline: textColor === c ? '2.5px solid white' : '1.5px solid rgba(255,255,255,0.3)',
              outlineOffset: 2,
              boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
            }}
          />
        ))}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} className="pointer-events-auto bg-black/45" />
    </div>
  )
}


// ─── 하단 툴바 옵션들 ─────────────────────────────────────────────────────────

function TextToolOptions({ fontIndex, textColor, onCycleFont, onColor }) {
  return (
    <motion.div
      key="text-opt"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3 px-5 pt-4 pb-2"
    >
      {/* 폰트 순환 버튼 */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onCycleFont}
          className="rounded-full border border-white/30 bg-white/10 px-6 py-2 text-[14px] font-bold text-white backdrop-blur-sm"
          style={{ fontFamily: FONTS[fontIndex].family }}
        >
          {FONTS[fontIndex].label}  →  탭해서 변경
        </button>
      </div>
      {/* 색상 팔레트 */}
      <div className="flex items-center justify-center gap-2.5">
        {TEXT_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onColor(c)}
            className="h-7 w-7 rounded-full transition-transform active:scale-90"
            style={{
              backgroundColor: c,
              outline: textColor === c ? '2.5px solid white' : '1px solid rgba(255,255,255,0.3)',
              outlineOffset: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function PenToolOptions({ penStyle, onPenStyle, onUndo, canUndo }) {
  return (
    <motion.div
      key="pen-opt"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3 px-5 pt-4 pb-2"
    >
      {/* 펜 종류 + undo */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[
            { type: PEN_TYPE.NORMAL,    label: '펜' },
            { type: PEN_TYPE.HIGHLIGHT, label: '형광펜' },
            { type: PEN_TYPE.ERASER,    label: '지우개' },
          ].map(p => (
            <button
              key={p.type}
              type="button"
              onClick={() => onPenStyle({ penType: p.type })}
              className="rounded-full px-4 py-1.5 text-[12px] font-bold transition-all"
              style={{
                backgroundColor: penStyle.penType === p.type ? 'white' : 'rgba(255,255,255,0.15)',
                color: penStyle.penType === p.type ? '#1A1A1A' : 'white',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 disabled:opacity-30"
        >
          <RotateCcw size={14} color="white" />
        </button>
      </div>
      {/* 굵기 */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/60">굵기</span>
        <input
          type="range" min={2} max={20} value={penStyle.size}
          onChange={e => onPenStyle({ size: Number(e.target.value) })}
          className="flex-1 accent-white"
        />
        <div
          className="rounded-full bg-white"
          style={{ width: Math.max(4, penStyle.size / 2), height: Math.max(4, penStyle.size / 2) }}
        />
      </div>
      {/* 색상 */}
      {penStyle.penType !== PEN_TYPE.ERASER && (
        <div className="flex items-center justify-center gap-2.5">
          {PEN_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onPenStyle({ color: c })}
              className="h-7 w-7 rounded-full transition-transform active:scale-90"
              style={{
                backgroundColor: c,
                outline: penStyle.color === c ? '2.5px solid white' : '1px solid rgba(255,255,255,0.3)',
                outlineOffset: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ColorToolOptions({ currentColor, onColor }) {
  return (
    <motion.div
      key="color-opt"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-center gap-3 px-5 py-5"
    >
      {POSTIT_COLORS.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onColor(c.color)}
          className="h-10 w-10 rounded-full transition-transform active:scale-90"
          style={{
            backgroundColor: c.color,
            outline: currentColor === c.color ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
            outlineOffset: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        />
      ))}
    </motion.div>
  )
}

// ─── 메인 에디터 ──────────────────────────────────────────────────────────────

export default function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: boardId } = useParams()
  const cardType = location.state?.initialTab === 'polaroid' ? 'polaroid' : 'postit'

  // ── 상태 ──
  const [postitColor, setPostitColor] = useState(POSTIT_COLORS[0].color)
  const [textObjects, setTextObjects] = useState([])
  const [strokes, setStrokes] = useState([])
  const [strokeHistory, setStrokeHistory] = useState([])
  const [activeStroke, setActiveStroke] = useState(null)

  const [activeTool, setActiveTool] = useState(TOOL.NONE)
  const [fontIndex, setFontIndex] = useState(0)
  const [textColor, setTextColor] = useState('#1A1A1A')
  const [penStyle, setPenStyle] = useState({ penType: PEN_TYPE.NORMAL, color: '#1A1A1A', size: 6 })

  const [selectedTextId, setSelectedTextId] = useState(null)
  const [editingText, setEditingText] = useState(null)

  // 폴라로이드
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoCrop, setPhotoCrop] = useState({ x: 0.5, y: 0.5, scale: 1 })
  const [polaroidText, setPolaroidText] = useState('')
  const [polaroidFontIndex, setPolaroidFontIndex] = useState(0)
  const [isEditingPolaroidText, setIsEditingPolaroidText] = useState(false)
  const photoDragRef = useRef(null)
  const pinchRef = useRef(null)

  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState('')

  const cardRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeStrokeRef = useRef(null)
  const pendingBlobRef = useRef(null)

  // ── 초기화 ──
  useEffect(() => {
    if (cardType === 'polaroid') {
      setTimeout(() => fileInputRef.current?.click(), 150)
    } else {
      // 포스트잇: 진입 즉시 텍스트 입력 시작
      setTimeout(() => setEditingText({ id: null }), 100)
    }
  }, [cardType])

  // ── 폴라로이드 사진 드래그 이동 ──
  const handlePhotoDragStart = e => {
    if (cardType !== 'polaroid' || !selectedPhoto) return
    e.preventDefault()
    e.stopPropagation()
    const src = e.touches?.[0] ?? e
    photoDragRef.current = { startX: src.clientX, startY: src.clientY, origX: photoCrop.x, origY: photoCrop.y }

    const onMove = me => {
      if (!photoDragRef.current) return
      me.preventDefault()
      const cur = me.touches?.[0] ?? me
      const dx = (cur.clientX - photoDragRef.current.startX) / 200
      const dy = (cur.clientY - photoDragRef.current.startY) / 200
      setPhotoCrop(prev => ({
        ...prev,
        x: clamp(photoDragRef.current.origX - dx, 0, 1),
        y: clamp(photoDragRef.current.origY - dy, 0, 1),
      }))
    }
    const onEnd = () => {
      photoDragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  // ── 폴라로이드 핀치 줌 ──
  const handlePhotoTouchStart = e => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      pinchRef.current = { initDist: d, initScale: photoCrop.scale }
    } else {
      handlePhotoDragStart(e)
    }
  }

  const handlePhotoTouchMove = e => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      setPhotoCrop(prev => ({
        ...prev,
        scale: clamp(pinchRef.current.initScale * (d / pinchRef.current.initDist), 1, 4),
      }))
    }
  }

  useEffect(() => {
    const ref = pendingBlobRef
    return () => { if (ref.current) URL.revokeObjectURL(ref.current) }
  }, [])

  // ── 툴 전환 ──
  const handleToolTap = tool => {
    if (tool === TOOL.TEXT) {
      // 텍스트 탭 → 바로 입력창 열기
      setSelectedTextId(null)
      setEditingText({ id: null })
      setActiveTool(TOOL.TEXT)
      return
    }
    setActiveTool(prev => prev === tool ? TOOL.NONE : tool)
  }

  const handleCardTap = e => {
    if (!isInsideCard(e, cardRef)) return
    setSelectedTextId(null)
  }

  // ── 텍스트 확인 ──
  const confirmText = text => {
    if (!text.trim()) { setEditingText(null); return }
    if (editingText?.id) {
      setTextObjects(prev => prev.map(o => o.id === editingText.id ? { ...o, text } : o))
    } else {
      setTextObjects(prev => [...prev, {
        id: createId(),
        text,
        x: 0.5,
        y: 0.45,
        fontSize: 20,
        fontFamily: FONTS[fontIndex].family,
        color: textColor,
        rotate: 0,
        scale: 1,
      }])
    }
    setEditingText(null)
  }

  // ── 텍스트 더블클릭/더블탭으로 수정 ──
  const handleTextDoubleTap = id => {
    setEditingText({ id })
  }

  // ── 텍스트 삭제 ──
  const handleTextDelete = id => {
    setTextObjects(prev => prev.filter(o => o.id !== id))
    setSelectedTextId(null)
  }

  // ── 펜 이벤트 ──
  const handlePenDown = e => {
    if (activeTool !== TOOL.PEN) return
    if (!isInsideCard(e, cardRef)) return
    e.preventDefault()

    const point = pointFromEvent(e, cardRef)
    if (!point) return

    if (penStyle.penType === PEN_TYPE.ERASER) {
      setStrokes(prev => prev.filter(s => !s.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 0.06)))
      return
    }

    const stroke = { id: createId(), points: [{ ...point, pressure: 0.5 }], color: penStyle.color, size: penStyle.size, penType: penStyle.penType }
    activeStrokeRef.current = stroke
    setActiveStroke(stroke)

    const move = me => {
      me.preventDefault()
      const p = pointFromEvent(me, cardRef)
      if (!p || !activeStrokeRef.current) return
      const updated = { ...activeStrokeRef.current, points: [...activeStrokeRef.current.points, { ...p, pressure: 0.5 }] }
      activeStrokeRef.current = updated
      setActiveStroke({ ...updated })
    }
    let ended = false
    const end = () => {
      if (ended) return
      ended = true
      const finished = activeStrokeRef.current
      activeStrokeRef.current = null
      setActiveStroke(null)
      if (finished) {
        setStrokes(prev => [...prev, finished])
        setStrokeHistory(prev => [...prev, finished.id])
      }
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
  }

  const handleUndo = () => {
    if (!strokeHistory.length) return
    const lastId = strokeHistory[strokeHistory.length - 1]
    setStrokes(prev => prev.filter(s => s.id !== lastId))
    setStrokeHistory(prev => prev.slice(0, -1))
  }

  // ── 사진 ──
  const handlePhotoChange = e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) { if (cardType === 'polaroid' && !selectedPhoto) navigate(-1); return }
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedPhoto(String(reader.result ?? ''))
      setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 })
    }
    reader.readAsDataURL(file)
  }

  // ── canComplete ── (editingText 입력 중인 내용도 포함)
  const canComplete = cardType === 'polaroid'
    ? Boolean(selectedPhoto)
    : (textObjects.some(o => o.text.trim()) || strokes.length > 0 || Boolean(editingText !== null))

  // ── export ──
  const exportImage = async () => {
    const W = 2048, H = 2048
    await document.fonts.ready
    await Promise.allSettled([
      document.fonts.load('600 48px "Pretendard"'),
      document.fonts.load('400 48px "YiSeoYun"'),
    ])
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    if (cardType === 'postit') {
      // 둥근 모서리 클리핑
      const r = 24
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(W - r, 0)
      ctx.quadraticCurveTo(W, 0, W, r)
      ctx.lineTo(W, H - r)
      ctx.quadraticCurveTo(W, H, W - r, H)
      ctx.lineTo(r, H)
      ctx.quadraticCurveTo(0, H, 0, H - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
      ctx.clip()

      const colorEntry = POSTIT_COLORS.find(c => c.color === postitColor)
      if (colorEntry?.asset) {
        const assetImg = await loadImage(colorEntry.asset)
        ctx.drawImage(assetImg, 0, 0, W, H)
      } else {
        ctx.fillStyle = postitColor
        ctx.fillRect(0, 0, W, H)
        const tex = await loadImage(postitTexture)
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.globalAlpha = 0.15
        ctx.drawImage(tex, 0, 0, W, H)
        ctx.restore()
      }

      // 획 — SVG는 viewBox 100단위에서 size*0.5, canvas는 1200단위니까 size*0.5*12 = size*6
      strokes.forEach(s => {
        const isHL = s.penType === PEN_TYPE.HIGHLIGHT
        const outline = getStroke(
          s.points.map(p => [p.x * W, p.y * H, p.pressure ?? 0.5]),
          { ...(isHL ? HIGHLIGHT_OPT : FREEHAND_OPT), size: s.size * 6 },
        )
        if (!outline.length) return
        ctx.save()
        ctx.globalAlpha = isHL ? 0.38 : 1
        ctx.fillStyle = s.color
        ctx.beginPath()
        outline.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      })

      // 텍스트
      textObjects.forEach(obj => {
        ctx.save()
        ctx.translate(obj.x * W, obj.y * H)
        ctx.rotate((obj.rotate * Math.PI) / 180)
        ctx.scale(obj.scale, obj.scale)
        ctx.fillStyle = obj.color
        ctx.font = `600 ${obj.fontSize * (W / 300)}px ${obj.fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const lines = wrapText(ctx, obj.text, W * 0.85)
        const lh = obj.fontSize * (W / 300) * 1.35
        lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lh))
        ctx.restore()
      })
    } else {
      // 폴라로이드: 900×1200 (3:4)
      canvas.width = 900
      canvas.height = 1200
      const PW = 900, PH = 1200

      // 흰 배경
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, PW, PH)

      // 사진 영역: top 6%, left 6%, right 6%, height 68%
      const px = PW * 0.06, py = PH * 0.06
      const pw = PW * 0.88, ph = PH * 0.68

      if (selectedPhoto) {
        const photo = await loadImage(selectedPhoto)
        ctx.save()
        ctx.beginPath()
        ctx.rect(px, py, pw, ph)
        ctx.clip()
        const sr = photo.naturalWidth / photo.naturalHeight
        const tr = pw / ph
        let sw = photo.naturalWidth, sh = photo.naturalHeight
        if (sr > tr) sw = sh * tr; else sh = sw / tr
        const maxSx = photo.naturalWidth - sw, maxSy = photo.naturalHeight - sh
        ctx.drawImage(
          photo,
          clamp(maxSx * photoCrop.x, 0, maxSx),
          clamp(maxSy * photoCrop.y, 0, maxSy),
          sw, sh,
          px, py, pw, ph
        )
        ctx.restore()
      } else {
        ctx.fillStyle = '#E8E0D4'
        ctx.fillRect(px, py, pw, ph)
      }

      // 하단 텍스트 (top 77%, center)
      if (polaroidText.trim()) {
        const font = FONTS[polaroidFontIndex]
        ctx.save()
        ctx.font = `600 52px ${font.family}`
        ctx.fillStyle = '#2A1A0E'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(polaroidText.slice(0, 30), PW / 2, PH * 0.885)
        ctx.restore()
      }
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('canvas export failed')); return }
        resolve(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.92)
    })
  }

  const complete = async () => {
    if (!canComplete || isCompleting) return
    // 텍스트 입력 중이면 먼저 확정
    if (editingText !== null) {
      const ta = document.querySelector('textarea')
      if (ta?.value.trim()) confirmText(ta.value)
      else setEditingText(null)
      await new Promise(r => setTimeout(r, 60))
    }
    setIsCompleting(true); setError('')
    await new Promise(r => setTimeout(r, 60))
    try {
      const capturedImage = cardType === 'postit' ? await exportImage() : null
      navigate(`/board/${boardId}`, {
        state: {
          placementDraft: {
            id: `${cardType}-${Date.now()}`,
            type: cardType,
            capturedImage,
            content: cardType === 'polaroid'
              ? polaroidText.trim()
              : textObjects.map(o => o.text).filter(Boolean).join('\n'),
            media: cardType === 'polaroid'
              ? { image: selectedPhoto, crop: photoCrop }
              : undefined,
            style: {
              cardType,
              capturedAspectRatio: cardType === 'polaroid' ? POLAROID_ASPECT : POSTIT_ASPECT,
              imageKind: cardType === 'polaroid' ? 'source-photo' : 'rendered-postit',
              postitColor,
              paperColor: cardType === 'postit' ? postitColor : undefined,
              backgroundColor: cardType === 'postit' ? postitColor : undefined,
              textObjects,
              strokes,
              photoCrop,
              polaroidFontIndex,
            },
          },
        },
      })
    } catch (e) {
      console.error('[complete error]', e)
      setError(`저장 실패: ${e?.message ?? e}`)
      setIsCompleting(false)
    }
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────────

  return (
    <motion.main
      className="app-device relative overflow-hidden"
      style={{ height: '100dvh', backgroundColor: '#000' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 배경 */}
      {bgImage && <img src={bgImage} aria-hidden draggable={false} className="absolute inset-0 z-0 h-full w-full object-cover opacity-80" />}
      <div className="absolute inset-0 z-[1] bg-black/30" />

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      {/* ── 카드 (풀스크린 중앙) ── */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        onMouseDown={e => {
          handleCardTap(e)
          if (activeTool === TOOL.PEN) handlePenDown(e)
        }}
        onTouchStart={e => {
          handleCardTap(e)
          if (activeTool === TOOL.PEN) handlePenDown(e)
        }}
      >
        <div
          ref={cardRef}
          className="relative overflow-hidden"
          style={{
            width: cardType === 'polaroid' ? 'min(62vw, 260px)' : 'min(88vw, 380px)',
            aspectRatio: cardType === 'polaroid' ? '3 / 4' : (POSTIT_COLORS.find(c => c.color === postitColor)?.asset ? '695 / 651' : '1 / 1'),
            borderRadius: cardType === 'polaroid' ? 4 : 8,
            boxShadow: (cardType === 'postit' && POSTIT_COLORS.find(c => c.color === postitColor)?.asset)
              ? 'none'
              : '4px 6px 0px rgba(0,0,0,0.10), 6px 14px 28px rgba(0,0,0,0.22)',
            backgroundColor: (cardType === 'postit' && POSTIT_COLORS.find(c => c.color === postitColor)?.asset)
              ? 'transparent'
              : '#fff',
          }}
        >
          {cardType === 'postit' ? (
            <>
              {POSTIT_COLORS.find(c => c.color === postitColor)?.asset ? (
                <img
                  src={POSTIT_COLORS.find(c => c.color === postitColor).asset}
                  alt="" draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{ objectFit: 'fill' }}
                />
              ) : (
                <>
                  <div className="absolute inset-0" style={{ backgroundColor: postitColor }} />
                  <img
                    src={postitTexture} alt="" draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    style={{ mixBlendMode: 'multiply', opacity: 0.15 }}
                  />
                </>
              )}
              <StrokeLayer strokes={strokes} activeStroke={activeStroke} />
              {textObjects.map(obj => (
                selectedTextId === obj.id ? (
                  <TextWithHandles
                    key={obj.id}
                    obj={obj}
                    cardRef={cardRef}
                    onUpdate={(id, patch) => setTextObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))}
                    onEdit={id => { setEditingText({ id }); setSelectedTextId(null) }}
                    onDelete={handleTextDelete}
                  />
                ) : (
                  <div
                    key={obj.id}
                    onMouseDown={e => { e.stopPropagation(); setSelectedTextId(obj.id); setActiveTool(TOOL.NONE) }}
                    onTouchStart={e => { e.stopPropagation(); setSelectedTextId(obj.id); setActiveTool(TOOL.NONE) }}
                    className="absolute"
                    style={{
                      left: `${obj.x * 100}%`,
                      top: `${obj.y * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${obj.rotate}deg)`,
                      transformOrigin: 'center',
                      fontSize: obj.fontSize,
                      fontFamily: obj.fontFamily,
                      color: obj.color,
                      fontWeight: 600,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      maxWidth: '200px',
                      lineHeight: 1.35,
                      cursor: 'pointer',
                      touchAction: 'none',
                      userSelect: 'none',
                      zIndex: 10,
                      padding: '2px 4px',
                    }}
                  >
                    {obj.text}
                  </div>
                )
              ))}
            </>
          ) : (
            <>
              {/* 흰 배경 */}
              <div className="absolute inset-0 bg-white" />

              {/* 사진 영역 — 상단 여백 6%, 좌우 여백 6%, 높이 68% */}
              <div
                className="absolute overflow-hidden bg-[#E8E0D4]"
                style={{ top: '5%', left: '5%', right: '5%', height: '72%', touchAction: 'none', cursor: selectedPhoto ? 'grab' : 'default' }}
                onMouseDown={handlePhotoDragStart}
                onTouchStart={handlePhotoTouchStart}
                onTouchMove={handlePhotoTouchMove}
              >
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto} alt="" draggable={false}
                    className="h-full w-full select-none pointer-events-none"
                    style={{
                      objectFit: 'cover',
                      objectPosition: `${photoCrop.x * 100}% ${photoCrop.y * 100}%`,
                      transform: `scale(${photoCrop.scale})`,
                      transformOrigin: `${photoCrop.x * 100}% ${photoCrop.y * 100}%`,
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9A8374]"
                  >
                    <Camera size={24} />
                    <span className="text-[12px] font-bold">사진 추가</span>
                  </button>
                )}
              </div>

              {/* 하단 텍스트 여백 */}
              <div
                className="absolute left-0 right-0 flex items-center justify-center px-3"
                style={{ top: '79%', bottom: '3%' }}
              >
                {isEditingPolaroidText ? (
                  <input
                    autoFocus
                    type="text"
                    value={polaroidText}
                    onChange={e => setPolaroidText(e.target.value)}
                    onBlur={() => setIsEditingPolaroidText(false)}
                    onKeyDown={e => { if (e.key === 'Enter') setIsEditingPolaroidText(false) }}
                    maxLength={30}
                    className="w-full bg-transparent text-center outline-none"
                    style={{
                      fontFamily: FONTS[polaroidFontIndex].family,
                      fontSize: 16,
                      color: '#2A1A0E',
                      caretColor: '#2A1A0E',
                    }}
                    placeholder="한 줄 메모..."
                  />
                ) : (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setIsEditingPolaroidText(true) }}
                    className="w-full text-center"
                    style={{
                      fontFamily: FONTS[polaroidFontIndex].family,
                      fontSize: 16,
                      color: polaroidText ? '#2A1A0E' : '#C4B8A8',
                    }}
                  >
                    {polaroidText || '한 줄 메모...'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 헤더 오버레이 ── */}
      <header className="absolute inset-x-0 top-0 z-[60] flex items-center justify-between px-5 pt-safe-top pb-2 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
        >
          <X size={18} color="white" />
        </button>
        {editingText !== null ? (
          <button
            type="button"
            onClick={() => {
              const ta = document.querySelector('.card-text-input')
              const val = ta?.value ?? ''
              confirmText(val)
            }}
            className="rounded-full px-5 py-2 text-[14px] font-extrabold text-white shadow-lg"
            style={{ backgroundColor: '#9B4F3F' }}
          >
            확인
          </button>
        ) : (
          <button
            type="button"
            onClick={complete}
            disabled={!canComplete || isCompleting}
            className="rounded-full px-5 py-2 text-[14px] font-extrabold text-white shadow-lg disabled:opacity-40"
            style={{ backgroundColor: canComplete ? '#9B4F3F' : 'rgba(0,0,0,0.3)' }}
          >
            {isCompleting ? '저장 중...' : '완료'}
          </button>
        )}
      </header>

      {error && (
        <div className="absolute inset-x-4 top-20 z-30 rounded-xl bg-red-500/90 px-4 py-2 text-center text-[13px] font-bold text-white backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* ── 하단 툴바 오버레이 (포스트잇만) ── */}
      {cardType === 'postit' && (
        <div className="absolute inset-x-0 bottom-0 z-30">
          {/* 툴별 옵션 영역 */}
          <AnimatePresence mode="wait">
            {activeTool !== TOOL.NONE && (
              <motion.div
                key={activeTool}
                className="mx-3 mb-2 rounded-2xl bg-black/50 backdrop-blur-md"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
              >
                {activeTool === TOOL.TEXT && null}
                {activeTool === TOOL.PEN && (
                  <PenToolOptions
                    penStyle={penStyle}
                    onPenStyle={s => setPenStyle(prev => ({ ...prev, ...s }))}
                    onUndo={handleUndo}
                    canUndo={strokeHistory.length > 0}
                  />
                )}
                {activeTool === TOOL.COLOR && (
                  <ColorToolOptions currentColor={postitColor} onColor={setPostitColor} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 메인 툴바 */}
          <div className="mx-3 mb-3 flex items-center justify-around rounded-2xl bg-black/50 px-2 py-3 backdrop-blur-md">
            {[
              { id: TOOL.TEXT,  label: '텍스트', icon: 'Aa' },
              { id: TOOL.PEN,   label: '펜',     icon: '✏️' },
              { id: TOOL.COLOR, label: '색상',   icon: '🎨' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToolTap(t.id)}
                className="flex flex-col items-center gap-1 rounded-xl px-5 py-2 transition-all"
                style={{
                  backgroundColor: activeTool === t.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                }}
              >
                <span className="text-[17px] font-black leading-none text-white">{t.icon}</span>
                <span className="text-[10px] font-bold text-white/80">{t.label}</span>
              </button>
            ))}
          </div>

          <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
      )}

      {/* ── 폴라로이드 하단 툴바 ── */}
      {cardType === 'polaroid' && (
        <div className="absolute inset-x-0 bottom-0 z-30">
          <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-black/50 px-5 py-3 backdrop-blur-md">
            {/* 폰트 선택 */}
            <div className="flex gap-1.5">
              {FONTS.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPolaroidFontIndex(i)}
                  className="rounded-full px-3 py-1.5 text-[13px] transition-all"
                  style={{
                    fontFamily: f.family,
                    backgroundColor: polaroidFontIndex === i ? 'white' : 'rgba(255,255,255,0.12)',
                    color: polaroidFontIndex === i ? '#1A1A1A' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  가나다
                </button>
              ))}
            </div>
            {/* 사진 교체 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5"
            >
              <Camera size={14} color="white" />
              <span className="text-[12px] font-bold text-white">교체</span>
            </button>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
      )}

      {/* ── 인라인 텍스트 입력 (인스타 상단 폰트바) ── */}
      <AnimatePresence>
        {editingText !== null && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CardTextEditor
              initialText={editingText.id ? textObjects.find(o => o.id === editingText.id)?.text ?? '' : ''}
              fontIndex={fontIndex}
              onFontChange={setFontIndex}
              textColor={textColor}
              onColorChange={setTextColor}
              onConfirm={confirmText}
              onCancel={() => setEditingText(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.main>
  )
}
