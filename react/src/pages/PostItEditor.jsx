import { motion } from 'framer-motion'
import { Image, Palette, Pencil, Smile, Type, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import yellowPaper from '../assets/postit/yellow.png'

const BG = '#F3F1ED'

const tabs = [
  { key: 'polaroid', label: '포토카드' },
  { key: 'postit', label: '포스트잇' },
]

const postitPalette = [
  { key: 'white', hex: '#F8F8F8' },
  { key: 'yellow', hex: '#F3D98E' },
  { key: 'pink', hex: '#EEB7C6' },
  { key: 'green', hex: '#D2D4A2' },
  { key: 'peach', hex: '#E6B2A6' },
]

const photos = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501908734255-16579c18c25f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80',
]

function formatDate() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function PostItEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [tab, setTab] = useState(location.state?.initialTab === 'polaroid' ? 'polaroid' : 'postit')
  const [photoIdx, setPhotoIdx] = useState(0)
  const [text, setText] = useState('오늘도 행복한 하루 ♡')
  const [postitColor, setPostitColor] = useState('yellow')

  const activePostitHex = useMemo(() => postitPalette.find((p) => p.key === postitColor)?.hex ?? '#F3D98E', [postitColor])
  const polaroidTilt = useMemo(() => {
    const base = String(boardId).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + photoIdx
    return ((base % 41) / 10 - 2).toFixed(2)
  }, [boardId, photoIdx])

  const handleComplete = () => {
    const baseId = Date.now()
    if (tab === 'polaroid') {
      navigate(`/board/${boardId}`, {
        state: {
          placementDraft: {
            id: `polaroid-${baseId}`,
            type: 'polaroid',
            content: text,
            media: { image: photos[photoIdx], dateLabel: formatDate() },
            style: { color: '#2E231B', fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" },
            position: { x: 50, y: 50 },
            createdAt: new Date().toISOString(),
          },
        },
      })
      return
    }

    navigate(`/board/${boardId}`, {
      state: {
        placementDraft: {
          id: `postit-${baseId}`,
          type: 'postit',
          content: text,
          style: {
            fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
            fontSize: 22,
            color: '#2E231B',
            paperColor: postitColor,
          },
          position: { x: 50, y: 50 },
          createdAt: new Date().toISOString(),
        },
      },
    })
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
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[430px] flex-col bg-[#F4F3EF] px-4 pb-3 pt-3">
        <header className="flex items-center justify-between px-1 text-[#1D1713]">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full">
            <X size={28} />
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">기록 남기기</h1>
          <button type="button" onClick={handleComplete} className="px-2 text-[20px] font-bold">완료</button>
        </header>

        <div className="mt-3 rounded-full bg-[#ECE9E4] p-1">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((item) => {
              const active = tab === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full py-3 text-[18px] font-semibold ${
                    active ? (item.key === 'polaroid' ? 'bg-[radial-gradient(circle_at_35%_25%,#4A321F,#1E1610)] text-white' : 'bg-[#F4D98D] text-[#2E231B]') : 'text-[#33261E]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <section
          className="mt-4 min-h-0 flex-1 rounded-[30px] p-4 shadow-inner"
          style={{
            backgroundColor: '#F8F3E8',
            backgroundImage:
              'linear-gradient(rgba(201,179,151,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(201,179,151,0.10) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            backgroundBlendMode: 'multiply',
          }}
        >
          {tab === 'polaroid' ? (
            <div
              className="relative mx-auto mt-2 w-[74%] max-w-[300px] rounded-[16px] p-3 pb-5"
              style={{
                transform: `rotate(${polaroidTilt}deg)`,
                backgroundColor: 'rgba(255,255,255,0.94)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
              }}
            >
              <span className="absolute left-1/2 top-0 h-9 w-28 -translate-x-1/2 -translate-y-2 rotate-[4deg] rounded-[3px] bg-[#F2CF7D]/90 shadow" />
              <span className="absolute left-2 top-6 text-[72px] leading-none">💜</span>
              <img src={photos[photoIdx]} alt="preview" className="h-[clamp(220px,33vh,300px)] w-full rounded-[8px] object-cover" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-3 w-full resize-none border-none bg-transparent text-center text-[clamp(24px,4.6vw,38px)] leading-[1.2] text-[#19130F] outline-none"
                style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
                rows={2}
              />
              <div className="mt-2 flex flex-col items-center justify-center">
                <p className="text-center text-[clamp(12px,2.6vw,18px)] tracking-[0.08em] text-[#19130F] opacity-70">- {formatDate()} -</p>
              </div>
            </div>
          ) : (
            <div className="relative mx-auto mt-3 h-[clamp(330px,45vh,480px)] w-[82%] max-w-[330px]">
              <span className="absolute left-1/2 top-0 z-20 h-10 w-30 -translate-x-1/2 -translate-y-2 rounded-[3px] bg-[#E6DABF]/95 shadow" />
              <div
                className="relative h-full w-full rounded-[2px] p-8 shadow-[0_20px_34px_rgba(48,33,22,0.18)]"
                style={{ backgroundColor: activePostitHex, backgroundImage: `url(${yellowPaper})`, backgroundSize: 'cover' }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="h-full w-full resize-none border-none bg-transparent text-center text-[clamp(30px,4.8vw,48px)] leading-[1.3] text-[#2D2218] outline-none"
                  style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive" }}
                />
                <span className="absolute right-11 top-28 text-[54px]">♡</span>
                <span className="absolute right-11 top-62 text-[62px]">🌿</span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-3 border-t border-[#E4DED5] pt-3 text-[#2A211A]">
          {tab === 'polaroid' ? (
            <div className="grid grid-cols-5 text-center text-[13px]">
              <button type="button" onClick={() => setPhotoIdx((p) => (p + 1) % photos.length)} className="flex flex-col items-center gap-1"><Image size={28} /><span>사진</span></button>
              <button type="button" className="flex flex-col items-center gap-1"><Smile size={28} /><span>스티커</span></button>
              <button type="button" className="flex flex-col items-center gap-1"><Type size={28} /><span>텍스트</span></button>
              <button type="button" className="flex flex-col items-center gap-1"><Pencil size={28} /><span>펜</span></button>
              <button type="button" className="flex flex-col items-center gap-1"><Palette size={28} /><span>색상</span></button>
            </div>
          ) : (
            <div className="grid grid-cols-3 text-center text-[14px]">
              <button type="button" className="flex flex-col items-center gap-1.5"><Pencil size={32} /><span>펜</span></button>
              <button type="button" className="flex flex-col items-center gap-1.5"><Type size={32} /><span>텍스트</span></button>
              <button type="button" className="flex flex-col items-center gap-1.5"><Palette size={32} /><span>색상</span></button>
            </div>
          )}

          {tab === 'postit' ? (
            <div className="mt-3 border-t border-[#E4DED5] pt-3">
              <div className="flex items-center justify-around">
                {postitPalette.map((c) => {
                  const active = c.key === postitColor
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setPostitColor(c.key)}
                      className={`h-12 w-12 rounded-full border-2 ${active ? 'border-[#D5BE85] ring-2 ring-[#E9D7AE]' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </motion.main>
  )
}

export default PostItEditor
