import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, ChevronLeft, ImagePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createCustomBoard, getCustomBoard } from '../api/customBoards'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { clearAuthToken } from '../api/client'
import { uploadTraceImage } from '../api/traces'
import { createVerifiedCustomBoard } from './MemoryBoardCreatePage.utils'

function MemoryBoardCreatePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [boardName, setBoardName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trimmedName = boardName.trim()
  const canSubmit = trimmedName.length > 0 && !isSubmitting

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (coverImage) URL.revokeObjectURL(coverImage)
    setCoverImage(URL.createObjectURL(file))
    setCoverImageFile(file)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      let boardImageUrl = null
      if (coverImageFile) {
        const uploaded = await uploadTraceImage(coverImageFile)
        boardImageUrl = uploaded.imageUrl ?? uploaded.url ?? null
      }

      const trimmedDescription = description.trim()
      const routeState = await createVerifiedCustomBoard(
        { createCustomBoard, getCustomBoard },
        {
          boardTitle: trimmedName,
          boardDescription: trimmedDescription,
          boardImageUrl,
        },
        {
          fallbackName: trimmedName,
          coverImage,
          description: trimmedDescription,
        }
      )

      if (!routeState?.boardId) {
        throw new Error('생성된 보드 ID를 확인할 수 없습니다.')
      }

      navigate('/record/success', {
        replace: true,
        state: routeState,
      })
    } catch (error) {
      if (handleUnauthorizedApiError(error, {
        clearToken: clearAuthToken,
        navigate,
        redirect: true,
      })) return

      setErrorMessage(getApiErrorMessage(error, {
        fallback: '보드를 만들지 못했습니다. 잠시 후 다시 시도해주세요.',
        statusMessages: {
          400: '보드 이름과 설명을 다시 확인해주세요.',
          403: '보드를 만들 권한이 없습니다.',
          409: '이미 사용 중인 보드 정보입니다.',
          500: '보드를 만들지 못했습니다. 잠시 후 다시 시도해주세요.',
        },
      }))
      setIsSubmitting(false)
    }
  }

  return (
    <motion.main
      className="app-device flex flex-col overflow-hidden bg-[#F8F1E7]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    >
      <header className="flex items-center gap-2 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="flex h-9 w-9 items-center justify-center text-[#3D2415]"
        >
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>
        <h1 className="text-[17px] font-bold text-[#2B1810]">추억 보드 만들기</h1>
      </header>

      <section className="flex-1 overflow-y-auto px-5 pb-6 pt-2 scrollbar-hide">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex aspect-[1.65] w-full items-center justify-center overflow-hidden rounded-[18px] border border-[#E7D8C6] bg-[#EADBC9] text-left shadow-[0_10px_28px_rgba(90,60,34,0.08)]"
        >
          {coverImage ? (
            <>
              <img src={coverImage} alt="대표 이미지" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/35 to-transparent p-4">
                <span className="text-[13px] font-semibold text-white">대표 이미지</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[#3D2415]">
                  <Camera size={18} strokeWidth={2} />
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[#8A715D]">
                <ImagePlus size={23} strokeWidth={1.8} />
              </span>
              <span className="text-[14px] font-bold text-[#6A4D37]">대표 이미지 선택</span>
              <span className="text-[12px] font-medium text-[#9A8068]">선택하지 않아도 만들 수 있어요</span>
            </div>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />

        <div className="mt-7 space-y-5">
          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#6F5847]">보드 이름</span>
              <span className="text-[12px] font-medium text-[#A28B76]">{boardName.length}/20</span>
            </div>
            <input
              type="text"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value.slice(0, 20))}
              placeholder="예: 성수동 생일 모임"
              className="h-[52px] w-full rounded-[14px] border border-[#E4D5C3] bg-white/85 px-4 text-[16px] font-semibold text-[#2B1810] outline-none placeholder:text-[#B4A08D] focus:border-[#6A4D37]"
            />
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#6F5847]">
                설명 <span className="font-medium text-[#A28B76]">선택</span>
              </span>
              <span className="text-[12px] font-medium text-[#A28B76]">{description.length}/80</span>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 80))}
              placeholder="함께 남기고 싶은 추억의 분위기를 적어보세요"
              rows={3}
              className="w-full resize-none rounded-[14px] border border-[#E4D5C3] bg-white/85 px-4 py-3.5 text-[15px] font-medium leading-relaxed text-[#2B1810] outline-none placeholder:text-[#B4A08D] focus:border-[#6A4D37]"
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-[14px] bg-[#FFF7F2] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#A74831]">
            {errorMessage}
          </p>
        ) : (
          <p className="mt-5 rounded-[14px] bg-[#EFE1D1] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#6A4D37]">
            보드 생성 후 친구를 초대하여 함께 추억을 남길 수 있어요.
          </p>
        )}
      </section>

      <footer className="px-5 pb-10 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full rounded-full bg-[#3D2415] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(61,36,21,0.22)] transition-opacity disabled:opacity-35"
        >
          {isSubmitting ? '만드는 중...' : '보드 만들기'}
        </button>
      </footer>
    </motion.main>
  )
}

export default MemoryBoardCreatePage
