import { motion } from 'framer-motion'
import { Check, Send, StickyNote } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

function MemoryBoardSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { boardId, boardName, boardType = 'CUSTOM' } = location.state ?? {}

  if (!boardId) {
    return <Navigate to="/record/new" replace />
  }

  const routeState = { boardId, boardName, boardType }

  return (
    <motion.main
      className="app-device relative flex flex-col items-center justify-center overflow-hidden bg-[#F8F1E7] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <section className="flex w-full flex-col items-center text-center">
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#3D2415] shadow-[0_12px_28px_rgba(61,36,21,0.22)]"
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16, stiffness: 230, delay: 0.08 }}
        >
          <Check size={42} strokeWidth={2.6} className="text-white" />
        </motion.div>

        <motion.p
          className="mt-7 text-[22px] font-bold text-[#2B1810]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.22 }}
        >
          보드가 생성되었어요
        </motion.p>

        <motion.h1
          className="mt-3 max-w-full truncate rounded-full bg-white/70 px-5 py-2 text-[17px] font-bold text-[#5B3E2B]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.22 }}
        >
          {boardName}
        </motion.h1>

        <motion.p
          className="mt-4 max-w-[280px] text-[14px] font-medium leading-relaxed text-[#7F6754]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.22 }}
        >
          친구들과 함께 포스트잇과 사진으로 추억을 남겨보세요.
        </motion.p>
      </section>

      <motion.div
        className="absolute bottom-0 w-full space-y-3 px-6 pb-11"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.24 }}
      >
        <button
          type="button"
          onClick={() => navigate(`/board/${boardId}/invite`, { state: routeState })}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(61,36,21,0.22)]"
        >
          <Send size={17} strokeWidth={2} />
          친구 초대하기
        </button>
        <button
          type="button"
          onClick={() => navigate(`/board/${boardId}`, { state: routeState })}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#D9C7B4] bg-white/85 text-[15px] font-bold text-[#5B3E2B]"
        >
          <StickyNote size={17} strokeWidth={2} />
          보드 바로가기
        </button>
      </motion.div>
    </motion.main>
  )
}

export default MemoryBoardSuccessPage
