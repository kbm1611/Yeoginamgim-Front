import { AnimatePresence, motion } from 'framer-motion'
import { AlignCenter, AlignLeft, AlignRight, Archive, Camera, Home, Image as ImageIcon, MapPin, PenLine, Plus, Settings, Smile, Trash2, Type, X } from 'lucide-react'
import { getStroke } from 'perfect-freehand'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import postitImage from '../assets/editor/image.png'
import polaroidFrame from '../assets/images/recent-trace-default-polaroid.png'
import bgImage from '../assets/배경.png'

const EDITOR_STEP = {
  EMPTY: 'empty',
  TYPE_PICKER: 'typePicker',
  POSTIT_PICKER: 'postitPicker',
  PHOTO_CROP: 'photoCrop',
  EDITING: 'editing',
}

const EDITOR_MODE = {
  IDLE: 'idle',
  TEXT: 'text',
  PEN: 'pen',
  OBJECT_SELECTED: 'objectSelected',
}

const OBJECT_TYPE = {
  TEXT: 'text',
  STROKE: 'stroke',
  STICKER: 'sticker',
}

const POSTIT_SOURCE_CROP = { x: 0, y: 0, width: 1024, height: 1536 }
const POSTIT_SIZE = { width: POSTIT_SOURCE_CROP.width, height: POSTIT_SOURCE_CROP.height }
const POSTIT_EXPORT_CROP = { x: 0, y: 0, width: 1, height: 1 }
const POSTIT_EXPORT_ASPECT_RATIO = (POSTIT_SIZE.width * POSTIT_EXPORT_CROP.width) / (POSTIT_SIZE.height * POSTIT_EXPORT_CROP.height)
const POLAROID_SOURCE_CROP = { x: 0, y: 0, width: 512, height: 512 }
const POLAROID_SIZE = { width: POLAROID_SOURCE_CROP.width, height: POLAROID_SOURCE_CROP.height }

const POSTIT_TEMPLATES = [
  { id: 'yellow', label: '노랑', color: '#F7E58A', tape: '#F2C55C' },
  { id: 'pink', label: '핑크', color: '#F6C3CF', tape: '#EFA6B8' },
  { id: 'sky', label: '하늘', color: '#C8E2F2', tape: '#9EC8E8' },
  { id: 'green', label: '연두', color: '#D7E7B4', tape: '#AECF80' },
  { id: 'cream', label: '격자', color: '#FFF4CC', tape: '#D2D97E' },
  { id: 'purple', label: '보라', color: '#E6D4F2', tape: '#C3A2E5' },
]

const CARD_TEMPLATE = {
  postit: {
    size: POSTIT_SIZE,
    textBounds: { x: 0.26, y: 0.18, width: 0.5, height: 0.58 },
    drawBounds: { x: 0.245, y: 0.14, width: 0.525, height: 0.69 },
    excludedZones: [],
  },
  polaroid: {
    size: POLAROID_SIZE,
    imageBounds: { x: 0.064, y: 0.061, width: 0.87, height: 0.744 },
    textBounds: { x: 0.11, y: 0.835, width: 0.78, height: 0.11 },
    drawBounds: { x: 0.064, y: 0.061, width: 0.87, height: 0.744 },
    excludedZones: [],
  },
}

const FONTS = [
  { id: 'basic', label: '기본체', family: "'Pretendard', sans-serif" },
  { id: 'mood', label: '손글씨', family: "'Cafe24Oneprettynight', 'Nanum Pen Script', 'Gaegu', cursive" },
  { id: 'round', label: '둥근체', family: "'Gaegu', 'Pretendard', sans-serif" },
  { id: 'serif', label: '카페체', family: "'MaruBuri', 'Noto Serif KR', serif" },
]

const TEXT_COLORS = ['#2C1A0E', '#77716A', '#F5B400', '#F97316', '#F28AA8', '#9B59B6', '#2D9CDB', '#2FA84F']
const PEN_COLORS = ['#2C1A0E', '#EF4444', '#F97316', '#E7B949', '#2FA84F', '#2D9CDB', '#9B59B6']
const PEN_WIDTHS = { thin: 2, medium: 5, thick: 9 }
const STICKERS = ['♡', '☕', '✿', '☆']
const MAX_TEXT_LENGTH = 200
const FREEHAND_OPTIONS = {
  thinning: 0.44,
  smoothing: 0.62,
  streamline: 0.5,
  simulatePressure: true,
  start: { taper: 2, cap: true },
  end: { taper: 2, cap: true },
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function isInsideBounds(point, bounds) {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height
}

function isInsideExcludedZone(point, zones = []) {
  return zones.some((zone) => isInsideBounds(point, zone))
}

function canUsePoint(point, bounds, zones = []) {
  return isInsideBounds(point, bounds) && !isInsideExcludedZone(point, zones)
}

function clampPointToBounds(point, bounds) {
  return {
    ...point,
    x: clamp(point.x, bounds.x, bounds.x + bounds.width),
    y: clamp(point.y, bounds.y, bounds.y + bounds.height),
  }
}

function clampObjectToBounds(object, bounds) {
  return {
    ...object,
    x: clamp(object.x, bounds.x, bounds.x + bounds.width - (object.width ?? 0)),
    y: clamp(object.y, bounds.y, bounds.y + bounds.height - (object.height ?? 0)),
  }
}

function boundsToStyle(bounds) {
  return {
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
  }
}

function boundsToPixels(bounds, width, height) {
  return {
    x: bounds.x * width,
    y: bounds.y * height,
    width: bounds.width * width,
    height: bounds.height * height,
  }
}

function remapPointToCrop(point, crop) {
  return {
    ...point,
    x: (point.x - crop.x) / crop.width,
    y: (point.y - crop.y) / crop.height,
  }
}

function remapBoundsToCrop(bounds, crop) {
  return {
    x: (bounds.x - crop.x) / crop.width,
    y: (bounds.y - crop.y) / crop.height,
    width: bounds.width / crop.width,
    height: bounds.height / crop.height,
  }
}

function cropImageStyle(crop, sourceWidth = 1536, sourceHeight = 1024) {
  return {
    height: `${(sourceHeight / crop.height) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
    width: `${(sourceWidth / crop.width) * 100}%`,
  }
}

function pointFromEvent(event, ref) {
  const rect = ref.current?.getBoundingClientRect()
  if (!rect) return null
  const source = event.touches?.[0] ?? event

  return {
    x: clamp((source.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((source.clientY - rect.top) / rect.height, 0, 1),
  }
}

function getStrokeOutline(points, coordinateScale = 100, sizeScale = 0.48) {
  if (!points?.length) return []

  return getStroke(
    points.map((point) => [point.x * coordinateScale, point.y * coordinateScale, point.pressure ?? 0.5]),
    {
      ...FREEHAND_OPTIONS,
      size: (points[0]?.size ?? PEN_WIDTHS.medium) * sizeScale,
    },
  )
}

function outlineToPath(outline) {
  if (!outline.length) return ''
  const [first, ...rest] = outline
  return [
    `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`,
    ...rest.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`),
    'Z',
  ].join(' ')
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function drawImageCover(ctx, image, x, y, width, height) {
  const sourceRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height
  let sx = 0
  let sy = 0
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (sourceRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio
    sx = (image.naturalWidth - sw) / 2
  } else {
    sh = image.naturalWidth / targetRatio
    sy = (image.naturalHeight - sh) / 2
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function drawImageWithCrop(ctx, image, x, y, width, height, crop) {
  const scale = crop?.scale ?? 1
  const offsetX = crop?.x ?? 0.5
  const offsetY = crop?.y ?? 0.5
  const sourceRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (sourceRatio > targetRatio) {
    sh = image.naturalHeight / scale
    sw = sh * targetRatio
  } else {
    sw = image.naturalWidth / scale
    sh = sw / targetRatio
  }

  const maxSx = Math.max(0, image.naturalWidth - sw)
  const maxSy = Math.max(0, image.naturalHeight - sh)
  const sx = clamp(maxSx * offsetX, 0, maxSx)
  const sy = clamp(maxSy * offsetY, 0, maxSy)

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const image = new Image()
        image.onload = () => {
          URL.revokeObjectURL(url)
          resolve(image)
        }
        image.onerror = reject
        image.src = url
      })
      .catch(reject)
  })
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const result = []

  String(text ?? '').split('\n').forEach((paragraph) => {
    const chars = Array.from(paragraph)
    let line = ''

    chars.forEach((char) => {
      const next = `${line}${char}`
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next
      } else {
        result.push(line)
        line = char
      }
    })

    if (line) result.push(line)
  })

  return result.slice(0, maxLines)
}

function cropCanvasByAlpha(canvas, alphaThreshold = 1) {
  const ctx = canvas.getContext('2d')
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha >= alphaThreshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) return canvas

  const output = document.createElement('canvas')
  output.width = maxX - minX + 1
  output.height = maxY - minY + 1
  output.getContext('2d').drawImage(canvas, minX, minY, output.width, output.height, 0, 0, output.width, output.height)
  return output
}

function Header({ isCompleting, canComplete, isEditing, onClose, onComplete }) {
  return (
    <header className="relative z-20 flex h-[58px] flex-none items-center justify-between px-5">
      <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center text-[#2C1A0E]">
        <X size={23} strokeWidth={2.1} />
      </button>
      <h1 className="text-[18px] font-extrabold text-[#111]">{isEditing ? '흔적 남기기' : '여기남김'}</h1>
      {isEditing ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={!canComplete || isCompleting}
          className="h-11 rounded-full px-5 text-[14px] font-extrabold text-white disabled:opacity-45"
          style={{ backgroundColor: canComplete && !isCompleting ? '#9B4F3F' : '#D6A090' }}
        >
          {isCompleting ? '저장 중' : '완료'}
        </button>
      ) : (
        <button type="button" className="flex h-10 w-10 items-center justify-center text-[#2C1A0E]" aria-label="설정">
          <Settings size={20} strokeWidth={1.9} />
        </button>
      )}
    </header>
  )
}

function EditorHeaderV2({ isCompleting, canComplete, onClose, onComplete }) {
  return (
    <header className="relative z-20 flex h-[58px] flex-none items-center justify-between px-5">
      <button type="button" onClick={onClose} className="h-10 text-[14px] font-bold text-[#3B2418]">
        취소
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-extrabold text-[#1F140E]">
        흔적 남기기
      </h1>
      <button
        type="button"
        onClick={onComplete}
        disabled={!canComplete || isCompleting}
        className="h-10 rounded-full px-4 text-[14px] font-extrabold text-white shadow-[0_8px_18px_rgba(97,49,36,0.18)] disabled:opacity-45"
        style={{ backgroundColor: canComplete && !isCompleting ? '#9B4F3F' : '#D8B3A5' }}
      >
        {isCompleting ? '저장 중' : '완료'}
      </button>
    </header>
  )
}

function EmptyStage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-[22px] font-extrabold text-[#3B2418]">어떤 흔적을 남길까요?</p>
      <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#8A715D]">
        포스트잇처럼 짧게 쓰거나, 사진 한 장에 오늘의 순간을 붙여보세요.
      </p>
    </div>
  )
}

function EditorAppBar({ active, onOpenPicker }) {
  return (
    <nav className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[86px] border-t border-[#EEE2D3] bg-white/92 shadow-[0_-8px_24px_rgba(59,36,24,0.08)] backdrop-blur">
      <div className="pointer-events-auto mx-auto grid h-full max-w-[390px] grid-cols-5 items-center px-5 pb-4 pt-2">
        {[
          { key: 'home', label: '홈', icon: Home },
          { key: 'map', label: '지도', icon: MapPin },
          { key: 'add', label: '추가', icon: Plus },
          { key: 'archive', label: '보관함', icon: Archive },
          { key: 'my', label: '마이', icon: Settings },
        ].map((item) => {
          const Icon = item.icon
          const isAdd = item.key === 'add'
          const selected = active === item.key

          return (
            <button
              key={item.key}
              type="button"
              onClick={isAdd ? onOpenPicker : undefined}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold"
              style={{ color: selected || isAdd ? '#3B2418' : '#9A8270' }}
            >
              <span
                className={isAdd ? 'flex h-[56px] w-[56px] -translate-y-5 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(59,36,24,0.22)]' : 'flex h-6 items-center justify-center'}
                style={isAdd ? { border: '2px solid #F0A000', color: '#2C1A0E' } : undefined}
              >
                <Icon size={isAdd ? 28 : 20} strokeWidth={isAdd ? 2 : 1.8} />
              </span>
              <span className={isAdd ? '-mt-4 opacity-0' : ''}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function AddDock({ step, onOpenPicker, onBackToEmpty }) {
  if (step === EDITOR_STEP.EDITING) return null
  if (step === EDITOR_STEP.EMPTY) return <EditorAppBar active="add" onOpenPicker={onOpenPicker} />

  return (
    <div className="absolute bottom-[102px] left-0 right-0 z-40 flex justify-center">
      <button
        type="button"
        onClick={onBackToEmpty}
        className="flex h-10 items-center justify-center rounded-full bg-white/94 px-5 text-[13px] font-extrabold text-[#6B4E3B] shadow-[0_8px_20px_rgba(59,36,24,0.14)]"
        aria-label="닫기"
      >
        취소
      </button>
    </div>
  )
}

function PickerScreen({ title, subtitle, children }) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-x-5 top-4 z-30 rounded-[24px] border border-[#EEE0D1] bg-white/88 px-4 pb-5 pt-4 shadow-[0_14px_34px_rgba(59,36,24,0.14)] backdrop-blur"
    >
      <p className="text-center text-[14px] font-extrabold text-[#3B2418]">{title}</p>
      {subtitle ? <p className="mt-1 text-center text-[11px] font-semibold text-[#9A8270]">{subtitle}</p> : null}
      {children}
    </motion.div>
  )
}

function TypePicker({ onPickPostit, onPickPolaroid }) {
  return (
    <PickerScreen title="흔적 추가" subtitle="어떤 방식으로 추억을 남길까요?">
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onPickPostit} className="rounded-[18px] bg-[#FFF4CD] px-4 py-5 text-left shadow-sm active:scale-[0.99]">
          <span className="block h-10 w-10 rounded-[10px] bg-[#F7E58A] shadow-sm" />
          <span className="mt-4 block text-[15px] font-extrabold text-[#3B2418]">포스트잇</span>
          <span className="mt-1 block text-[12px] font-semibold leading-relaxed text-[#8A715D]">텍스트 중심으로 빠르게 남겨요</span>
        </button>
        <button type="button" onClick={onPickPolaroid} className="rounded-[18px] bg-[#F4F1FF] px-4 py-5 text-left shadow-sm active:scale-[0.99]">
          <ImageIcon size={33} strokeWidth={1.7} />
          <span className="mt-4 block text-[15px] font-extrabold text-[#3B2418]">포토카드</span>
          <span className="mt-1 block text-[12px] font-semibold leading-relaxed text-[#8A715D]">사진을 먼저 고르고 꾸며요</span>
        </button>
      </div>
    </PickerScreen>
  )
}

function PostitPicker({ onPick, onCancel }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(POSTIT_TEMPLATES[0].id)
  const selectedTemplate = POSTIT_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? POSTIT_TEMPLATES[0]

  return (
    <PickerScreen title="포스트잇 선택" subtitle="원하는 색상과 형태의 포스트잇을 골라주세요">
      <div className="mt-4 grid grid-cols-2 gap-4 px-1">
        {POSTIT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelectedTemplateId(template.id)}
            className="relative flex aspect-[1.08/1] flex-col items-center justify-center rounded-[14px] border border-[#EADBCB] shadow-sm active:scale-[0.98]"
            style={{
              background: `linear-gradient(145deg, ${template.color}, #FFF8E7)`,
              outline: selectedTemplateId === template.id ? '2px solid #F0A000' : 'none',
              outlineOffset: 2,
            }}
          >
            <span className="absolute top-3 h-2 w-9 rounded-full" style={{ backgroundColor: template.tape }} />
            <span className="mt-4 text-[12px] font-extrabold text-[#5A3D2B]">{template.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-xl bg-[#F8F3EA] text-[12px] font-extrabold text-[#8A715D]">취소</button>
        <button type="button" onClick={() => onPick(selectedTemplate)} className="h-10 rounded-xl bg-[#3B2418] text-[12px] font-extrabold text-white">선택</button>
      </div>
    </PickerScreen>
  )
}

function PhotoCropScreen({ photo, crop, onCrop, onCancel, onConfirm }) {
  const dragRef = useRef(null)

  const handlePointerDown = (event) => {
    event.preventDefault()
    const source = event.touches?.[0] ?? event

    dragRef.current = {
      startX: source.clientX,
      startY: source.clientY,
      cropX: crop.x,
      cropY: crop.y,
    }

    const move = (moveEvent) => {
      if (!dragRef.current) return
      const current = moveEvent.touches?.[0] ?? moveEvent
      const dx = (current.clientX - dragRef.current.startX) / 220
      const dy = (current.clientY - dragRef.current.startY) / 220
      onCrop({
        ...crop,
        x: clamp(dragRef.current.cropX - dx, 0, 1),
        y: clamp(dragRef.current.cropY - dy, 0, 1),
      })
    }

    const end = () => {
      dragRef.current = null
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-x-5 top-4 z-30 rounded-[24px] border border-[#E5D8F5] bg-white/90 px-4 pb-5 pt-4 shadow-[0_14px_34px_rgba(70,46,110,0.14)] backdrop-blur"
    >
      <p className="text-center text-[14px] font-extrabold text-[#3B2418]">사진 편집</p>
      <p className="mt-1 text-center text-[11px] font-semibold text-[#9A8270]">드래그로 위치를 맞추고, 확대/축소로 크기를 조정하세요</p>

      <div
        className="relative mx-auto mt-4 aspect-[4/5] w-[210px] overflow-hidden rounded-[18px] bg-[#F4EDE4] shadow-inner"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
              transform: `scale(${crop.scale})`,
              transformOrigin: `${crop.x * 100}% ${crop.y * 100}%`,
            }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="border border-white/45" />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onCrop({ ...crop, scale: Math.max(1, crop.scale - 0.1) })}
          className="h-9 rounded-xl bg-[#F8F3EA] px-5 text-[12px] font-extrabold text-[#3B2418]"
        >
          축소
        </button>
        <span className="min-w-[46px] text-center text-[12px] font-extrabold text-[#6B4E3B]">{Math.round(crop.scale * 100)}%</span>
        <button
          type="button"
          onClick={() => onCrop({ ...crop, scale: Math.min(2.2, crop.scale + 0.1) })}
          className="h-9 rounded-xl bg-[#F8F3EA] px-5 text-[12px] font-extrabold text-[#3B2418]"
        >
          확대
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-xl bg-[#F8F3EA] text-[12px] font-extrabold text-[#8A715D]">취소</button>
        <button type="button" onClick={onConfirm} className="h-10 rounded-xl bg-[#3B2418] text-[12px] font-extrabold text-white">확인</button>
      </div>
    </motion.div>
  )
}

function StrokeLayer({ strokes, bounds }) {
  return (
    <div className="pointer-events-none absolute z-[4] overflow-hidden" style={boundsToStyle(bounds)}>
      <svg
        className="h-full w-full"
        viewBox={`${bounds.x * 100} ${bounds.y * 100} ${bounds.width * 100} ${bounds.height * 100}`}
        preserveAspectRatio="none"
        style={{ overflow: 'hidden' }}
      >
        {strokes.map((stroke) => (
          <path key={stroke.id} d={outlineToPath(getStrokeOutline(stroke.points))} fill={stroke.style.color} stroke="none" />
        ))}
      </svg>
    </div>
  )
}

function TextObject({
  object,
  bounds,
  selected,
  editing,
  onSelect,
  onStartEdit,
  onTextChange,
  onFinishEdit,
  onMove,
}) {
  const editRef = useRef(null)
  const composingRef = useRef(false)
  const dragRef = useRef(null)
  const isSticker = object.type === OBJECT_TYPE.STICKER

  useEffect(() => {
    if (!editing || !editRef.current) return

    const el = editRef.current
    el.textContent = object.text ?? ''
    el.focus()

    const range = document.createRange()
    const selection = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [editing, object.id])

  const startDrag = (event) => {
    if (editing) return
    event.preventDefault()
    event.stopPropagation()
    onSelect(object.id)

    const parent = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!parent) return
    const source = event.touches?.[0] ?? event

    dragRef.current = {
      sx: source.clientX,
      sy: source.clientY,
      x: object.x,
      y: object.y,
      w: parent.width,
      h: parent.height,
    }

    const move = (moveEvent) => {
      if (!dragRef.current) return
      const current = moveEvent.touches?.[0] ?? moveEvent
      const dx = (current.clientX - dragRef.current.sx) / dragRef.current.w
      const dy = (current.clientY - dragRef.current.sy) / dragRef.current.h
      onMove(object.id, clampObjectToBounds({ ...object, x: dragRef.current.x + dx, y: dragRef.current.y + dy }, bounds))
    }

    const end = () => {
      dragRef.current = null
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

  const style = {
    position: 'absolute',
    left: `${object.x * 100}%`,
    top: `${object.y * 100}%`,
    width: isSticker ? 'auto' : `${object.width * 100}%`,
    height: isSticker ? 'auto' : `${object.height * 100}%`,
    color: object.style?.color ?? '#2C1A0E',
    fontFamily: object.style?.fontFamily ?? FONTS[1].family,
    fontSize: isSticker ? object.size ?? 28 : object.style?.fontSize ?? 22,
    lineHeight: isSticker ? 1 : 1.35,
    textAlign: object.style?.align ?? 'center',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    overflow: 'hidden',
    border: selected && !editing ? '1px solid rgba(54,37,25,0.24)' : 'none',
    borderRadius: 5,
    padding: isSticker ? 0 : '2px 3px',
    userSelect: editing ? 'text' : 'none',
    touchAction: 'none',
  }

  return (
    <div
      style={style}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(object.id)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        if (!isSticker) onStartEdit(object.id)
      }}
    >
      {isSticker ? (
        <span>{object.value}</span>
      ) : editing ? (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onCompositionStart={() => {
            composingRef.current = true
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false
            onTextChange(object.id, event.currentTarget.textContent ?? '')
          }}
          onInput={(event) => {
            if (composingRef.current) return
            onTextChange(object.id, event.currentTarget.textContent ?? '')
          }}
          onBlur={() => onFinishEdit(object.id)}
          style={{ height: '100%', minHeight: 24, outline: 'none', overflow: 'hidden' }}
        />
      ) : (
        <div>{object.text}</div>
      )}
    </div>
  )
}

function EditableCard({
  cardType,
  postitTemplate,
  selectedPhoto,
  photoCrop,
  objects,
  editorMode,
  selectedObjectId,
  editingObjectId,
  onPickPhoto,
  onCardTap,
  onStartStroke,
  onAppendStroke,
  onEndStroke,
  onSelectObject,
  onStartEdit,
  onTextChange,
  onFinishEdit,
  onMoveObject,
}) {
  const cardRef = useRef(null)
  const template = CARD_TEMPLATE[cardType]
  const strokeBounds = template.drawBounds
  const textBounds = template.textBounds
  const strokes = objects.filter((object) => object.type === OBJECT_TYPE.STROKE)
  const textObjects = objects.filter((object) => object.type !== OBJECT_TYPE.STROKE)

  const handleTap = (event) => {
    event.stopPropagation()
    const point = pointFromEvent(event, cardRef)
    if (!point) return
    onCardTap(point)
  }

  const handlePointerDown = (event) => {
    if (editorMode !== EDITOR_MODE.PEN) return
    event.preventDefault()
    event.stopPropagation()
    const point = pointFromEvent(event, cardRef)
    if (!point || !canUsePoint(point, strokeBounds, template.excludedZones)) return
    onStartStroke(point)

    const move = (moveEvent) => {
      moveEvent.preventDefault()
      const next = pointFromEvent(moveEvent, cardRef)
      if (!next || isInsideExcludedZone(next, template.excludedZones)) {
        onEndStroke()
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', end)
        window.removeEventListener('touchmove', move)
        window.removeEventListener('touchend', end)
        return
      }
      onAppendStroke(clampPointToBounds(next, strokeBounds))
    }

    const end = () => {
      onEndStroke()
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

  return (
    <div
      ref={cardRef}
      className="relative shrink-0"
      onClick={editorMode === EDITOR_MODE.PEN ? undefined : handleTap}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      style={{
        aspectRatio: `${template.size.width} / ${template.size.height}`,
        cursor: editorMode === EDITOR_MODE.PEN ? 'crosshair' : 'default',
        overflow: 'hidden',
        width: cardType === 'polaroid' ? 'min(82vw, 320px)' : 'min(94vw, 376px)',
      }}
    >
      {cardType === 'postit' ? (
        <>
          <img
            src={postitImage}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
          />
        </>
      ) : (
        <>
          <div className="absolute z-[1] overflow-hidden" style={boundsToStyle(template.imageBounds)}>
            {selectedPhoto ? (
              <img
                src={selectedPhoto}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${(photoCrop?.x ?? 0.5) * 100}% ${(photoCrop?.y ?? 0.5) * 100}%`,
                  transform: `scale(${photoCrop?.scale ?? 1})`,
                  transformOrigin: `${(photoCrop?.x ?? 0.5) * 100}% ${(photoCrop?.y ?? 0.5) * 100}%`,
                }}
              />
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onPickPhoto()
                }}
                className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F6EFE5]/80 text-[#9A8374]"
              >
                <Camera size={26} />
                <span className="text-[12px] font-bold">사진 추가</span>
              </button>
            )}
          </div>
          <img
            src={polaroidFrame}
            alt=""
            draggable={false}
            className="pointer-events-none absolute z-[2] object-fill"
            style={cropImageStyle(POLAROID_SOURCE_CROP, 512, 512)}
          />
        </>
      )}

      <StrokeLayer strokes={strokes} bounds={strokeBounds} />
      <div className="absolute inset-0 z-[5]">
        {textObjects.map((object) => (
          <TextObject
            key={object.id}
            object={object}
            bounds={textBounds}
            selected={selectedObjectId === object.id}
            editing={editingObjectId === object.id}
            onSelect={onSelectObject}
            onStartEdit={onStartEdit}
            onTextChange={onTextChange}
            onFinishEdit={onFinishEdit}
            onMove={onMoveObject}
          />
        ))}
      </div>
    </div>
  )
}

function QuickToolbar({ cardType, onText, onPen, onSticker, onPhoto }) {
  return (
    <div className="mx-auto flex h-[58px] w-fit items-center gap-3 rounded-[20px] bg-white/94 px-4 shadow-[0_10px_28px_rgba(59,36,24,0.13)]">
      {cardType === 'polaroid' ? (
        <button type="button" onClick={onPhoto} className="flex h-10 w-10 items-center justify-center rounded-full text-[#2C1A0E]">
          <Camera size={21} strokeWidth={1.9} />
        </button>
      ) : null}
      <button type="button" onClick={onText} className="flex h-10 w-10 items-center justify-center rounded-full text-[#2C1A0E]">
        <Type size={21} strokeWidth={1.9} />
      </button>
      <button type="button" onClick={onPen} className="flex h-10 w-10 items-center justify-center rounded-full text-[#2C1A0E]">
        <PenLine size={21} strokeWidth={1.9} />
      </button>
      <button type="button" onClick={onSticker} className="flex h-10 w-10 items-center justify-center rounded-full text-[#2C1A0E]">
        <Smile size={21} strokeWidth={1.9} />
      </button>
    </div>
  )
}

function TextToolbar({ textStyle, selectedObject, onStyle, onDelete }) {
  const [activeTab, setActiveTab] = useState('font')

  return (
    <div className="mx-4 rounded-[20px] border border-[#EEE0D1] bg-white/96 px-3 py-3 shadow-[0_10px_30px_rgba(59,36,24,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-[#3B2418]">텍스트 편집</span>
        {selectedObject ? (
          <button type="button" onClick={onDelete} className="flex h-8 items-center gap-1 rounded-full bg-[#F8F3EA] px-3 text-[12px] font-bold text-[#A74831]">
            <Trash2 size={14} />
            삭제
          </button>
        ) : null}
      </div>
      <div className="mb-2 grid grid-cols-4 gap-1 rounded-xl bg-[#F8F3EA] p-1">
        {[
          ['font', '글꼴'],
          ['color', '색상'],
          ['size', '크기'],
          ['align', '정렬'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`h-8 rounded-lg text-[11px] font-extrabold ${activeTab === key ? 'bg-white text-[#3B2418] shadow-sm' : 'text-[#7A6250]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'font' ? (
        <div className="grid grid-cols-4 gap-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => onStyle({ fontFamily: font.family })}
              className={`h-9 rounded-xl text-[11px] font-bold ${textStyle.fontFamily === font.family ? 'bg-[#FFECA0] text-[#3B2418]' : 'bg-[#F8F3EA] text-[#7A6250]'}`}
              style={{ fontFamily: font.family }}
            >
              {font.label}
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === 'color' ? (
        <div className="flex h-9 items-center gap-2 overflow-x-auto px-1">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onStyle({ color })}
              className="h-7 w-7 shrink-0 rounded-full"
              style={{
                backgroundColor: color,
                outline: textStyle.color === color ? '2px solid #6B3A2A' : '1px solid #E8DDD1',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      ) : null}

      {activeTab === 'size' ? (
        <div className="flex h-9 items-center justify-between rounded-xl bg-[#F8F3EA] px-3">
          <button type="button" onClick={() => onStyle({ fontSize: Math.max(15, textStyle.fontSize - 2) })} className="px-2 text-[12px] font-extrabold">A-</button>
          <span className="text-[12px] font-extrabold">{textStyle.fontSize}</span>
          <button type="button" onClick={() => onStyle({ fontSize: Math.min(34, textStyle.fontSize + 2) })} className="px-2 text-[12px] font-extrabold">A+</button>
        </div>
      ) : null}

      {activeTab === 'align' ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onStyle({ align: 'left' })}
            className={`flex h-9 items-center justify-center rounded-xl ${textStyle.align === 'left' ? 'bg-[#FFECA0]' : 'bg-[#F8F3EA]'}`}
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onStyle({ align: 'center' })}
            className={`flex h-9 items-center justify-center rounded-xl ${textStyle.align === 'center' ? 'bg-[#FFECA0]' : 'bg-[#F8F3EA]'}`}
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => onStyle({ align: 'right' })}
            className={`flex h-9 items-center justify-center rounded-xl ${textStyle.align === 'right' ? 'bg-[#FFECA0]' : 'bg-[#F8F3EA]'}`}
          >
            <AlignRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PenToolbar({ penStyle, onPenStyle, onClear }) {
  return (
    <div className="mx-4 rounded-[20px] border border-[#EEE0D1] bg-white/96 px-3 py-3 shadow-[0_10px_30px_rgba(59,36,24,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-[#3B2418]">펜/낙서</span>
        <button type="button" onClick={onClear} className="rounded-full bg-[#F8F3EA] px-3 py-1.5 text-[12px] font-bold text-[#A74831]">전체 지우기</button>
      </div>
      <div className="flex items-center gap-2">
        {Object.entries(PEN_WIDTHS).map(([key, width]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPenStyle({ widthKey: key, width })}
            className={`flex h-8 w-12 items-center justify-center rounded-xl ${penStyle.widthKey === key ? 'bg-[#FFECA0]' : 'bg-[#F8F3EA]'}`}
          >
            <span className="rounded-full bg-[#2C1A0E]" style={{ width: 22, height: Math.max(2, width / 2) }} />
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {PEN_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPenStyle({ color })}
            className="h-7 w-7 shrink-0 rounded-full"
            style={{
              backgroundColor: color,
              outline: penStyle.color === color ? '2px solid #6B3A2A' : '1px solid #E8DDD1',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function StickerToolbar({ onSticker }) {
  return (
    <div className="mx-auto flex h-[54px] w-fit items-center gap-2 rounded-[18px] bg-white/96 px-4 shadow-[0_10px_30px_rgba(59,36,24,0.12)]">
      {STICKERS.map((sticker) => (
        <button key={sticker} type="button" onClick={() => onSticker(sticker)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F3EA] text-[19px]">
          {sticker}
        </button>
      ))}
    </div>
  )
}

function MiniToolButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-[16px] px-3 py-2 text-[11px] font-extrabold transition"
      style={{
        backgroundColor: active ? '#FFF0A6' : 'transparent',
        color: active ? '#3B2418' : '#4B372B',
      }}
    >
      <Icon size={21} strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  )
}

function CompactMainToolbar({ cardType, editorMode, onText, onPen, onStickerMode, onPaperMode, onPickPhoto }) {
  const isTextActive = editorMode === EDITOR_MODE.TEXT || editorMode === EDITOR_MODE.OBJECT_SELECTED

  return (
    <div className="mx-auto flex h-[74px] max-w-[348px] items-center justify-around rounded-[24px] bg-white/96 px-3 shadow-[0_12px_34px_rgba(59,36,24,0.14)] backdrop-blur">
      {cardType === 'polaroid' ? (
        <MiniToolButton active={false} icon={Camera} label="사진" onClick={onPickPhoto} />
      ) : null}
      <MiniToolButton active={isTextActive} icon={Type} label="텍스트" onClick={onText} />
      <MiniToolButton active={editorMode === EDITOR_MODE.PEN} icon={PenLine} label="펜" onClick={onPen} />
      <MiniToolButton active={editorMode === 'sticker'} icon={Smile} label="꾸미기" onClick={onStickerMode} />
      {cardType === 'postit' ? (
        <MiniToolButton active={editorMode === 'paper'} icon={ImageIcon} label="종이" onClick={onPaperMode} />
      ) : null}
    </div>
  )
}

function CompactTextOptions({ textStyle, selectedObject, onStyle, onDelete }) {
  return (
    <div className="mx-auto mb-2 max-w-[348px] rounded-[20px] border border-[#EFE4D7] bg-white/96 px-3 py-2 shadow-[0_10px_28px_rgba(59,36,24,0.11)] backdrop-blur">
      <div className="flex items-center gap-2">
        {FONTS.slice(0, 3).map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onStyle({ fontFamily: font.family })}
            className="h-8 flex-1 rounded-xl text-[11px] font-extrabold"
            style={{
              backgroundColor: textStyle.fontFamily === font.family ? '#FFECA0' : '#F8F2EA',
              color: '#3B2418',
              fontFamily: font.family,
            }}
          >
            {font.id === 'basic' ? '기본' : font.id === 'mood' ? '감성' : '손글씨'}
          </button>
        ))}
        {selectedObject ? (
          <button type="button" onClick={onDelete} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F8F2EA] text-[#A74831]">
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {TEXT_COLORS.slice(0, 5).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onStyle({ color })}
              className="h-6 w-6 rounded-full"
              style={{
                backgroundColor: color,
                outline: textStyle.color === color ? '2px solid #6B3A2A' : '1px solid #E8DDD1',
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
        <div className="flex h-8 items-center rounded-xl bg-[#F8F2EA] text-[12px] font-extrabold text-[#3B2418]">
          <button type="button" onClick={() => onStyle({ fontSize: Math.max(15, textStyle.fontSize - 2) })} className="h-full px-3">A-</button>
          <span className="min-w-7 text-center">{textStyle.fontSize}</span>
          <button type="button" onClick={() => onStyle({ fontSize: Math.min(34, textStyle.fontSize + 2) })} className="h-full px-3">A+</button>
        </div>
      </div>
    </div>
  )
}

function CompactPenOptions({ penStyle, onPenStyle, onClear }) {
  return (
    <div className="mx-auto mb-2 max-w-[348px] rounded-[20px] border border-[#EFE4D7] bg-white/96 px-3 py-2 shadow-[0_10px_28px_rgba(59,36,24,0.11)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {Object.entries(PEN_WIDTHS).map(([key, width]) => (
            <button
              key={key}
              type="button"
              onClick={() => onPenStyle({ widthKey: key, width })}
              className="flex h-8 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: penStyle.widthKey === key ? '#FFECA0' : '#F8F2EA' }}
            >
              <span className="rounded-full bg-[#3B2418]" style={{ width: 20, height: Math.max(2, width / 2) }} />
            </button>
          ))}
        </div>
        <button type="button" onClick={onClear} className="h-8 rounded-xl bg-[#F8F2EA] px-3 text-[11px] font-extrabold text-[#A74831]">
          전체 지우기
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {PEN_COLORS.slice(0, 6).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPenStyle({ color })}
            className="h-6 w-6 rounded-full"
            style={{
              backgroundColor: color,
              outline: penStyle.color === color ? '2px solid #6B3A2A' : '1px solid #E8DDD1',
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CompactStickerOptions({ onSticker }) {
  return (
    <div className="mx-auto mb-2 flex h-12 max-w-[300px] items-center justify-center gap-2 rounded-[18px] bg-white/96 px-3 shadow-[0_10px_28px_rgba(59,36,24,0.11)] backdrop-blur">
      {STICKERS.map((sticker) => (
        <button key={sticker} type="button" onClick={() => onSticker(sticker)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F2EA] text-[17px]">
          {sticker}
        </button>
      ))}
    </div>
  )
}

function CompactPaperOptions({ currentTemplate }) {
  return (
    <div className="mx-auto mb-2 flex h-12 max-w-[300px] items-center justify-center gap-2 rounded-[18px] bg-white/96 px-3 shadow-[0_10px_28px_rgba(59,36,24,0.11)] backdrop-blur">
      {POSTIT_TEMPLATES.slice(0, 4).map((template) => (
        <button
          key={template.id}
          type="button"
          disabled={template.id !== currentTemplate?.id}
          className="h-8 w-8 rounded-lg border border-white shadow-sm disabled:opacity-45"
          style={{
            background: `linear-gradient(145deg, ${template.color}, #FFF8E7)`,
            outline: template.id === currentTemplate?.id ? '2px solid #9B4F3F' : '1px solid #E8DDD1',
            outlineOffset: 1,
          }}
          title={template.id === currentTemplate?.id ? '현재 종이' : '추후 연결 예정'}
        />
      ))}
    </div>
  )
}

function BottomTools({
  cardType,
  editorMode,
  selectedObject,
  postitTemplate,
  textStyle,
  penStyle,
  onText,
  onPen,
  onStickerMode,
  onPaperMode,
  onPickPhoto,
  onTextStyle,
  onPenStyle,
  onDelete,
  onClearStrokes,
  onSticker,
}) {
  if (!cardType) return null

  return (
    <div className="relative z-30 flex-none px-4 pb-4">
      {editorMode === EDITOR_MODE.TEXT || editorMode === EDITOR_MODE.OBJECT_SELECTED ? (
        <CompactTextOptions textStyle={textStyle} selectedObject={selectedObject} onStyle={onTextStyle} onDelete={onDelete} />
      ) : editorMode === EDITOR_MODE.PEN ? (
        <CompactPenOptions penStyle={penStyle} onPenStyle={onPenStyle} onClear={onClearStrokes} />
      ) : editorMode === 'sticker' ? (
        <CompactStickerOptions onSticker={onSticker} />
      ) : editorMode === 'paper' ? (
        <CompactPaperOptions currentTemplate={postitTemplate} />
      ) : null}
      <CompactMainToolbar
        cardType={cardType}
        editorMode={editorMode}
        onText={onText}
        onPen={onPen}
        onStickerMode={onStickerMode}
        onPaperMode={onPaperMode}
        onPickPhoto={onPickPhoto}
      />
    </div>
  )
}

function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'
  const fileInputRef = useRef(null)
  const pendingPhotoRef = useRef(false)
  const currentStrokeIdRef = useRef(null)

  const [step, setStep] = useState(EDITOR_STEP.EMPTY)
  const [cardType, setCardType] = useState(location.state?.initialTab === 'polaroid' ? 'polaroid' : null)
  const [postitTemplate, setPostitTemplate] = useState(POSTIT_TEMPLATES[0])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [pendingPhoto, setPendingPhoto] = useState(null)
  const [photoCrop, setPhotoCrop] = useState({ x: 0.5, y: 0.5, scale: 1 })
  const [objects, setObjects] = useState([])
  const [editorMode, setEditorMode] = useState(EDITOR_MODE.IDLE)
  const [selectedObjectId, setSelectedObjectId] = useState(null)
  const [editingObjectId, setEditingObjectId] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [textStyle, setTextStyle] = useState({
    align: 'center',
    color: '#2C1A0E',
    fontFamily: FONTS[1].family,
    fontSize: 22,
  })
  const [penStyle, setPenStyle] = useState({
    color: '#7F3D2E',
    width: PEN_WIDTHS.medium,
    widthKey: 'medium',
  })

  useEffect(() => {
    if (location.state?.initialTab === 'polaroid') {
      pendingPhotoRef.current = true
      setStep(EDITOR_STEP.EDITING)
      window.setTimeout(() => fileInputRef.current?.click(), 150)
    }
  }, [location.state?.initialTab])

  const selectedObject = useMemo(() => objects.find((object) => object.id === selectedObjectId) ?? null, [objects, selectedObjectId])
  const template = cardType ? CARD_TEMPLATE[cardType] : null
  const canComplete = cardType === 'postit'
    ? objects.some((object) => object.type === OBJECT_TYPE.TEXT && object.text.trim()) || objects.some((object) => object.type === OBJECT_TYPE.STROKE || object.type === OBJECT_TYPE.STICKER)
    : Boolean(selectedPhoto)

  const resetSelection = () => {
    setSelectedObjectId(null)
    setEditingObjectId(null)
    if (editorMode === EDITOR_MODE.OBJECT_SELECTED) setEditorMode(EDITOR_MODE.IDLE)
  }

  const addTextObject = (point, autoEdit = true) => {
    if (!template || !cardType) return null

    const bounds = template.textBounds
    const target = cardType === 'polaroid'
      ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
      : point

    if (!canUsePoint(target, bounds, template.excludedZones)) return null

    const objectWidth = cardType === 'polaroid' ? 0.68 : Math.min(bounds.width, 0.42)
    const objectHeight = cardType === 'polaroid' ? 0.09 : Math.min(bounds.height, 0.18)
    const object = clampObjectToBounds({
      id: createId('text'),
      type: OBJECT_TYPE.TEXT,
      text: '',
      x: target.x - objectWidth / 2,
      y: target.y - objectHeight / 2,
      width: objectWidth,
      height: objectHeight,
      style: { ...textStyle },
    }, bounds)

    setObjects((prev) => [...prev, object])
    setSelectedObjectId(object.id)
    setEditingObjectId(autoEdit ? object.id : null)
    setEditorMode(autoEdit ? EDITOR_MODE.TEXT : EDITOR_MODE.OBJECT_SELECTED)
    return object
  }

  const makeTextObject = (nextCardType, point, nextStyle = textStyle) => {
    const nextTemplate = CARD_TEMPLATE[nextCardType]
    const bounds = nextTemplate.textBounds
    const target = nextCardType === 'polaroid'
      ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
      : point
    const objectWidth = nextCardType === 'polaroid' ? 0.68 : Math.min(bounds.width, 0.42)
    const objectHeight = nextCardType === 'polaroid' ? 0.09 : Math.min(bounds.height, 0.18)

    return clampObjectToBounds({
      id: createId('text'),
      type: OBJECT_TYPE.TEXT,
      text: '',
      x: target.x - objectWidth / 2,
      y: target.y - objectHeight / 2,
      width: objectWidth,
      height: objectHeight,
      style: { ...nextStyle },
    }, bounds)
  }

  const createPostit = (templateItem) => {
    const textObject = makeTextObject('postit', {
      x: CARD_TEMPLATE.postit.textBounds.x + CARD_TEMPLATE.postit.textBounds.width / 2,
      y: CARD_TEMPLATE.postit.textBounds.y + CARD_TEMPLATE.postit.textBounds.height / 2,
    })

    setPostitTemplate(templateItem)
    setCardType('postit')
    setStep(EDITOR_STEP.EDITING)
    setObjects([textObject])
    setSelectedPhoto(null)
    setSelectedObjectId(textObject.id)
    setEditingObjectId(textObject.id)
    setEditorMode(EDITOR_MODE.TEXT)
  }

  const createPolaroid = () => {
    pendingPhotoRef.current = true
    setCardType('polaroid')
    setStep(EDITOR_STEP.TYPE_PICKER)
    setObjects([])
    setSelectedPhoto(null)
    setPendingPhoto(null)
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 })
    setEditorMode(EDITOR_MODE.IDLE)
    window.setTimeout(() => fileInputRef.current?.click(), 80)
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      if (pendingPhotoRef.current && !selectedPhoto && !pendingPhoto) {
        setCardType(null)
        setStep(EDITOR_STEP.EMPTY)
      }
      pendingPhotoRef.current = false
      return
    }

    pendingPhotoRef.current = false
    setCardType('polaroid')
    setPendingPhoto(URL.createObjectURL(file))
    setSelectedPhoto(null)
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 })
    setStep(EDITOR_STEP.PHOTO_CROP)
    setObjects([])
    setSelectedObjectId(null)
    setEditingObjectId(null)
    setEditorMode(EDITOR_MODE.IDLE)
  }

  const confirmPhotoCrop = () => {
    if (!pendingPhoto) return

    const textObject = makeTextObject('polaroid', {
      x: CARD_TEMPLATE.polaroid.textBounds.x + CARD_TEMPLATE.polaroid.textBounds.width / 2,
      y: CARD_TEMPLATE.polaroid.textBounds.y + CARD_TEMPLATE.polaroid.textBounds.height / 2,
    })

    setSelectedPhoto(pendingPhoto)
    setPendingPhoto(null)
    setStep(EDITOR_STEP.EDITING)
    setObjects([textObject])
    setSelectedObjectId(textObject.id)
    setEditingObjectId(textObject.id)
    setEditorMode(EDITOR_MODE.TEXT)
  }

  const cancelPhotoCrop = () => {
    setPendingPhoto(null)
    setSelectedPhoto(null)
    setCardType(null)
    setStep(EDITOR_STEP.TYPE_PICKER)
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 })
  }

  const handleCardTap = (point) => {
    if (!template || !cardType) return

    if (editorMode === EDITOR_MODE.TEXT) {
      addTextObject(point, true)
      return
    }

    if (cardType === 'postit' && editorMode === EDITOR_MODE.IDLE && objects.filter((object) => object.type === OBJECT_TYPE.TEXT).length === 0) {
      addTextObject(point, true)
      return
    }

    resetSelection()
  }

  const handleTextChange = (objectId, value) => {
    const text = Array.from(value ?? '').slice(0, MAX_TEXT_LENGTH).join('')
    setObjects((prev) => prev.map((object) => (object.id === objectId ? { ...object, text } : object)))
  }

  const handleFinishEdit = (objectId) => {
    setObjects((prev) => prev.filter((object) => object.type !== OBJECT_TYPE.TEXT || object.id !== objectId || object.text.trim()))
    setEditingObjectId(null)
    setEditorMode(objectId ? EDITOR_MODE.OBJECT_SELECTED : EDITOR_MODE.IDLE)
  }

  const handleSelectObject = (objectId) => {
    const object = objects.find((item) => item.id === objectId)
    if (!object) return

    setSelectedObjectId(objectId)
    setEditingObjectId(null)
    setEditorMode(EDITOR_MODE.OBJECT_SELECTED)
    if (object.type === OBJECT_TYPE.TEXT) {
      setTextStyle((prev) => ({ ...prev, ...object.style }))
    }
  }

  const handleTextStyle = (next) => {
    setTextStyle((prev) => ({ ...prev, ...next }))
    if (!selectedObjectId) return

    setObjects((prev) => prev.map((object) => (
      object.id === selectedObjectId && object.type === OBJECT_TYPE.TEXT
        ? { ...object, style: { ...object.style, ...next } }
        : object
    )))
  }

  const handleMoveObject = (objectId, nextObject) => {
    setObjects((prev) => prev.map((object) => (object.id === objectId ? nextObject : object)))
  }

  const deleteSelectedObject = () => {
    if (!selectedObjectId) return
    setObjects((prev) => prev.filter((object) => object.id !== selectedObjectId))
    setSelectedObjectId(null)
    setEditingObjectId(null)
    setEditorMode(EDITOR_MODE.IDLE)
  }

  const addSticker = (value) => {
    if (!template || !cardType) return
    const bounds = cardType === 'polaroid' ? template.imageBounds : template.textBounds
    const object = clampObjectToBounds({
      id: createId('sticker'),
      type: OBJECT_TYPE.STICKER,
      value,
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      width: 0.08,
      height: 0.08,
      size: 30,
      style: { color: '#EF4444' },
    }, bounds)
    setObjects((prev) => [...prev, object])
    setSelectedObjectId(object.id)
    setEditorMode(EDITOR_MODE.OBJECT_SELECTED)
  }

  const startStroke = (point) => {
    const stroke = {
      id: createId('stroke'),
      type: OBJECT_TYPE.STROKE,
      points: [{ ...point, size: penStyle.width, pressure: 0.5 }],
      style: { color: penStyle.color, width: penStyle.width },
    }
    currentStrokeIdRef.current = stroke.id
    setObjects((prev) => [...prev, stroke])
  }

  const appendStroke = (point) => {
    const strokeId = currentStrokeIdRef.current
    if (!strokeId) return

    setObjects((prev) => prev.map((object) => (
      object.id === strokeId
        ? { ...object, points: [...object.points, { ...point, size: object.style.width, pressure: 0.5 }] }
        : object
    )))
  }

  const endStroke = () => {
    currentStrokeIdRef.current = null
  }

  const clearStrokes = () => {
    currentStrokeIdRef.current = null
    setObjects((prev) => prev.filter((object) => object.type !== OBJECT_TYPE.STROKE))
  }

  const exportImage = async () => {
    if (!cardType) return ''

    const size = cardType === 'polaroid' ? POLAROID_SIZE : POSTIT_SIZE
    const exportCrop = cardType === 'postit' ? POSTIT_EXPORT_CROP : { x: 0, y: 0, width: 1, height: 1 }
    const W = 700
    const H = Math.round(W * ((size.height * exportCrop.height) / (size.width * exportCrop.width)))
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = W
    canvas.height = H

    if (cardType === 'postit') {
      const paper = await loadImage(postitImage)
      ctx.drawImage(
        paper,
        POSTIT_SOURCE_CROP.x + POSTIT_SOURCE_CROP.width * exportCrop.x,
        POSTIT_SOURCE_CROP.y + POSTIT_SOURCE_CROP.height * exportCrop.y,
        POSTIT_SOURCE_CROP.width * exportCrop.width,
        POSTIT_SOURCE_CROP.height * exportCrop.height,
        0,
        0,
        W,
        H,
      )
    } else {
      if (selectedPhoto) {
        const photo = await loadImage(selectedPhoto)
        const photoRect = boundsToPixels(CARD_TEMPLATE.polaroid.imageBounds, W, H)
        ctx.save()
        ctx.rect(photoRect.x, photoRect.y, photoRect.width, photoRect.height)
        ctx.clip()
        drawImageWithCrop(ctx, photo, photoRect.x, photoRect.y, photoRect.width, photoRect.height, photoCrop)
        ctx.restore()
      }
      const frame = await loadImage(polaroidFrame)
      ctx.drawImage(
        frame,
        POLAROID_SOURCE_CROP.x,
        POLAROID_SOURCE_CROP.y,
        POLAROID_SOURCE_CROP.width,
        POLAROID_SOURCE_CROP.height,
        0,
        0,
        W,
        H,
      )
    }

    const activeTemplate = CARD_TEMPLATE[cardType]
    objects.forEach((object) => {
      if (object.type === OBJECT_TYPE.STROKE) {
        const strokeBounds = remapBoundsToCrop(activeTemplate.drawBounds, exportCrop)
        const bounds = boundsToPixels(strokeBounds, W, H)
        const outline = getStroke(
          object.points
            .map((point) => remapPointToCrop(point, exportCrop))
            .map((point) => [point.x * W, point.y * H, point.pressure ?? 0.5]),
          {
            ...FREEHAND_OPTIONS,
            size: object.style.width * (W / 310),
          },
        )

        if (!outline.length) return

        ctx.save()
        ctx.beginPath()
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
        ctx.clip()
        ctx.fillStyle = object.style.color
        ctx.beginPath()
        outline.forEach(([x, y], index) => {
          if (index === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        return
      }

      const objectBounds = remapBoundsToCrop({
        x: object.x,
        y: object.y,
        width: object.width ?? 0.1,
        height: object.height ?? 0.1,
      }, exportCrop)
      const x = objectBounds.x * W
      const y = objectBounds.y * H
      const width = objectBounds.width * W
      const height = objectBounds.height * H
      const fontSize = object.type === OBJECT_TYPE.STICKER ? object.size ?? 30 : object.style.fontSize ?? 22

      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()
      ctx.fillStyle = object.style?.color ?? '#2C1A0E'
      ctx.textAlign = object.style?.align ?? 'center'
      ctx.textBaseline = 'top'
      ctx.font = `${fontSize * (W / 310)}px ${object.style?.fontFamily ?? FONTS[1].family}`

      if (object.type === OBJECT_TYPE.STICKER) {
        ctx.fillText(object.value, x, y)
      } else {
        const lineHeight = fontSize * (W / 310) * 1.35
        const maxLines = Math.max(1, Math.floor(height / lineHeight))
        const lines = wrapLines(ctx, object.text, width, maxLines)
        const alignX = object.style?.align === 'left' ? x : object.style?.align === 'right' ? x + width : x + width / 2
        lines.forEach((line, index) => ctx.fillText(line, alignX, y + index * lineHeight))
      }
      ctx.restore()
    })

    return cropCanvasByAlpha(canvas).toDataURL('image/png')
  }

  const complete = async () => {
    if (!canComplete || isCompleting || !cardType) return
    setIsCompleting(true)
    setEditorError('')
    setSelectedObjectId(null)
    setEditingObjectId(null)
    await new Promise((resolve) => setTimeout(resolve, 80))

    try {
      const capturedImage = await exportImage()
      navigate(`/board/${boardId}`, {
        state: {
          placementDraft: {
            id: `${cardType}-${Date.now()}`,
            type: cardType,
            capturedImage,
            content: objects
              .filter((object) => object.type === OBJECT_TYPE.TEXT)
              .map((object) => object.text)
              .filter(Boolean)
              .join('\n'),
            media: cardType === 'polaroid' ? { image: selectedPhoto ?? '', dateLabel: today(), crop: photoCrop } : undefined,
            style: {
              cardType,
              capturedAspectRatio: cardType === 'postit' ? POSTIT_EXPORT_ASPECT_RATIO : POLAROID_SIZE.width / POLAROID_SIZE.height,
              objects,
              penStyle,
              photoCrop,
              postitTemplate,
              textStyle,
            },
            createdAt: new Date().toISOString(),
          },
        },
      })
    } catch {
      setEditorError('흔적 이미지를 준비하지 못했어요. 다시 시도해주세요.')
      setIsCompleting(false)
    }
  }

  return (
    <motion.main
      className="app-device"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: '#FBF7F1',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img src={bgImage} aria-hidden draggable={false} className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-white/20" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <EditorHeaderV2
        isCompleting={isCompleting}
        canComplete={canComplete}
        onClose={() => navigate(-1)}
        onComplete={complete}
      />

      {editorError ? (
        <p className="relative z-30 mx-5 rounded-xl bg-red-50 px-4 py-2 text-center text-[12px] font-bold text-red-500">{editorError}</p>
      ) : null}

      <section
        className="relative z-10 min-h-0 flex-1"
        onClick={() => {
          if (editorMode === EDITOR_MODE.OBJECT_SELECTED) resetSelection()
        }}
      >
        {step === EDITOR_STEP.EMPTY || !cardType ? (
          <EmptyStage />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-2 pb-[118px] pt-1">
            <EditableCard
              cardType={cardType}
              postitTemplate={postitTemplate}
              selectedPhoto={selectedPhoto}
              photoCrop={photoCrop}
              objects={objects}
              editorMode={editorMode}
              selectedObjectId={selectedObjectId}
              editingObjectId={editingObjectId}
              onPickPhoto={() => fileInputRef.current?.click()}
              onCardTap={handleCardTap}
              onStartStroke={startStroke}
              onAppendStroke={appendStroke}
              onEndStroke={endStroke}
              onSelectObject={handleSelectObject}
              onStartEdit={(objectId) => {
                setSelectedObjectId(objectId)
                setEditingObjectId(objectId)
                setEditorMode(EDITOR_MODE.TEXT)
              }}
              onTextChange={handleTextChange}
              onFinishEdit={handleFinishEdit}
              onMoveObject={handleMoveObject}
            />
          </div>
        )}

        <AnimatePresence>
          {step === EDITOR_STEP.TYPE_PICKER ? (
            <TypePicker onPickPostit={() => setStep(EDITOR_STEP.POSTIT_PICKER)} onPickPolaroid={createPolaroid} />
          ) : null}
          {step === EDITOR_STEP.POSTIT_PICKER ? <PostitPicker onPick={createPostit} onCancel={() => setStep(EDITOR_STEP.TYPE_PICKER)} /> : null}
          {step === EDITOR_STEP.PHOTO_CROP ? (
            <PhotoCropScreen
              photo={pendingPhoto}
              crop={photoCrop}
              onCrop={setPhotoCrop}
              onCancel={cancelPhotoCrop}
              onConfirm={confirmPhotoCrop}
            />
          ) : null}
        </AnimatePresence>

        <AddDock
          step={step}
          onOpenPicker={() => setStep(EDITOR_STEP.TYPE_PICKER)}
          onBackToEmpty={() => setStep(EDITOR_STEP.EMPTY)}
        />
      </section>

      <BottomTools
        cardType={cardType}
        editorMode={editorMode}
        selectedObject={selectedObject}
        postitTemplate={postitTemplate}
        textStyle={textStyle}
        penStyle={penStyle}
        onText={() => {
          setEditorMode(EDITOR_MODE.TEXT)
          setSelectedObjectId(null)
          setEditingObjectId(null)
        }}
        onPen={() => {
          setEditorMode(EDITOR_MODE.PEN)
          setSelectedObjectId(null)
          setEditingObjectId(null)
        }}
        onStickerMode={() => setEditorMode('sticker')}
        onPaperMode={() => setEditorMode('paper')}
        onPickPhoto={() => fileInputRef.current?.click()}
        onTextStyle={handleTextStyle}
        onPenStyle={(next) => setPenStyle((prev) => ({ ...prev, ...next }))}
        onDelete={deleteSelectedObject}
        onClearStrokes={clearStrokes}
        onSticker={addSticker}
      />
    </motion.main>
  )
}

export default PostItEditor
