import { motion } from 'framer-motion'
import { Image, Palette, PenLine, Smile, Type, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import yellowPaper from '../assets/postit/yellow.png'

const BG = '#F7F1EB'
const MAIN_BROWN = '#4A3124'

const TABS = [
  { key: 'polaroid', label: '폴라로이드', disabled: false },
  { key: 'postit', label: '포스트잇', disabled: false },
  { key: 'doodle', label: '낙서', disabled: true },
]

const FONT_SIZE_PRESETS = [18, 24, 30]

const fonts = [
  { key: 'hand', label: '손글씨', className: "'Nanum Pen Script', 'Gaegu', cursive" },
  { key: 'soft', label: '나눔펜', className: "'Nanum Pen Script', 'Apple SD Gothic Neo', cursive" },
  { key: 'gothic', label: '기본 고딕', className: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" },
]

const colorChips = [
  { key: 'yellow', hex: '#F5E8AD', filter: 'none' },
  { key: 'pink', hex: '#EAC3CC', filter: 'hue-rotate(320deg) saturate(0.95) brightness(1.03)' },
  { key: 'blue', hex: '#B8CBDC', filter: 'hue-rotate(165deg) saturate(0.82) brightness(1.02)' },
  { key: 'beige', hex: '#DFD0B4', filter: 'hue-rotate(28deg) saturate(0.78) brightness(0.98)' },
  { key: 'gray', hex: '#ECEAE5', filter: 'saturate(0.45) brightness(1.08)' },
]

const textColorPalette = [MAIN_BROWN, '#7A4218', '#405b7a', '#222222']

const polaroidPhotos = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80',
]

const clampText = (value, limit) => (value.length > limit ? value.slice(0, limit) : value)

function formatKDate() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

function getAdaptiveFontSize(baseSize, textLength) {
  if (textLength > 90) return Math.max(18, baseSize - 6)
  if (textLength > 40) return Math.max(20, baseSize - 3)
  return baseSize
}

function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const initialTab = location.state?.initialTab === 'polaroid' ? 'polaroid' : 'postit'

  const [draftRecord, setDraftRecord] = useState({
    tab: initialTab,
    postit: {
      text: '',
      font: 'hand',
      fontSize: 24,
      paperColor: 'yellow',
      textColor: MAIN_BROWN,
    },
    polaroid: {
      text: '오늘도 행복한 하루 :)',
      font: 'hand',
      textColor: MAIN_BROWN,
      photoIndex: 0,
    },
  })

  const activeTab = draftRecord.tab
  const activePostFont = fonts.find((item) => item.key === draftRecord.postit.font) ?? fonts[0]
  const activePolaroidFont = fonts.find((item) => item.key === draftRecord.polaroid.font) ?? fonts[0]
  const activeColor = colorChips.find((item) => item.key === draftRecord.postit.paperColor) ?? colorChips[0]

  const adaptivePostFontSize = getAdaptiveFontSize(draftRecord.postit.fontSize, draftRecord.postit.text.length)
  const postRemain = 220 - draftRecord.postit.text.length

  const postTextStyle = useMemo(
    () => ({
      fontFamily: activePostFont.className,
      fontSize: `${adaptivePostFontSize}px`,
      lineHeight: 1.8,
      letterSpacing: '0.01em',
      color: draftRecord.postit.textColor,
      textShadow: '0 0.3px 0 rgba(59,42,31,0.1)',
    }),
    [activePostFont.className, adaptivePostFontSize, draftRecord.postit.textColor],
  )

  const setTab = (tabKey) => {
    setDraftRecord((prev) => ({ ...prev, tab: tabKey }))
  }

  const onChangePostText = (event) => {
    const nextText = clampText(event.target.value, 220)
    setDraftRecord((prev) => ({ ...prev, postit: { ...prev.postit, text: nextText } }))
  }

  const onChangePolaroidText = (event) => {
    const nextText = clampText(event.target.value, 40)
    setDraftRecord((prev) => ({ ...prev, polaroid: { ...prev.polaroid, text: nextText } }))
  }

  const onClickToolPhoto = () => {
    if (activeTab !== 'polaroid') return
    setDraftRecord((prev) => ({
      ...prev,
      polaroid: {
        ...prev.polaroid,
        photoIndex: (prev.polaroid.photoIndex + 1) % polaroidPhotos.length,
      },
    }))
  }

  const onClickToolText = () => {
    setDraftRecord((prev) => {
      const target = prev.tab === 'polaroid' ? prev.polaroid : prev.postit
      const idx = fonts.findIndex((f) => f.key === target.font)
      const nextFont = fonts[(idx + 1) % fonts.length].key
      return prev.tab === 'polaroid'
        ? { ...prev, polaroid: { ...prev.polaroid, font: nextFont } }
        : { ...prev, postit: { ...prev.postit, font: nextFont } }
    })
  }

  const onClickToolColor = () => {
    setDraftRecord((prev) => {
      if (prev.tab === 'postit') {
        const idx = colorChips.findIndex((c) => c.key === prev.postit.paperColor)
        return {
          ...prev,
          postit: { ...prev.postit, paperColor: colorChips[(idx + 1) % colorChips.length].key },
        }
      }
      const idx = textColorPalette.indexOf(prev.polaroid.textColor)
      return {
        ...prev,
        polaroid: { ...prev.polaroid, textColor: textColorPalette[(idx + 1) % textColorPalette.length] },
      }
    })
  }

  const handleComplete = () => {
    if (activeTab === 'postit' && !draftRecord.postit.text.trim()) return

    const baseId = Date.now()

    if (activeTab === 'polaroid') {
      const cardData = {
        id: `polaroid-${baseId}`,
        type: 'polaroid',
        content: draftRecord.polaroid.text.trim() || '오늘의 기억',
        style: {
          fontSize: 14,
          font: draftRecord.polaroid.font,
          fontFamily: activePolaroidFont.className,
          color: draftRecord.polaroid.textColor,
          paperColor: 'white',
        },
        media: {
          image: polaroidPhotos[draftRecord.polaroid.photoIndex],
          dateLabel: formatKDate(),
        },
        position: { x: 50, y: 52 },
        createdAt: new Date().toISOString(),
      }
      navigate(`/board/${boardId}`, { state: { placementDraft: cardData } })
      return
    }

    const cardData = {
      id: `postit-${baseId}`,
      type: 'postit',
      content: draftRecord.postit.text.trim(),
      style: {
        fontSize: adaptivePostFontSize,
        font: draftRecord.postit.font,
        fontFamily: activePostFont.className,
        color: draftRecord.postit.textColor,
        paperColor: draftRecord.postit.paperColor,
      },
      position: { x: 50, y: 52 },
      createdAt: new Date().toISOString(),
    }

    navigate(`/board/${boardId}`, { state: { placementDraft: cardData } })
  }

  return (
    <motion.main
      className="app-device h-full w-full overflow-hidden"
      style={{ background: BG }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex h-full flex-col px-5 pb-5 pt-5" style={{ background: BG }}>
        <header className="flex items-center justify-between text-[#4A3124]">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full">
            <X size={24} />
          </button>
          <h1 className="text-lg font-semibold">기록 남기기</h1>
          <button
            type="button"
            onClick={handleComplete}
            className={`px-1 text-base font-semibold transition-opacity ${
              activeTab === 'postit' && !draftRecord.postit.text.trim() ? 'opacity-35' : ''
            }`}
          >
            완료
          </button>
        </header>

        <div className="mt-4 grid grid-cols-3 rounded-full bg-[#EFE8DF] p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => setTab(item.key)}
              className={`rounded-full py-2 text-sm font-semibold ${
                activeTab === item.key ? 'bg-[#4A3124] text-white' : 'text-[#6F5A4A]'
              } ${item.disabled ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="mt-4 flex-1 rounded-3xl bg-[#EFE7DC] p-4 shadow-inner">
          <div className="flex h-full items-center justify-center">
            {activeTab === 'polaroid' ? (
              <div className="relative w-[86%] max-w-[320px] rounded-[18px] bg-[#FFFCF8] p-3 shadow-[0_8px_18px_rgba(74,49,36,0.14)]">
                <span className="absolute left-1/2 top-0 h-3 w-14 -translate-x-1/2 -translate-y-1 rotate-2 bg-[#EED9B9]/90" />
                <span className="absolute left-3 top-3 text-2xl">💜</span>
                <img src={polaroidPhotos[draftRecord.polaroid.photoIndex]} alt="폴라로이드" className="h-[240px] w-full rounded-[10px] object-cover" />
                <textarea
                  value={draftRecord.polaroid.text}
                  onChange={onChangePolaroidText}
                  className="mt-3 min-h-8 w-full resize-none border-none bg-transparent text-center outline-none"
                  style={{ fontFamily: activePolaroidFont.className, color: draftRecord.polaroid.textColor, fontSize: '26px', lineHeight: 1.3 }}
                />
                <p className="mt-1 text-center text-sm font-medium text-[#705748]">- {formatKDate()} -</p>
              </div>
            ) : (
              <div
                className="postit-note relative flex w-[88%] max-w-[330px] aspect-square rotate-[-1.2deg] items-center justify-center overflow-hidden rounded-2xl bg-transparent"
                style={{ boxShadow: '0 12px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)' }}
              >
                <img
                  src={yellowPaper}
                  alt="포스트잇"
                  className="absolute -left-[11%] -top-[11%] h-[122%] w-[122%] object-cover"
                  style={{ filter: activeColor.filter }}
                />

                <textarea
                  value={draftRecord.postit.text}
                  onChange={onChangePostText}
                  placeholder="자유롭게 흔적을 남겨보세요 :)"
                  className="postit-text absolute top-[44%] h-[52%] w-[74%] -translate-y-1/2 resize-none border-none bg-transparent text-center outline-none placeholder:text-[#7c694f]/55"
                  style={postTextStyle}
                />
              </div>
            )}
          </div>
        </section>

        <section className="mt-4">
          <div className="grid grid-cols-5 gap-2 text-center text-[12px] text-[#5B4638]">
            <button
              type="button"
              onClick={onClickToolPhoto}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 ${activeTab !== 'polaroid' ? 'opacity-40' : ''}`}
            >
              <Image size={18} />
              <span>사진</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 rounded-xl py-2 opacity-50">
              <Smile size={18} />
              <span>스티커</span>
            </button>
            <button type="button" onClick={onClickToolText} className="flex flex-col items-center gap-1 rounded-xl py-2">
              <Type size={18} />
              <span>글씨</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 rounded-xl py-2 opacity-50">
              <PenLine size={18} />
              <span>펜</span>
            </button>
            <button type="button" onClick={onClickToolColor} className="flex flex-col items-center gap-1 rounded-xl py-2">
              <Palette size={18} />
              <span>색상</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            {colorChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                disabled={activeTab !== 'postit'}
                onClick={() =>
                  setDraftRecord((prev) => ({ ...prev, postit: { ...prev.postit, paperColor: chip.key } }))
                }
                className={`h-8 w-8 rounded-full border-2 transition-opacity ${
                  activeTab === 'postit' && draftRecord.postit.paperColor === chip.key
                    ? 'border-[#7A4218]'
                    : 'border-[#E1D7CC]'
                } ${activeTab !== 'postit' ? 'opacity-40' : ''}`}
                style={{ backgroundColor: chip.hex }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {FONT_SIZE_PRESETS.map((size, idx) => (
              <button
                key={size}
                type="button"
                onClick={() => setDraftRecord((prev) => ({ ...prev, postit: { ...prev.postit, fontSize: size } }))}
                disabled={activeTab !== 'postit'}
                className={`h-9 w-14 rounded-full border text-center ${
                  draftRecord.postit.fontSize === size ? 'border-[#7A4218] bg-[#7A4218] text-white' : 'border-[#DDD4C8] bg-[#FFFCF8] text-[#4A3124]'
                } ${activeTab !== 'postit' ? 'opacity-40' : ''}`}
              >
                <span style={{ fontSize: `${14 + idx * 4}px` }}>A</span>
            </button>
            ))}
          </div>
        </section>

        {activeTab === 'postit' ? <p className="mt-2 text-right text-xs text-[#8F8074]">{postRemain}자 남음</p> : null}
      </div>
    </motion.main>
  )
}

export default PostItEditor
