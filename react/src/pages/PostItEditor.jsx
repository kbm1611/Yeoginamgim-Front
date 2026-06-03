import { motion } from 'framer-motion'
import { Camera, Copy, RotateCcw, StickyNote, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createTrace, uploadTraceImage } from '../api/traces'
import postitYellow from '../assets/images/postits/yellow.png'
import postitPink from '../assets/images/postits/pink-torn.png'
import postitGreen from '../assets/images/postits/green.png'
import postitCream from '../assets/images/postits/grid-cream.png'

const tabs = [
  { key: 'polaroid', label: '포토카드', Icon: Camera },
  { key: 'postit', label: '포스트잇', Icon: StickyNote },
]

const postitPalette = [
  { key: 'yellow', hex: '#F3D98E', texture: postitYellow },
  { key: 'pink',   hex: '#EEB7C6', texture: postitPink },
  { key: 'green',  hex: '#D2D4A2', texture: postitGreen },
  { key: 'cream',  hex: '#F0EAD6', texture: postitCream },
  { key: 'white',  hex: '#F8F6F0', texture: null },
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
        {/* X 버튼 */}
        <div className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          <X size={13} strokeWidth={2.5} className="text-[#333]" />
        </div>
        {/* 핸들 7개 */}
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
        {/* 회전/리사이즈 버튼 */}
        <div className="absolute -bottom-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          <span className="text-[13px] font-bold text-[#555]">Q</span>
        </div>
      </div>
    </div>
  )
}

// 툴바 버튼
function ToolBtn({ label, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#EAE5DC] text-[#3A2E26]">
        {children}
      </div>
      <span className="text-[12px] font-medium text-[#3A2E26]">{label}</span>
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activePalette = useMemo(() => postitPalette.find((p) => p.key === postitColor) ?? postitPalette[0], [postitColor])
  const currentPhoto = selectedPhotoPreview || photos[photoIdx]

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

  const handleNextPostitColor = () => {
    setPostitColor((current) => {
      const currentIndex = postitPalette.findIndex((item) => item.key === current)
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % postitPalette.length

      return postitPalette[nextIndex].key
    })
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
                    font: 'hand',
                    paperColor: 'white',
                    textColor: '#2E231B',
                  }
                : {
                    paperColor: postitColor,
                    backgroundColor: activePalette.hex,
                    textColor: '#2D2218',
                    fontFamily: 'Nanum Pen Script',
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
      className="app-device overflow-hidden bg-[#F2EFE9]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex h-full flex-col px-5 pt-4">

        {/* 헤더 */}
        <header className="flex items-center justify-between text-[#1D1713]">
          <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center">
            <X size={26} strokeWidth={2} />
          </button>
          <h1 className="text-[19px] font-bold tracking-[-0.02em]">흔적 남기기</h1>
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting}
            className="text-[17px] font-bold disabled:opacity-50"
          >
            {isSubmitting ? '저장 중' : '완료'}
          </button>
        </header>

        {submitError ? (
          <p className="mt-2 rounded-[8px] bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">
            {submitError}
          </p>
        ) : null}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoFileChange}
        />

        {/* 탭 */}
        <div className="mt-4 rounded-[14px] bg-[#E8E4DE] p-1">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map(({ key, label, Icon }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center justify-center gap-2 rounded-[10px] py-3 text-[15px] font-semibold transition-all ${
                    active ? 'bg-[#2A1F17] text-white shadow-sm' : 'text-[#6B5344]'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 프리뷰 */}
        <div
          className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-[22px]"
          style={{ backgroundColor: '#EAE5DC' }}
        >
          {tab === 'polaroid' ? (
            /* ── 폴라로이드 ── */
            <div className="relative" style={{ transform: 'rotate(-4deg)' }}>

              {/* 테이프 2개 */}
              <div className="absolute left-[30%] top-0 z-20 h-[22px] w-[80px] -translate-y-1/2 rotate-[-6deg] rounded-[3px] opacity-85"
                style={{ backgroundColor: '#C9B99A' }} />
              <div className="absolute left-[38%] top-0 z-20 h-[22px] w-[80px] -translate-y-1/2 rotate-[3deg] rounded-[3px] opacity-80"
                style={{ backgroundColor: '#C9B99A' }} />

              {/* 폴라로이드 프레임 */}
              <div className="relative bg-white shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                style={{ width: 300, borderRadius: 4, padding: '10px 10px 52px 10px' }}>

                {/* 사진 */}
                <img
                  src={currentPhoto}
                  alt="preview"
                  className="w-full rounded-[2px] object-cover"
                  style={{ height: 280 }}
                  onClick={handleSamplePhotoChange}
                />

                {/* 스티커 장식 */}
                <span className="absolute -right-3 top-6 text-[34px]" style={{ transform: 'rotate(8deg)' }}>💗</span>
                <span className="absolute -left-5 top-[40%] text-[28px]">🌸</span>
                <span className="absolute -right-4 top-[55%] text-[30px]" style={{ transform: 'rotate(-10deg)' }}>⭐</span>
                <span className="absolute -right-3 bottom-12 text-[34px]">🩷</span>

                {/* 텍스트 (하단 여백) */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-3 pb-2 pt-1">
                  <SelectionBox>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full resize-none border-none bg-transparent text-center leading-[1.3] text-[#19130F] outline-none"
                      style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive", fontSize: 26, height: 38 }}
                      rows={1}
                    />
                  </SelectionBox>
                </div>
              </div>
            </div>
          ) : (
            /* ── 포스트잇 ── */
            <div className="relative" style={{ transform: 'rotate(3deg)' }}>
              {/* 테이프 */}
              <div className="absolute left-1/2 top-0 z-10 h-[24px] w-[90px] -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] rounded-[3px] opacity-80"
                style={{ backgroundColor: '#C9B99A' }} />
              <div
                className="relative shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
                style={{
                  width: 260,
                  minHeight: 240,
                  borderRadius: 4,
                  backgroundColor: activePalette.hex,
                  backgroundImage: activePalette.texture ? `url(${activePalette.texture})` : undefined,
                  backgroundSize: 'cover',
                }}
              >
                <div className="flex items-center justify-center px-6 pb-8 pt-10">
                  <SelectionBox>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full resize-none border-none bg-transparent text-center leading-[1.4] text-[#2D2218] outline-none"
                      style={{ fontFamily: "'Nanum Pen Script', 'Gaegu', cursive", fontSize: 28, minHeight: 80 }}
                      rows={3}
                    />
                  </SelectionBox>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 툴바 */}
        <div className="mt-4 flex items-start justify-around px-1">
          <ToolBtn label="사진" onClick={() => photoInputRef.current?.click()}>
            <Camera size={24} strokeWidth={1.7} />
          </ToolBtn>
          <ToolBtn label="스티커">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/>
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </ToolBtn>
          <ToolBtn label="텍스트">
            <span className="text-[22px] font-bold">T</span>
          </ToolBtn>
          <ToolBtn label="펜">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </ToolBtn>
          <ToolBtn label="색상" onClick={handleNextPostitColor}>
            <div className="h-7 w-7 rounded-full" style={{
              background: 'conic-gradient(#FF6B6B, #FFD93D, #6BCB77, #4D96FF, #CC77FF, #FF6B6B)'
            }} />
          </ToolBtn>
        </div>


        {/* 하단 액션바 */}
        <div className="mt-3 flex items-center justify-around border-t border-[#DDD8D0] pb-6 pt-3">
          <button type="button" className="flex flex-col items-center gap-1 text-[#3A2E26]">
            <RotateCcw size={24} strokeWidth={1.7} />
            <span className="text-[12px]">되돌리기</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-[#3A2E26]">
            <Copy size={24} strokeWidth={1.7} />
            <span className="text-[12px]">복제</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-[#3A2E26]">
            <Trash2 size={24} strokeWidth={1.7} />
            <span className="text-[12px]">삭제</span>
          </button>
        </div>

      </div>
    </motion.main>
  )
}

export default PostItEditor
