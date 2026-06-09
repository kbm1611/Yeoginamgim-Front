import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Eraser,
  MoreHorizontal,
  PenLine,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import polaroidFrame from '../assets/images/recent-trace-default-polaroid.png'

const EDITOR_MODE = {
  IDLE: 'idle',
  TEXT_EDITING: 'textEditing',
  TEXT_SELECTED: 'textSelected',
  PEN: 'pen',
}

const FONT_OPTIONS = [
  { id: 'basic', label: '기본체', family: "'Pretendard', sans-serif" },
  { id: 'mood', label: '감성체', family: "'Noto Serif KR', serif" },
  { id: 'hand', label: '손글씨체', family: "'Nanum Pen Script', 'Gaegu', cursive" },
]

const COLOR_OPTIONS = [
  { id: 'black', label: '검정', value: '#2C1A0E' },
  { id: 'gray', label: '진회색', value: '#5F5850' },
  { id: 'brown', label: '브라운', value: '#7A4A2B' },
  { id: 'pink', label: '핑크', value: '#C45D75' },
  { id: 'blue', label: '블루', value: '#2F6F9F' },
]

const SIZE_OPTIONS = [
  { id: 'S', label: 'S', value: 20 },
  { id: 'M', label: 'M', value: 25 },
  { id: 'L', label: 'L', value: 31 },
]

const PEN_COLORS = ['#2C1A0E', '#C45D5D', '#D99828', '#2F8F63', '#2F6F9F']
const PEN_WIDTHS = [
  { key: 'thin', size: 3 },
  { key: 'medium', size: 6 },
  { key: 'thick', size: 10 },
]

const SAFE_BOUNDS = {
  postit: { x: 12, y: 17, width: 76, height: 70 },
  photocard: { x: 13, y: 81, width: 74, height: 13 },
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clampTextObject(object, bounds) {
  return {
    ...object,
    x: clamp(object.x, bounds.x, bounds.x + bounds.width - object.width),
    y: clamp(object.y, bounds.y, bounds.y + bounds.height - object.height),
  }
}

function createTextObject(cardType) {
  const bounds = SAFE_BOUNDS[cardType]
  const width = cardType === 'photocard' ? 64 : 50
  const height = cardType === 'photocard' ? 9 : 22

  return clampTextObject({
    id: createId('text'),
    type: 'text',
    x: bounds.x + bounds.width / 2 - width / 2,
    y: bounds.y + bounds.height / 2 - height / 2,
    width,
    height,
    text: '',
    fontFamily: FONT_OPTIONS[2].family,
    fontSize: 'M',
    color: COLOR_OPTIONS[0].value,
    align: 'center',
  }, bounds)
}

function getFontSize(sizeId) {
  return SIZE_OPTIONS.find((option) => option.id === sizeId)?.value ?? SIZE_OPTIONS[1].value
}

function getPointOnCard(event, cardElement) {
  const rect = cardElement?.getBoundingClientRect()
  if (!rect) return null

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  }
}

function Header({ canSave, isSaving, onClose, onSave }) {
  return (
    <header className="relative z-20 flex h-[56px] flex-none items-center justify-between px-4">
      <button type="button" onClick={onClose} aria-label="닫기" className="flex h-10 w-10 items-center justify-center text-[#2C1A0E]">
        <X size={24} strokeWidth={2} />
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-extrabold text-[#1F140E]">흔적 남기기</h1>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="h-10 min-w-[58px] rounded-full px-3 text-[14px] font-extrabold text-white shadow-[0_8px_18px_rgba(97,49,36,0.14)] disabled:opacity-45"
        style={{ backgroundColor: canSave && !isSaving ? '#6B3A2A' : '#D8B3A5' }}
      >
        {isSaving ? '저장 중' : '남기기'}
      </button>
    </header>
  )
}

function TypeSelector({ cardType, onChange }) {
  return (
    <div className="relative z-20 flex h-[44px] flex-none items-center px-5">
      <div className="grid h-9 w-full grid-cols-2 rounded-full bg-[#EDE2D4] p-1">
        {[
          ['postit', '포스트잇'],
          ['photocard', '포토카드'],
        ].map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`rounded-full text-[13px] font-extrabold transition ${
              cardType === type ? 'bg-white text-[#2C1A0E] shadow-sm' : 'text-[#7A6250]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StrokeLayer({ strokes }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {strokes.map((stroke) => (
        <polyline
          key={stroke.id}
          points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke={stroke.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={stroke.width}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

function FloatingTextMenu({ object, onDelete, onDuplicate }) {
  return (
    <div
      className="absolute z-50 flex h-10 items-center gap-1 rounded-full bg-white/96 px-1.5 shadow-[0_8px_20px_rgba(62,42,30,0.14)]"
      style={{
        left: `${object.x + object.width / 2}%`,
        top: `${Math.max(2, object.y - 3)}%`,
        transform: 'translate(-50%, -100%)',
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={onDelete} aria-label="삭제" className="flex h-8 w-8 items-center justify-center rounded-full text-[#A74831] active:bg-[#F6EFE6]">
        <Trash2 size={15} />
      </button>
      <button type="button" onClick={onDuplicate} aria-label="복제" className="flex h-8 w-8 items-center justify-center rounded-full text-[#4B372B] active:bg-[#F6EFE6]">
        <Copy size={15} />
      </button>
      <button type="button" aria-label="더보기" className="flex h-8 w-8 items-center justify-center rounded-full text-[#4B372B] active:bg-[#F6EFE6]">
        <MoreHorizontal size={17} />
      </button>
    </div>
  )
}

function TextObject({
  object,
  selected,
  editing,
  onSelect,
  onStartEdit,
  onChangeText,
  onFinishEdit,
  onStartDrag,
}) {
  const movedRef = useRef(false)
  const fontSize = getFontSize(object.fontSize)

  return (
    <div
      className={`absolute z-40 touch-none rounded-[9px] px-1.5 py-1 ${
        selected && !editing ? 'outline outline-2 outline-[#F0C14B]' : ''
      }`}
      style={{
        color: object.color,
        fontFamily: object.fontFamily,
        fontSize,
        height: `${object.height}%`,
        left: `${object.x}%`,
        lineHeight: 1.18,
        textAlign: object.align,
        top: `${object.y}%`,
        width: `${object.width}%`,
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (movedRef.current) {
          movedRef.current = false
          return
        }
        if (editing) return
        onSelect(object.id)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onStartEdit(object.id)
      }}
      onPointerDown={(event) => {
        if (editing) return
        event.stopPropagation()
        movedRef.current = false
        onStartDrag(event, object, () => {
          movedRef.current = true
        })
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          value={object.text}
          onChange={(event) => onChangeText(object.id, event.target.value)}
          onBlur={() => onFinishEdit(object.id)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          maxLength={160}
          className="h-full w-full resize-none overflow-hidden bg-transparent p-0 outline-none"
          style={{
            color: object.color,
            fontFamily: object.fontFamily,
            fontSize,
            lineHeight: 1.18,
            textAlign: object.align,
          }}
          placeholder="이곳의 기억을 남겨보세요"
        />
      ) : (
        <div className="h-full w-full whitespace-pre-wrap break-keep overflow-hidden">
          {object.text || 'Aa'}
        </div>
      )}
    </div>
  )
}

function EditorCard({
  cardType,
  textObjects,
  selectedTextId,
  editingTextId,
  editorMode,
  strokes,
  selectedPhoto,
  onPickPhoto,
  onSelectText,
  onStartTextEdit,
  onTextChange,
  onFinishTextEdit,
  onStartTextDrag,
  onDeleteText,
  onDuplicateText,
  onStartStroke,
  onAppendStroke,
  onEndStroke,
}) {
  const cardRef = useRef(null)
  const selectedObject = textObjects.find((object) => object.id === selectedTextId)

  const handleStrokeStart = (event) => {
    if (editorMode !== EDITOR_MODE.PEN) return

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = getPointOnCard(event, cardRef.current)
    if (!point) return
    onStartStroke(point)
  }

  const handleStrokeMove = (event) => {
    if (editorMode !== EDITOR_MODE.PEN || event.buttons !== 1) return

    const point = getPointOnCard(event, cardRef.current)
    if (!point) return
    onAppendStroke(point)
  }

  return (
    <div
      ref={cardRef}
      data-editor-card
      className="relative shrink-0"
      style={{
        aspectRatio: cardType === 'photocard' ? '512 / 512' : '1 / 1',
        cursor: editorMode === EDITOR_MODE.PEN ? 'crosshair' : 'default',
        overflow: cardType === 'photocard' ? 'hidden' : 'visible',
        width: cardType === 'photocard' ? 'min(84vw, 344px)' : 'min(82vw, 336px)',
      }}
      onPointerCancel={onEndStroke}
      onPointerDown={handleStrokeStart}
      onPointerMove={handleStrokeMove}
      onPointerUp={onEndStroke}
    >
      {cardType === 'postit' ? (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-[8px] bg-[linear-gradient(155deg,#FFECA8_0%,#FFE08A_58%,#F6CF6E_100%)] shadow-[0_18px_32px_rgba(72,48,22,0.18)]" />
          <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-8 w-28 -translate-x-1/2 -translate-y-3 rotate-[-3deg] rounded-[4px] bg-[#EAD2B7]/80 shadow-[0_3px_8px_rgba(52,34,16,0.08)]" />
          <span className="pointer-events-none absolute left-1/2 top-4 z-10 h-5 w-5 -translate-x-1/2 rounded-full bg-white/72 shadow-[0_2px_7px_rgba(58,39,20,0.16)]" />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onPickPhoto}
            className="absolute left-[6.4%] top-[6.1%] z-10 flex h-[74.4%] w-[87%] items-center justify-center overflow-hidden bg-[#F4ECE1] text-[13px] font-bold text-[#8A715D]"
          >
            {selectedPhoto ? <img src={selectedPhoto} alt="" className="h-full w-full object-cover" /> : '사진 추가'}
          </button>
          <img src={polaroidFrame} alt="" draggable={false} className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill" />
        </>
      )}

      <StrokeLayer strokes={strokes} />

      {textObjects.map((object) => (
        <TextObject
          key={object.id}
          object={object}
          selected={object.id === selectedTextId}
          editing={object.id === editingTextId}
          onSelect={onSelectText}
          onStartEdit={onStartTextEdit}
          onChangeText={onTextChange}
          onFinishEdit={onFinishTextEdit}
          onStartDrag={onStartTextDrag}
        />
      ))}

      {editorMode === EDITOR_MODE.TEXT_SELECTED && selectedObject ? (
        <FloatingTextMenu
          object={selectedObject}
          onDelete={() => onDeleteText(selectedObject.id)}
          onDuplicate={() => onDuplicateText(selectedObject.id)}
        />
      ) : null}
    </div>
  )
}

function PenPanel({ penStyle, onPenStyle, onClearStrokes }) {
  return (
    <div
      className="mx-auto mt-4 w-[min(86vw,360px)] rounded-[18px] bg-white/92 px-4 py-3 shadow-[0_8px_22px_rgba(62,42,30,0.10)]"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {PEN_WIDTHS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onPenStyle({ widthKey: item.key, width: item.size })}
              aria-label={`펜 굵기 ${item.key}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${penStyle.widthKey === item.key ? 'bg-[#FFE69A]' : 'bg-[#F6EFE6]'}`}
            >
              <span className="rounded-full bg-[#2C1A0E]" style={{ height: item.size + 3, width: item.size + 3 }} />
            </button>
          ))}
        </div>
        <button type="button" onClick={onClearStrokes} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6EFE6] text-[#8D3D2E]">
          <Eraser size={16} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {PEN_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPenStyle({ color })}
            aria-label={`펜 색상 ${color}`}
            className="h-7 w-7 rounded-full"
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

function TextOptionsPanel({ selectedObject, onTextStyle }) {
  if (!selectedObject) return null

  return (
    <div
      className="mx-auto mt-4 w-[min(88vw,368px)] rounded-[18px] bg-white/92 px-3 py-3 shadow-[0_8px_22px_rgba(62,42,30,0.10)]"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-2">
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onTextStyle({ fontFamily: font.family })}
            className={`h-9 rounded-full text-[12px] font-extrabold ${
              selectedObject.fontFamily === font.family ? 'bg-[#FFE69A] text-[#2C1A0E]' : 'bg-[#F6EFE6] text-[#6B5545]'
            }`}
            style={{ fontFamily: font.family }}
          >
            {font.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onTextStyle({ color: color.value })}
              aria-label={`글자 색상 ${color.label}`}
              className="h-6 w-6 rounded-full"
              style={{
                backgroundColor: color.value,
                outline: selectedObject.color === color.value ? '2px solid #6B3A2A' : '1px solid #E8DDD1',
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
        <div className="flex h-8 items-center rounded-full bg-[#F6EFE6] px-1 text-[12px] font-extrabold text-[#3B2418]">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onTextStyle({ fontSize: size.id })}
              className={`h-7 w-8 rounded-full ${selectedObject.fontSize === size.id ? 'bg-white' : ''}`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex h-9 w-fit items-center rounded-full bg-[#F6EFE6] px-1">
        {[
          ['left', AlignLeft],
          ['center', AlignCenter],
          ['right', AlignRight],
        ].map(([align, Icon]) => (
          <button
            key={align}
            type="button"
            onClick={() => onTextStyle({ align })}
            className={`flex h-7 w-8 items-center justify-center rounded-full ${selectedObject.align === align ? 'bg-white' : ''}`}
            aria-label={`정렬 ${align}`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}

function ContextArea({ editorMode, selectedObject, penStyle, onTextStyle, onPenStyle, onClearStrokes }) {
  if (editorMode === EDITOR_MODE.TEXT_EDITING || editorMode === EDITOR_MODE.IDLE) return <div className="mt-4 h-[130px]" />

  if (editorMode === EDITOR_MODE.PEN) {
    return <PenPanel penStyle={penStyle} onPenStyle={onPenStyle} onClearStrokes={onClearStrokes} />
  }

  return <TextOptionsPanel selectedObject={selectedObject} onTextStyle={onTextStyle} />
}

function BottomToolDock({ editorMode, onText, onPen }) {
  return (
    <div className="relative z-30 flex h-[84px] flex-none items-start justify-center px-5 pb-5 pt-2">
      <div className="flex h-[56px] w-[172px] items-center justify-center gap-3 rounded-full bg-white/94 shadow-[0_10px_28px_rgba(62,42,30,0.14)]">
        <button
          type="button"
          onClick={onText}
          aria-label="텍스트"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${editorMode === EDITOR_MODE.TEXT_SELECTED || editorMode === EDITOR_MODE.TEXT_EDITING ? 'bg-[#FFE69A]' : 'bg-[#F6EFE6]'}`}
        >
          <Type size={20} />
        </button>
        <button
          type="button"
          onClick={onPen}
          aria-label="펜"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${editorMode === EDITOR_MODE.PEN ? 'bg-[#FFE69A]' : 'bg-[#F6EFE6]'}`}
        >
          <PenLine size={20} />
        </button>
      </div>
    </div>
  )
}

function PostItEditorV2() {
  const navigate = useNavigate()
  const { id } = useParams()
  const boardId = id ?? 'default'
  const fileInputRef = useRef(null)
  const activeStrokeIdRef = useRef(null)
  const dragRef = useRef(null)
  const [cardType, setCardType] = useState('postit')
  const [selectedPhoto, setSelectedPhoto] = useState('')
  const [editorMode, setEditorMode] = useState(EDITOR_MODE.IDLE)
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [editingTextId, setEditingTextId] = useState(null)
  const [textObjects, setTextObjects] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [strokes, setStrokes] = useState([])
  const [penStyle, setPenStyle] = useState({
    color: '#2C1A0E',
    width: 6,
    widthKey: 'medium',
  })

  const selectedObject = useMemo(
    () => textObjects.find((object) => object.id === selectedTextId) ?? null,
    [selectedTextId, textObjects],
  )
  const canSave = useMemo(() => {
    if (cardType === 'photocard') return Boolean(selectedPhoto)
    return textObjects.some((object) => object.text.trim()) || strokes.length > 0
  }, [cardType, selectedPhoto, strokes.length, textObjects])

  const updateTextObject = (objectId, updater) => {
    setTextObjects((prev) => prev.map((object) => {
      if (object.id !== objectId) return object
      const next = typeof updater === 'function' ? updater(object) : { ...object, ...updater }
      return clampTextObject(next, SAFE_BOUNDS[cardType])
    }))
  }

  const addTextObject = () => {
    const object = createTextObject(cardType)
    setTextObjects((prev) => [...prev, object])
    setSelectedTextId(object.id)
    setEditingTextId(object.id)
    setEditorMode(EDITOR_MODE.TEXT_EDITING)
  }

  const finishTextEdit = (objectId) => {
    const object = textObjects.find((item) => item.id === objectId)
    if (!object?.text.trim()) {
      setTextObjects((prev) => prev.filter((item) => item.id !== objectId))
      setSelectedTextId(null)
      setEditingTextId(null)
      setEditorMode(EDITOR_MODE.IDLE)
      return
    }

    setEditingTextId(null)
    setSelectedTextId(null)
    setEditorMode(EDITOR_MODE.IDLE)
  }

  const selectText = (objectId) => {
    setSelectedTextId(objectId)
    setEditingTextId(null)
    setEditorMode(EDITOR_MODE.TEXT_SELECTED)
  }

  const startTextEdit = (objectId) => {
    setSelectedTextId(objectId)
    setEditingTextId(objectId)
    setEditorMode(EDITOR_MODE.TEXT_EDITING)
  }

  const updateSelectedTextStyle = (nextStyle) => {
    if (!selectedTextId) return
    updateTextObject(selectedTextId, nextStyle)
    setEditorMode(EDITOR_MODE.TEXT_SELECTED)
  }

  const deleteText = (objectId) => {
    setTextObjects((prev) => prev.filter((object) => object.id !== objectId))
    if (selectedTextId === objectId) setSelectedTextId(null)
    if (editingTextId === objectId) setEditingTextId(null)
    setEditorMode(EDITOR_MODE.IDLE)
  }

  const duplicateText = (objectId) => {
    const object = textObjects.find((item) => item.id === objectId)
    if (!object) return

    const duplicate = clampTextObject({
      ...object,
      id: createId('text'),
      x: object.x + 5,
      y: object.y + 5,
    }, SAFE_BOUNDS[cardType])

    setTextObjects((prev) => [...prev, duplicate])
    setSelectedTextId(duplicate.id)
    setEditorMode(EDITOR_MODE.TEXT_SELECTED)
  }

  const startTextDrag = (event, object, markMoved) => {
    if (editorMode !== EDITOR_MODE.TEXT_SELECTED || selectedTextId !== object.id) {
      selectText(object.id)
      return
    }

    const cardElement = event.currentTarget.closest('[data-editor-card]')
    const startPoint = getPointOnCard(event, cardElement)
    if (!startPoint) return

    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      id: object.id,
      startPoint,
      startX: object.x,
      startY: object.y,
      markMoved,
    }

    const move = (moveEvent) => {
      if (!dragRef.current || dragRef.current.id !== object.id) return
      const point = getPointOnCard(moveEvent, cardElement)
      if (!point) return

      const dx = point.x - dragRef.current.startPoint.x
      const dy = point.y - dragRef.current.startPoint.y
      if (Math.hypot(dx, dy) > 1.2) dragRef.current.markMoved?.()
      updateTextObject(object.id, {
        x: dragRef.current.startX + dx,
        y: dragRef.current.startY + dy,
      })
    }

    const end = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const startStroke = (point) => {
    const id = createId('stroke')
    activeStrokeIdRef.current = id
    setStrokes((prev) => [...prev, { id, color: penStyle.color, width: penStyle.width, points: [point] }])
  }

  const appendStroke = (point) => {
    const id = activeStrokeIdRef.current
    if (!id) return
    setStrokes((prev) => prev.map((stroke) => (stroke.id === id ? { ...stroke, points: [...stroke.points, point] } : stroke)))
  }

  const endStroke = () => {
    activeStrokeIdRef.current = null
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSelectedPhoto(URL.createObjectURL(file))
    setEditorMode(EDITOR_MODE.IDLE)
  }

  const changeCardType = (type) => {
    setCardType(type)
    setEditorMode(EDITOR_MODE.IDLE)
    setEditingTextId(null)
    setSelectedTextId(null)
    setTextObjects((prev) => prev.map((object) => clampTextObject(object, SAFE_BOUNDS[type])))
    if (type === 'photocard' && !selectedPhoto) window.setTimeout(() => fileInputRef.current?.click(), 60)
  }

  const save = async () => {
    if (!canSave || isSaving) return
    setIsSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 80))
    navigate(`/board/${boardId}`, {
      state: {
        placementDraft: {
          id: `${cardType}-${Date.now()}`,
          type: cardType === 'photocard' ? 'polaroid' : 'postit',
          content: textObjects.map((object) => object.text).filter(Boolean).join('\n'),
          media: cardType === 'photocard' ? { image: selectedPhoto, dateLabel: today() } : undefined,
          style: {
            editorVersion: 'v2',
            textObjects,
            strokes,
            penStyle,
            cardType,
          },
          createdAt: new Date().toISOString(),
        },
      },
    })
  }

  return (
    <main className="app-device relative flex flex-col overflow-hidden bg-[#FBF7F1]" style={{ letterSpacing: 0 }}>
      <div className="pointer-events-none absolute inset-0 bg-[#FBF7F1]" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <Header canSave={canSave} isSaving={isSaving} onClose={() => navigate(-1)} onSave={save} />
      <TypeSelector cardType={cardType} onChange={changeCardType} />

      <section
        className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-3"
        onClick={() => {
          if (editorMode === EDITOR_MODE.TEXT_SELECTED) {
            setSelectedTextId(null)
            setEditorMode(EDITOR_MODE.IDLE)
          }
        }}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <EditorCard
            cardType={cardType}
            textObjects={textObjects}
            selectedTextId={selectedTextId}
            editingTextId={editingTextId}
            editorMode={editorMode}
            strokes={strokes}
            selectedPhoto={selectedPhoto}
            onPickPhoto={() => fileInputRef.current?.click()}
            onSelectText={selectText}
            onStartTextEdit={startTextEdit}
            onTextChange={(objectId, text) => updateTextObject(objectId, { text })}
            onFinishTextEdit={finishTextEdit}
            onStartTextDrag={startTextDrag}
            onDeleteText={deleteText}
            onDuplicateText={duplicateText}
            onStartStroke={startStroke}
            onAppendStroke={appendStroke}
            onEndStroke={endStroke}
          />
          <ContextArea
            editorMode={editorMode}
            selectedObject={selectedObject}
            penStyle={penStyle}
            onTextStyle={updateSelectedTextStyle}
            onPenStyle={(nextStyle) => setPenStyle((prev) => ({ ...prev, ...nextStyle }))}
            onClearStrokes={() => setStrokes([])}
          />
        </div>
      </section>

      <BottomToolDock
        editorMode={editorMode}
        onText={addTextObject}
        onPen={() => {
          setEditingTextId(null)
          setSelectedTextId(null)
          setEditorMode((mode) => (mode === EDITOR_MODE.PEN ? EDITOR_MODE.IDLE : EDITOR_MODE.PEN))
        }}
      />
    </main>
  )
}

export default PostItEditorV2
