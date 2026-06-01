import { Camera, Plus, StickyNote } from 'lucide-react'

function FloatingAddButton({
  isMenuOpen,
  onToggle,
  onCreatePostIt,
  onCreatePolaroid,
  className = 'absolute bottom-6 right-5 z-[9999]',
}) {
  return (
    <div className={`${className} flex flex-col items-end`}>
      <div
        className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2 transition-all duration-300 ease-out ${
          isMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onCreatePostIt}
          className="inline-flex min-w-[184px] items-center justify-between rounded-2xl border border-[#E9DFD2] bg-white px-4 py-3 text-[15px] font-medium text-[#4A3324] shadow-[0_10px_18px_rgba(41,25,16,0.14)]"
        >
          포스트잇 남기기
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4D85F] text-[#7A542E]">
            <StickyNote size={17} />
          </span>
        </button>

        <button
          type="button"
          onClick={onCreatePolaroid}
          className="inline-flex min-w-[184px] items-center justify-between rounded-2xl border border-[#E9DFD2] bg-white px-4 py-3 text-[15px] font-medium text-[#4A3324] shadow-[0_10px_18px_rgba(41,25,16,0.14)]"
        >
          폴라로이드 남기기
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAD3BC] text-[#6F4D35]">
            <Camera size={17} />
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex rounded-full bg-[radial-gradient(circle_at_30%_30%,#7a4f2f,#4a3124)] p-4 text-white shadow-[0_10px_22px_rgba(66,38,20,0.28)]"
        aria-label="흔적 메뉴 토글"
      >
        <Plus size={30} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
    </div>
  )
}

export default FloatingAddButton
