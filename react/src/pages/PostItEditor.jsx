import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import yellowPaper from '../assets/postit/yellow.png'

const MAX_POSTIT_LENGTH = 220
const FONT_SIZE_PRESETS = [18, 24, 32]
const INK_COLOR = 'rgba(59,42,31,0.93)'

const fonts = [
  { key: 'hand', label: '손글씨', className: "'Nanum Pen Script', 'Gaegu', cursive" },
  { key: 'soft', label: '나눔펜', className: "'Nanum Pen Script', 'Apple SD Gothic Neo', cursive" },
  { key: 'gothic', label: '기본 고딕', className: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" },
]

const paperVariants = [
  { key: 'yellow', label: '연노랑', swatch: '#F5E8AD', filter: 'none' },
  { key: 'pink', label: '연핑크', swatch: '#EAC3CC', filter: 'hue-rotate(320deg) saturate(0.95) brightness(1.03)' },
  { key: 'blue', label: '연하늘', swatch: '#B8CBDC', filter: 'hue-rotate(165deg) saturate(0.82) brightness(1.02)' },
  { key: 'beige', label: '베이지', swatch: '#DFD0B4', filter: 'hue-rotate(28deg) saturate(0.78) brightness(0.98)' },
  { key: 'ivory', label: '연회색', swatch: '#ECEAE5', filter: 'saturate(0.45) brightness(1.08)' },
]

const clampText = (value, limit) => (value.length > limit ? value.slice(0, limit) : value)

function PostItEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [text, setText] = useState('자유롭게 흔적을 남겨보세요 :)')
  const [font, setFont] = useState(fonts[0].key)
  const [paperColor, setPaperColor] = useState(paperVariants[0].key)
  const [fontSize, setFontSize] = useState(24)
  const [noteTilt] = useState(() => (Math.random() * 1.1 - 0.55).toFixed(2))

  const editableRef = useRef(null)

  const activeFont = fonts.find((item) => item.key === font) ?? fonts[0]
  const activePaper = paperVariants.find((item) => item.key === paperColor) ?? paperVariants[0]
  const remainingChars = MAX_POSTIT_LENGTH - text.length

  const textStyle = useMemo(
    () => ({
      fontFamily: activeFont.className,
      fontSize: `${fontSize}px`,
      lineHeight: 1.62,
      letterSpacing: '0.01em',
      color: INK_COLOR,
      textShadow: '0 0.3px 0 rgba(59,42,31,0.12)',
      caretColor: '#5A3A26',
      transform: 'rotate(0.22deg)',
    }),
    [activeFont.className, fontSize],
  )

  const handleInput = (event) => {
    const nextText = clampText(event.currentTarget.innerText.replace(/\r/g, ''), MAX_POSTIT_LENGTH)
    if (nextText !== event.currentTarget.innerText) {
      event.currentTarget.innerText = nextText
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(event.currentTarget)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    setText(nextText)
  }

  const handleComplete = () => {
    const payload = {
      id: `postit-${Date.now()}`,
      type: 'postit',
      text: text.trim() || ' ',
      paperColor,
      textColor: INK_COLOR,
      fontFamily: activeFont.className,
      fontSize,
      font,
      createdAt: new Date().toISOString(),
      rotation: Number(noteTilt),
    }

    navigate(`/board/${boardId}`, { state: { placementDraft: payload } })
  }

  return (
    <motion.main
      className="app-device h-full w-full overflow-hidden bg-[#FAF8F5]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex h-full flex-col bg-[#FAF8F5] px-6 pb-6 pt-5">
        <header className="mb-2 flex items-center justify-between text-[#3E2A1E]">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full">
            <ChevronLeft size={28} />
          </button>

          <div className="rounded-full border border-[#E8DED2] bg-white p-1 shadow-[0_1px_2px_rgba(62,42,30,0.08)]">
            <div className="flex items-center gap-1">
              <button type="button" className="rounded-full bg-[#4C3220] px-6 py-2 text-base font-semibold text-white">텍스트</button>
              <button type="button" className="rounded-full px-6 py-2 text-base text-[#998A7E]">펜 그리기</button>
            </div>
          </div>

          <button type="button" onClick={handleComplete} className="text-xl font-semibold">완료</button>
        </header>
        <div className="-mx-6 mb-5 h-px bg-[#EFE6DB]" />

        <section className="mx-auto w-[88%]">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-[0_8px_18px_rgba(62,42,30,0.12)]"
            style={{ transform: `rotate(${noteTilt}deg)` }}
          >
            <img src={yellowPaper} alt="포스트잇 배경" className="h-full w-full object-cover" style={{ filter: activePaper.filter }} />
            <span className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 bg-[#E7D88F] [clip-path:polygon(100%_0,0_100%,100%_100%)] shadow-[-1px_-1px_0_rgba(173,147,86,0.22)]" />

            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="포스트잇 메모 입력"
              onInput={handleInput}
              className="absolute inset-0 cursor-text whitespace-pre-wrap break-words bg-transparent px-7 pb-8 pt-9 outline-none"
              style={textStyle}
            >
              {text}
            </div>
          </div>
          <div className="mt-2 flex justify-end text-xs text-[#8F8074]">{remainingChars}자 남음</div>
        </section>

        <section className="mt-5 space-y-4 text-[#3E2A1E]">
          <div>
            <h3 className="mb-2 text-base font-semibold">글씨 크기</h3>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-[#E7DDD1] bg-white p-1">
              {FONT_SIZE_PRESETS.map((size, idx) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`rounded-xl py-2 transition ${fontSize === size ? 'bg-[#4C3220] text-white' : 'text-[#3E2A1E]'}`}
                >
                  <span className="inline-block" style={{ fontSize: `${16 + idx * 6}px` }}>A</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold">글꼴</h3>
            <div className="flex gap-2.5">
              {fonts.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFont(item.key)}
                  className={`rounded-full border px-4 py-1.5 text-sm ${font === item.key ? 'border-[#3E2A1E] bg-[#4C3220] text-white' : 'border-[#DDD4C8] bg-white text-[#3E2A1E]'}`}
                  style={{ fontFamily: item.className }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold">종이 색상</h3>
            <div className="flex gap-3">
              {paperVariants.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPaperColor(item.key)}
                  aria-label={item.label}
                  className={`h-11 w-11 rounded-xl border-2 ${paperColor === item.key ? 'border-[#3E2A1E]' : 'border-[#DDD4C8]'}`}
                  style={{ backgroundColor: item.swatch }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </motion.main>
  )
}

export default PostItEditor
