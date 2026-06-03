import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import postitYellow from '../assets/postit/yellow.png'

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
]

const FRAMES = [
  { key: 'classic', label: '클래식' },
  { key: 'tape',    label: '테이프' },
  { key: 'black',   label: '블랙' },
  { key: 'vintage', label: '빈티지' },
]

const PEN_COLORS = [
  '#2C1A0E', '#6B3A2A', '#B09070',
  '#E89090', '#F5C842', '#4D96FF', '#6BCB77',
]

const POSTIT_BG_COLORS = [
  '#F5EDD5', '#F5D5D5', '#D5EDD5',
  '#D5E5F5', '#E8D5F5', '#F5E0D0',
]

const STICKERS = ['🌸', '💗', '⭐', '🌙', '🍀', '🎀', '🦋', '🌈', '☀️', '🌊', '🍃', '✨']

function today() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPhoto = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
)
const IconSticker = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 13s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
  </svg>
)
const IconText = () => <span className="text-[18px] font-semibold" style={{ fontFamily: 'serif' }}>Aa</span>
const IconPen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)
const IconFrame = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
)
const IconFont = () => <span className="text-[17px] font-bold">가</span>
const IconColor = () => (
  <div className="h-[22px] w-[22px] rounded-full" style={{ background: 'conic-gradient(#FF6B6B,#FFD93D,#6BCB77,#4D96FF,#CC77FF,#FF6B6B)' }} />
)

// ─── Tool definitions ─────────────────────────────────────────────────────────

const PHOTO_TOOLS = [
  { key: 'photo',   label: '사진',   Icon: IconPhoto },
  { key: 'sticker', label: '스티커', Icon: IconSticker },
  { key: 'text',    label: '텍스트', Icon: IconText },
  { key: 'pen',     label: '펜',     Icon: IconPen },
  { key: 'frame',   label: '프레임', Icon: IconFrame },
]

const POSTIT_TOOLS = [
  { key: 'text',    label: '텍스트', Icon: IconText },
  { key: 'font',    label: '폰트',   Icon: IconFont },
  { key: 'sticker', label: '스티커', Icon: IconSticker },
  { key: 'pen',     label: '펜',     Icon: IconPen },
  { key: 'color',   label: '색상',   Icon: IconColor },
]

// ─── Polaroid Preview ─────────────────────────────────────────────────────────

function PolaroidPreview({ photoIdx, captionText, onCaptionChange }) {
  return (
    <div style={{ transform: 'rotate(-2deg)' }}>
      <div
        className="relative bg-white"
        style={{
          width: 280,
          borderRadius: 3,
          padding: '12px 12px 56px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {/* 테이프 */}
        <div
          className="absolute -top-3 left-[18%] z-10 h-[20px] w-[110px] rotate-[-2deg] rounded-sm opacity-75"
          style={{ background: 'linear-gradient(90deg,#D4B896,#C8AA82,#D4B896)' }}
        />

        {/* 사진 */}
        <img
          src={MOCK_PHOTOS[photoIdx]}
          alt="preview"
          className="w-full rounded-[2px] object-cover"
          style={{ height: 220 }}
        />

        {/* 캡션 */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-3 pb-3 pt-1">
          <textarea
            value={captionText}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="오늘도 수고했어 ♡"
            className="w-full resize-none border-none bg-transparent text-center leading-[1.4] text-[#1E1410] outline-none placeholder:text-[#C0A898]"
            style={{ fontFamily: "'Nanum Pen Script','Gaegu',cursive", fontSize: 22, height: 38 }}
            rows={1}
          />
        </div>
      </div>
    </div>
  )
}

// ─── PostIt Preview ───────────────────────────────────────────────────────────

function PostItPreview({ text, onText, bg, textActive }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textActive) {
      textareaRef.current?.focus()
      // 커서를 텍스트 끝으로 이동
      const len = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(len, len)
    }
  }, [textActive])

  return (
    <div
      className="relative w-full"
      style={{ transform: 'scale(1.18)', transformOrigin: 'top center', marginTop: '-2%' }}
    >
      {bg && bg !== '#F5EDD5' && (
        <div
          className="absolute inset-0 rounded-[4px] mix-blend-multiply"
          style={{ backgroundColor: bg, top: '10%', left: '5%', right: '5%', bottom: '8%' }}
        />
      )}
      <img src={postitYellow} alt="포스트잇" className="w-full" draggable={false} />
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder="오늘 어땠나요?"
        className="absolute resize-none border-none bg-transparent leading-[1.8] text-[#2A1E14] outline-none placeholder:text-[#B09A7A]/60"
        style={{
          fontFamily: "'Nanum Pen Script','Gaegu',cursive",
          fontSize: 26,
          top: '22%',
          left: '14%',
          width: '72%',
          height: '55%',
        }}
      />
    </div>
  )
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

function BottomSheet({ open, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          className="overflow-hidden bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
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
    </div>
  )
}

function StickerPanel() {
  return (
    <div className="px-4 pb-5 pt-4">
      <p className="mb-3 text-[13px] font-semibold text-[#3B2A1E]">스티커</p>
      <div className="grid grid-cols-6 gap-2">
        {STICKERS.map((s) => (
          <button key={s} type="button" className="flex h-12 items-center justify-center rounded-xl border border-[#EDE5DA] bg-[#F8F4EE] text-[24px]">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextPanel() {
  const fonts = [
    { label: '손글씨', family: "'Nanum Pen Script',cursive", sample: '안녕' },
    { label: '고딕',   family: 'sans-serif',                  sample: '안녕' },
    { label: '명조',   family: 'serif',                       sample: '안녕' },
    { label: '둥근체', family: "'Nanum Gothic',sans-serif",   sample: '안녕' },
  ]
  return (
    <div className="px-4 pb-5 pt-4">
      <p className="mb-3 text-[13px] font-semibold text-[#3B2A1E]">글꼴</p>
      <div className="grid grid-cols-2 gap-2">
        {fonts.map((f) => (
          <button key={f.label} type="button"
            className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#EDE5DA] bg-[#F8F4EE]"
          >
            <span className="text-[18px] text-[#3B2A1E]" style={{ fontFamily: f.family }}>{f.sample}</span>
            <span className="text-[11px] text-[#8B7A6B]">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PenPanel({ penColor, onColor, penSize, onSize }) {
  return (
    <div className="px-4 pb-5 pt-4">
      <div className="mb-4">
        <p className="mb-2.5 text-[13px] font-semibold text-[#3B2A1E]">색상</p>
        <div className="flex gap-2.5">
          {PEN_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => onColor(c)}
              className="h-9 w-9 rounded-full transition"
              style={{ backgroundColor: c, outline: penColor === c ? `3px solid #3B2A1E` : '3px solid transparent', outlineOffset: 2 }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-[#3B2A1E]">굵기</p>
        <div className="flex gap-2">
          {['thin', 'medium', 'thick'].map((s, i) => (
            <button key={s} type="button" onClick={() => onSize(s)}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl border transition ${penSize === s ? 'border-[#3B2A1E] bg-[#F5EDD5]' : 'border-[#E8DDD1] bg-white'}`}
            >
              <div className="rounded-full bg-[#3B2A1E]"
                style={{ width: i === 0 ? 18 : i === 1 ? 26 : 34, height: i === 0 ? 2 : i === 1 ? 3.5 : 5 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FramePanel() {
  const [sel, setSel] = useState('classic')
  return (
    <div className="px-4 pb-5 pt-4">
      <p className="mb-3 text-[13px] font-semibold text-[#3B2A1E]">프레임</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {FRAMES.map((f) => (
          <button key={f.key} type="button" onClick={() => setSel(f.key)} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className={`h-16 w-12 rounded-xl border-2 transition ${sel === f.key ? 'border-[#3B2A1E]' : 'border-[#E0D5C8]'} ${f.key === 'black' ? 'bg-[#1A1A1A]' : 'bg-white'}`} />
            <span className="text-[11px] text-[#8B7A6B]">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorPanel({ selected, onSelect }) {
  return (
    <div className="px-4 pb-5 pt-4">
      <p className="mb-3 text-[13px] font-semibold text-[#3B2A1E]">배경색</p>
      <div className="flex gap-3">
        {POSTIT_BG_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => onSelect(c)}
            className="h-10 w-10 rounded-full transition"
            style={{ backgroundColor: c, outline: selected === c ? '3px solid #3B2A1E' : '3px solid transparent', outlineOffset: 2 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Tool Tab Bar ─────────────────────────────────────────────────────────────

function ToolTabBar({ tools, activeTool, onTool }) {
  return (
    <div className="mx-4 mb-4 flex items-center justify-around rounded-2xl bg-white px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
      {tools.map(({ key, label, Icon }) => {
        const active = activeTool === key
        return (
          <button key={key} type="button" onClick={() => onTool(key)}
            className="flex flex-col items-center gap-0.5 py-1.5"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${active ? 'bg-[#F5EDD5]' : ''} text-[#3B2A1E]`}>
              <Icon />
            </div>
            <span className={`text-[11px] ${active ? 'font-semibold text-[#3B2A1E]' : 'font-medium text-[#9B8A7B]'}`}>{label}</span>
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

  const [type, setType] = useState(
    location.state?.initialTab === 'postit' ? 'postit' : 'polaroid'
  )
  const [photoIdx, setPhotoIdx] = useState(0)
  const [captionText, setCaptionText] = useState('')
  const [postitText, setPostitText] = useState('')
  const [activeTool, setActiveTool] = useState(null)
  const [penColor, setPenColor] = useState('#2C1A0E')
  const [penSize, setPenSize] = useState('medium')
  const [postitBg, setPostitBg] = useState('#F5EDD5')

  const tools = type === 'polaroid' ? PHOTO_TOOLS : POSTIT_TOOLS

  const handleTool = (key) => setActiveTool((prev) => (prev === key ? null : key))

  const handleComplete = () => {
    const baseId = Date.now()
    navigate(`/board/${boardId}`, {
      state: {
        placementDraft:
          type === 'polaroid'
            ? { id: `polaroid-${baseId}`, type: 'polaroid', content: captionText, media: { image: MOCK_PHOTOS[photoIdx], dateLabel: today() }, style: {}, position: { x: 50, y: 50 }, createdAt: new Date().toISOString() }
            : { id: `postit-${baseId}`, type: 'postit', content: postitText, style: { paperColor: 'yellow' }, position: { x: 50, y: 50 }, createdAt: new Date().toISOString() },
      },
    })
  }

  const renderPanel = () => {
    if (!activeTool) return null
    if (type === 'polaroid') {
      if (activeTool === 'photo')   return <PhotoPanel onSelect={() => setPhotoIdx((p) => (p + 1) % MOCK_PHOTOS.length)} />
      if (activeTool === 'sticker') return <StickerPanel />
      if (activeTool === 'text')    return <TextPanel />
      if (activeTool === 'pen')     return <PenPanel penColor={penColor} onColor={setPenColor} penSize={penSize} onSize={setPenSize} />
      if (activeTool === 'frame')   return <FramePanel />
    } else {
      if (activeTool === 'text')    return <TextPanel />
      if (activeTool === 'font')    return <TextPanel />
      if (activeTool === 'sticker') return <StickerPanel />
      if (activeTool === 'pen')     return <PenPanel penColor={penColor} onColor={setPenColor} penSize={penSize} onSize={setPenSize} />
      if (activeTool === 'color')   return <ColorPanel selected={postitBg} onSelect={setPostitBg} />
    }
    return null
  }

  return (
    <motion.main
      className="app-device flex flex-col overflow-hidden bg-[#F2EDE6]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-center justify-between px-4 pb-1 pt-3">
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-[#3B2A1E]">
          <X size={22} strokeWidth={2} />
        </button>
        <button type="button" onClick={handleComplete}
          className="rounded-2xl bg-[#F5C842] px-6 py-2 text-[15px] font-bold text-[#3B2A1E] shadow-sm active:opacity-80"
        >
          남기기
        </button>
      </header>

      {/* ── 타입 탭 ── */}
      <div className="flex gap-2 px-4 pb-2">
        {[
          { key: 'polaroid', label: '포토카드', emoji: '🖼' },
          { key: 'postit',   label: '포스트잇', emoji: '📋' },
        ].map(({ key, label, emoji }) => {
          const active = type === key
          return (
            <button key={key} type="button"
              onClick={() => { setType(key); setActiveTool(null) }}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${active ? 'bg-[#3B2A1E] text-white shadow' : 'bg-white text-[#6B5A4C] shadow-sm'}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* ── 캔버스 ── */}
      <div
        className="relative flex flex-1 items-start justify-center px-4 pt-3"
        onClick={(e) => { e.stopPropagation(); setActiveTool(null) }}
      >
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

      {/* ── 하단 영역 ── */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* BottomSheet: 툴바 위로 슬라이드 — 캔버스는 건드리지 않음 */}
        <BottomSheet open={activeTool !== null}>
          <div className="border-t border-[#EDE5DA] bg-white pb-2">
            {renderPanel()}
          </div>
        </BottomSheet>

        {/* Floating Toolbar */}
        <div className="bg-[#F2EDE6] pb-6 pt-2">
          <ToolTabBar tools={tools} activeTool={activeTool} onTool={handleTool} />
        </div>
      </div>
    </motion.main>
  )
}

export default PostItEditor
