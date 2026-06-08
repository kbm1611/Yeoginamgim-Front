import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function MemoryBoardSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { name } = location.state ?? {}

  return (
    <motion.div
      className="app-device flex flex-col items-center justify-center bg-[#F7F2EA] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center">
        {/* 체크 아이콘 */}
        <motion.div
          className="flex h-24 w-24 items-center justify-center rounded-full bg-[#3D2415]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <Check size={44} strokeWidth={2.5} className="text-white" />
          </motion.div>
        </motion.div>

        <motion.h1
          className="mt-7 text-[22px] font-bold text-[#2B1810]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          보드가 생성되었어요!
        </motion.h1>

        <motion.p
          className="mt-2 text-center text-[14px] font-medium leading-relaxed text-[#8A715D]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.2 }}
        >
          {name ? (
            <>
              <span className="font-bold text-[#3D2415]">{name}</span>에<br />
              이제 첫 흔적을 남겨보세요.
            </>
          ) : (
            '이제 첫 흔적을 남겨보세요.'
          )}
        </motion.p>
      </div>

      {/* 버튼 영역 */}
      <motion.div
        className="absolute bottom-0 w-full px-6 pb-12 space-y-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.25 }}
      >
        <button
          type="button"
          onClick={() => navigate('/board/1')} // TODO: 실제 boardId로 교체
          className="w-full rounded-full bg-[#3D2415] py-4 text-[16px] font-bold text-white shadow-[0_4px_14px_rgba(61,36,21,0.25)]"
        >
          보드로 이동하기
        </button>
        <button
          type="button"
          onClick={() => navigate('/archive')}
          className="w-full rounded-full border border-[#D0C4B5] bg-white/85 py-4 text-[15px] font-semibold text-[#5F412B]"
        >
          보드 목록 보기
        </button>
      </motion.div>
    </motion.div>
  )
}

export default MemoryBoardSuccessPage
