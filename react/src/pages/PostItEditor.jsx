import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createTrace, uploadTraceImage } from '../api/traces'
import postitYellow from '../assets/postit/yellow.png'

const tabs = [
  { key: 'polaroid', label: '포토카드', Icon: Camera },
  { key: 'postit', label: '포스트잇', Icon: StickyNote },
]

const postitPalette = [
  { key: 'yellow', label: '노랑', hex: '#F3D98E', texture: postitYellow },
  { key: 'pink', label: '분홍', hex: '#EEB7C6', texture: null },
  { key: 'green', label: '초록', hex: '#D2D4A2', texture: null },
  { key: 'cream', label: '크림', hex: '#F0EAD6', texture: null },
  { key: 'white', label: '흰색', hex: '#F8F6F0', texture: null },
]

const polaroidBackgroundPalette = [
  { key: 'white', label: '흰색', hex: '#FFFFFF' },
  { key: 'cream', label: '크림', hex: '#F6EFE2' },
  { key: 'pink', label: '분홍', hex: '#F8E4EA' },
  { key: 'green', label: '초록', hex: '#E7E8CF' },
]

const textColorPalette = [
  { key: 'brown', label: '갈색', hex: '#2D2218' },
  { key: 'red', label: '빨강', hex: '#9B2F2F' },
  { key: 'blue', label: '파랑', hex: '#315D8A' },
  { key: 'green', label: '초록', hex: '#3F6F4B' },
  { key: 'black', label: '검정', hex: '#19130F' },
]

const fontOptions = [
  { key: 'pen', label: '손글씨', family: "'Nanum Pen Script', 'Gaegu', cursive" },
  { key: 'round', label: '둥근글씨', family: "'Gaegu', 'Nanum Pen Script', cursive" },
  { key: 'serif', label: '명조', family: "'Noto Serif KR', serif" },
  { key: 'sans', label: '고딕', family: "'Pretendard', 'Noto Sans KR', sans-serif" },
]

const fontSizeOptions = [
  { key: 'small', label: '작게', polaroid: 22, postit: 24 },
  { key: 'medium', label: '보통', polaroid: 26, postit: 28 },
  { key: 'large', label: '크게', polaroid: 30, postit: 32 },
]

const photos = [
  'https://images.unsplash.com/photo-1504471564428-672a69d02601?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501908734255-16579c18c25f?auto=format&fit=crop&w=1200&q=80',
]

function extractImageUrl(uploadResult) {
  if (typeof uploadResult === 'string') return uploadResult

  return uploadResult?.imageUrl ?? ''
}

function createDefaultPosition() {
  return {
    traceX: 40 + Math.floor(Math.random() * 21),
    traceY: 40 + Math.floor(Math.random() * 21),
  }
}

function SelectionBox({ children }) {
  return (
    <div className="relative inline-block w-full">
      <div className="relative rounded-[3px]" style={{ border: '1.5px dashed rgba(0,0,0,0.32)', padding: '8px 10px' }}>
        {children}
        <div className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          <X size={13} strokeWidth={2.5} className="text-[#333]" />
        </div>
        {[
          { top: -5, left: '50%', marginLeft: -5 },
          { top: -5, right: -5 },
          { top: '50%', left: -5, marginTop: -5 },
          { top: '50%', right: -5, marginTop: -5 },
          { bottom: -5, left: -5 },
          { bottom: -5, left: '50%', marginLeft: -5 },
        ].map((pos, i) => (
          <div key={i} className="absolute h-[10px] w-[10px] rounded-full border-[1.5px] border-[#bbb] bg-white shadow-sm" style={pos} />
        ))}
        <div className="absolute -bottom-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          <span className="text-[13px] font-bold text-[#555]">Q</span>
        </div>
      </div>
    </div>
  )
}

// ─── PostIt Preview ───────────────────────────────────────────────────────────

// 색상별 hue-rotate 필터 (yellow.png 기준)
const COLOR_FILTER = {
  '#F5EDD5': 'hue-rotate(0deg)',
  '#F5D5D5': 'hue-rotate(195deg) saturate(0.9)',
  '#D5EDD5': 'hue-rotate(82deg) saturate(0.85)',
  '#D5E5F5': 'hue-rotate(148deg) saturate(0.8)',
  '#E8D5F5': 'hue-rotate(218deg) saturate(0.85)',
  '#F5E0D0': 'hue-rotate(-22deg) saturate(0.9)',
}

function PostItPreview({ text, onText, bg, textActive }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textActive) {
      textareaRef.current?.focus()
      const len = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(len, len)
    }
  }, [textActive])

  const imgFilter = COLOR_FILTER[bg] ?? 'hue-rotate(0deg)'

  return (
    <div className="relative w-full" style={{ transform: 'scale(1.12)', transformOrigin: 'center center' }}>
      {/* hue-rotate 필터로 포스트잇 색상 변경 */}
      <img
        src={postitYellow}
        alt="포스트잇"
        className="w-full"
        draggable={false}
        style={{ filter: imgFilter, transition: 'filter 0.2s' }}
      />
      {/* textarea — 클릭 시 캔버스로 버블링 차단해서 커서 유지 */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onText(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="absolute resize-none border-none bg-transparent leading-[1.8] text-[#2A1E14] outline-none"
        style={{
          fontFamily: "'Nanum Pen Script','Gaegu',cursive",
          fontSize: 26,
          top: '22%',
          left: '14%',
          width: '72%',
          height: '55%',
          cursor: 'text',
        }}
      />
    </div>
  )
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

function BottomSheet({ open, children }) {
  if (!open) return null
  return (
    <div className="bg-white">
      {children}
    </div>
  )
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function PhotoPanel({ onSelect }) {
  const items = [
    {
      label: '앨범',
      icon: <span className="text-[26px] font-light text-[#8B7A6B]">+</span>,
    },
    {
      label: '카메라',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      ),
    },
    {
      label: '최근 사진',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
  ]
  return (
    <div className="px-5 pb-6 pt-4">
      <p className="mb-3 text-[13px] font-semibold text-[#3B2A1E]">사진 추가</p>
      <div className="flex gap-5">
        {items.map((item) => (
          <button key={item.label} type="button" onClick={onSelect} className="flex flex-col items-center gap-1.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E8DDD1] bg-[#F8F4EE] text-[#5C4A3B]">
              {item.icon}
            </div>
            <span className="text-[12px] text-[#8B7A6B]">{item.label}</span>
          </button>
        ))}
      </div>
      <span className="text-[12px] font-medium text-[#3A2E26]">{label}</span>
    </button>
  )
}

function OptionPanel({ title, children }) {
  return (
    <div className="mt-3 rounded-[16px] bg-white/85 p-3 shadow-[0_8px_24px_rgba(35,24,16,0.08)]">
      <p className="text-[13px] font-bold text-[#3A2E26]">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

function PanelGroup({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-[#7A6357]">{label}</p>
      {children}
    </div>
  )
}

function TextOptionButton({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-[9px] px-3 text-[13px] font-semibold ${
        active ? 'bg-[#3A2E26] text-white' : 'bg-[#EFE8DE] text-[#3A2E26]'
      }`}
      style={{ fontFamily: option.family }}
    >
      {option.label}
    </button>
  )
}

function ColorOptionButton({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={option.label}
      className={`flex h-9 w-9 items-center justify-center rounded-full ${
        active ? 'ring-2 ring-[#3A2E26] ring-offset-2' : ''
      }`}
      style={{ backgroundColor: option.hex }}
    >
      {active ? <span className="h-2 w-2 rounded-full bg-white shadow" /> : null}
    </button>
  )
}

function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'
  const photoInputRef = useRef(null)

  const [tab, setTab] = useState(location.state?.initialTab === 'polaroid' ? 'polaroid' : 'postit')
  const [photoIdx, setPhotoIdx] = useState(0)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState('')
  const [text, setText] = useState('오늘 행복했다 ♡')
  const [postitColor, setPostitColor] = useState('yellow')
  const [polaroidBackgroundColor, setPolaroidBackgroundColor] = useState('#FFFFFF')
  const [textColor, setTextColor] = useState('#2D2218')
  const [fontKey, setFontKey] = useState('pen')
  const [fontSizeKey, setFontSizeKey] = useState('medium')
  const [activePanel, setActivePanel] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activePalette = useMemo(() => postitPalette.find((p) => p.key === postitColor) ?? postitPalette[0], [postitColor])
  const activeFont = useMemo(() => fontOptions.find((item) => item.key === fontKey) ?? fontOptions[0], [fontKey])
  const activeFontSize = useMemo(
    () => fontSizeOptions.find((item) => item.key === fontSizeKey) ?? fontSizeOptions[1],
    [fontSizeKey],
  )
  const currentPhoto = selectedPhotoPreview || photos[photoIdx]
  const editorFontSize = tab === 'polaroid' ? activeFontSize.polaroid : activeFontSize.postit

  useEffect(() => {
    return () => {
      if (selectedPhotoPreview) {
        URL.revokeObjectURL(selectedPhotoPreview)
      }
    }
  }, [selectedPhotoPreview])

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedPhotoFile(file)
    setSelectedPhotoPreview(URL.createObjectURL(file))
    setSubmitError('')
    event.target.value = ''
  }

  const handleSamplePhotoChange = () => {
    setSelectedPhotoFile(null)
    setSelectedPhotoPreview('')
    setPhotoIdx((p) => (p + 1) % photos.length)
  }

  const togglePanel = (panelName) => {
    setActivePanel((current) => (current === panelName ? null : panelName))
  }

  const handleComplete = async () => {
    if (isSubmitting) return

    const trimmedText = text.trim()
    if (!trimmedText) {
      setSubmitError('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const isPolaroid = tab === 'polaroid'
      let imageUrl = null

      if (isPolaroid) {
        if (selectedPhotoFile) {
          const uploadResult = await uploadTraceImage(selectedPhotoFile)
          imageUrl = extractImageUrl(uploadResult)

          if (!imageUrl) {
            throw new Error('이미지 업로드 응답에 imageUrl이 없습니다.')
          }
        } else {
          imageUrl = photos[photoIdx]
        }
      }

      const { traceX, traceY } = createDefaultPosition()
      await createTrace(boardId, {
        traceX,
        traceY,
        elements: [
          {
            contentType: isPolaroid ? 'POLAROID' : 'POST_IT',
            textContent: trimmedText,
            imageUrl,
            elementX: traceX,
            elementY: traceY,
            styleJson: JSON.stringify(
              isPolaroid
                ? {
                    font: fontKey,
                    fontFamily: activeFont.family,
                    fontSize: activeFontSize.polaroid,
                    paperColor: polaroidBackgroundColor,
                    backgroundColor: polaroidBackgroundColor,
                    textColor,
                  }
                : {
                    paperColor: postitColor,
                    backgroundColor: activePalette.hex,
                    textColor,
                    font: fontKey,
                    fontFamily: activeFont.family,
                    fontSize: activeFontSize.postit,
                  },
            ),
          },
        ],
      })

      navigate(`/board/${boardId}`, { replace: true })
    } catch (error) {
      setSubmitError(error.message ?? '흔적 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.main
      className="app-device flex flex-col overflow-hidden bg-[#F0EAE0]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-[#3B2A1E]">
          <X size={22} strokeWidth={2} />
        </button>
        <span className="text-[16px] font-semibold text-[#3B2A1E]">혼적 남기기</span>
        <button type="button" onClick={handleComplete}
          className="rounded-2xl bg-[#F5C842] px-5 py-1.5 text-[14px] font-bold text-[#3B2A1E] shadow-sm active:opacity-80"
        >
          남기기
        </button>
      </header>

      {/* ── 타입 탭 ── */}
      <div className="flex gap-2 px-4 pb-3">
        {[
          { key: 'polaroid', label: '포토카드', emoji: '🖼' },
          { key: 'postit',   label: '포스트잇', emoji: '📋' },
        ].map(({ key, label, emoji }) => {
          const active = type === key
          return (
            <button key={key} type="button"
              onClick={() => { setType(key); setActiveTool(null) }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${active ? 'bg-[#3B2A1E] text-white shadow' : 'bg-white/80 text-[#6B5A4C]'}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* ── 캔버스 (흰 종이 배경 + 포스트잇) ── */}
      <div
        className="relative mx-3 flex-1 overflow-hidden rounded-[24px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
        onClick={(e) => { e.stopPropagation(); setActiveTool(null) }}
      >
        {/* 배경 격자 패턴 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(180,160,140,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(180,160,140,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
          }}
        />

        {/* 은은한 배경 장식 */}
        <span className="pointer-events-none absolute left-4 top-6 select-none text-[22px] opacity-20">✿</span>
        <span className="pointer-events-none absolute right-5 top-10 select-none text-[18px] opacity-15">♡</span>
        <span className="pointer-events-none absolute bottom-8 left-5 select-none text-[16px] opacity-15">✦</span>
        <span className="pointer-events-none absolute bottom-10 right-4 select-none text-[20px] opacity-20">✿</span>

        {/* 콘텐츠 — 포스트잇이 흰 카드를 꽉 채우게 */}
        <div className="relative flex h-full items-center justify-center py-4">
          {type === 'polaroid' ? (
            <PolaroidPreview photoIdx={photoIdx} captionText={captionText} onCaptionChange={setCaptionText} />
          ) : (
            <PostItPreview
              text={postitText}
              onText={setPostitText}
              bg={postitBg}
              textActive={activeTool === 'text' || activeTool === 'font'}
            />
          )}
        </div>
      </div>

      {/* ── 하단 영역 ── */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* BottomSheet */}
        <BottomSheet open={activeTool !== null}>
          <div className="border-t border-[#EDE5DA] bg-white pb-2">
            {renderPanel()}
          </div>
        </BottomSheet>

        {/* Floating Toolbar */}
        <div className="px-0 pb-6 pt-3">
          <ToolTabBar tools={tools} activeTool={activeTool} onTool={handleTool} />
        </div>
      </div>
    </motion.main>
  )
}

export default PostItEditor
