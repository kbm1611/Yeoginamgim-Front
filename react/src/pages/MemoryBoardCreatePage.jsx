import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function MemoryBoardCreatePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [visibility, setVisibility] = useState('friends')

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverImage(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    navigate('/record/success', { state: { name, coverImage, visibility } })
  }

  return (
    <motion.div
      className="app-device flex flex-col bg-[#F7F2EA]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center text-[#3D2415]">
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>
        <h1 className="text-[17px] font-bold text-[#2B1810]">추억 보드 만들기</h1>
      </div>

      {/* 바디 */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-2 scrollbar-hide">

        {/* 대표 이미지 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#EDE0D0]"
        >
          {coverImage ? (
            <>
              <img src={coverImage} alt="대표 이미지" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/25">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[#3D2415]">
                  <Camera size={20} />
                </div>
                <span className="text-[12px] font-semibold text-white">변경</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/60 text-[#8A715D]">
                <Camera size={24} />
              </div>
              <span className="text-[13px] font-medium text-[#8A715D]">대표 이미지 추가</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverImageChange}
        />

        {/* 보드 이름 */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-semibold text-[#8A715D]">보드 이름</label>
            <span className="text-[12px] font-medium text-[#9C8C7D]">{name.length}/20</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="어떤 추억인가요?"
            className="mt-2 w-full rounded-xl border border-[#eadfce] bg-white/85 px-4 py-3.5 text-[15px] font-medium text-[#2B1810] outline-none placeholder:text-[#9C8C7D] focus:border-[#3D2415]"
          />
        </div>

        {/* 설명 */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-semibold text-[#8A715D]">
              설명 <span className="font-normal text-[#B0A090]">(선택)</span>
            </label>
            <span className="text-[12px] font-medium text-[#9C8C7D]">{description.length}/100</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 100))}
            placeholder="이 추억에 대해 간단히 적어보세요"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-[#eadfce] bg-white/85 px-4 py-3.5 text-[15px] font-medium text-[#2B1810] outline-none placeholder:text-[#9C8C7D] focus:border-[#3D2415]"
          />
        </div>

        {/* 공개 설정 */}
        <div>
          <label className="text-[13px] font-semibold text-[#8A715D]">공개 설정</label>
          <div className="mt-2 space-y-2">
            <VisibilityOption
              value="public"
              selected={visibility === 'public'}
              onSelect={() => setVisibility('public')}
              title="공개"
              description="누구나 볼 수 있어요"
            />
            <VisibilityOption
              value="friends"
              selected={visibility === 'friends'}
              onSelect={() => setVisibility('friends')}
              title="친구만"
              description="초대받은 친구만 볼 수 있어요"
            />
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* 푸터 */}
      <div className="px-5 pb-10 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full rounded-full bg-[#3D2415] py-4 text-[16px] font-bold text-white shadow-[0_4px_14px_rgba(61,36,21,0.25)] disabled:opacity-35 transition-opacity"
        >
          보드 만들기
        </button>
      </div>
    </motion.div>
  )
}

function VisibilityOption({ selected, onSelect, title, description }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors ${
        selected ? 'border-[#3D2415] bg-[#3D2415]/5' : 'border-[#eadfce] bg-white/85'
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-[#3D2415]' : 'border-[#C4B4A4]'
      }`}>
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-[#3D2415]" />}
      </div>
      <div>
        <p className="text-[14px] font-bold text-[#2B1810]">{title}</p>
        <p className="mt-0.5 text-[12px] font-medium text-[#8A715D]">{description}</p>
      </div>
    </button>
  )
}

export default MemoryBoardCreatePage
