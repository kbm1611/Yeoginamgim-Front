import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Send, StickyNote } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createInviteLink } from '../api/customBoards'

function buildShareLink(boardId, inviteResponse) {
  const inviteUrl = inviteResponse?.inviteUrl ?? inviteResponse?.url ?? inviteResponse?.link
  if (inviteUrl) return inviteUrl

  const inviteCode = inviteResponse?.inviteCode ?? inviteResponse?.code
  if (inviteCode && typeof window !== 'undefined') {
    return `${window.location.origin}/board/join/${encodeURIComponent(inviteCode)}`
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/board/${boardId}/invite`
  }

  return `/board/${boardId}/invite`
}

function MemoryBoardSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { boardId, boardName, boardType = 'CUSTOM' } = location.state ?? {}
  const [inviteLink, setInviteLink] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)

  if (!boardId) {
    return <Navigate to="/record/new" replace />
  }

  const routeState = { boardId, boardName, boardType }

  const handleCopyInviteLink = async () => {
    if (isCreatingInvite) return

    setIsCreatingInvite(true)
    setCopyMessage('')

    try {
      let nextInviteLink = inviteLink

      if (!nextInviteLink) {
        const inviteResponse = await createInviteLink(boardId)
        nextInviteLink = buildShareLink(boardId, inviteResponse)
        setInviteLink(nextInviteLink)
      }

      await navigator.clipboard.writeText(nextInviteLink)
      setCopyMessage('초대 링크를 복사했어요.')
    } catch {
      setCopyMessage('초대 링크를 복사하지 못했어요. 다시 시도해주세요.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

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
          onClick={handleCopyInviteLink}
          disabled={isCreatingInvite}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(61,36,21,0.22)] disabled:opacity-60"
        >
          <Send size={17} strokeWidth={2} />
          {isCreatingInvite ? '링크 만드는 중...' : '링크 복사'}
        </button>
        {copyMessage ? (
          <p className="text-center text-[12px] font-bold text-[#7F6754]">{copyMessage}</p>
        ) : null}
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
