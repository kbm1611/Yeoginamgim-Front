import { Camera, Plus, StickyNote } from 'lucide-react'

function FloatingAddButton({
  isMenuOpen,
  onToggle,
  onCreatePostIt,
  onCreatePolaroid,
  className = 'absolute bottom-10 right-10 z-[9999]',
}) {
  return (
    <div className={`${className} flex flex-col items-end`}>
      <div
        className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3 transition-all duration-300 ease-out ${
          isMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onCreatePostIt}
          className="inline-flex min-w-[210px] items-center justify-between rounded-2xl bg-white px-6 py-4 text-[18px] font-medium text-[#4A3324] shadow-lg"
        >
          포스트잇 남기기
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4D85F] text-[#7A542E]">
            <StickyNote size={18} />
          </span>
        </button>

        <button
          type="button"
          onClick={onCreatePolaroid}
          className="inline-flex min-w-[210px] items-center justify-between rounded-2xl bg-white px-6 py-4 text-[18px] font-medium text-[#4A3324] shadow-lg"
        >
          폴라로이드 남기기
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAD3BC] text-[#6F4D35]">
            <Camera size={18} />
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex rounded-full bg-[#3E2A1E] p-4 text-white shadow-[0_8px_24px_rgba(66,38,20,0.35)]"
        aria-label="흔적 메뉴 토글"
      >
        <Plus size={34} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
    </div>
  )
}

export default FloatingAddButton
