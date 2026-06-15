import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Copy, MessageCircle, UserRound } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getCustomBoardMembers, joinCustomBoard } from '../api/customBoards'
import { getAuthToken } from '../api/client'

function getJoinedBoardId(joinedBoard) {
  return (
    joinedBoard?.boardId ??
    joinedBoard?.customBoardId ??
    joinedBoard?.id ??
    joinedBoard?.board?.boardId ??
    joinedBoard?.board?.customBoardId ??
    joinedBoard?.board?.id
  )
}

function getJoinedBoardName(joinedBoard, fallback) {
  return (
    joinedBoard?.boardTitle ??
    joinedBoard?.boardName ??
    joinedBoard?.name ??
    joinedBoard?.board?.boardTitle ??
    joinedBoard?.board?.boardName ??
    joinedBoard?.board?.name ??
    fallback
  )
}

function getJoinErrorMessage(error) {
  if (error?.status === 404) return '잘못되었거나 만료된 초대 링크예요.'
  if (error?.status === 409) return '이미 참여한 보드예요.'
  if (error?.status === 403) return '이 초대 링크로 참여할 권한이 없어요.'

  return error?.message ?? '초대 링크로 참여하지 못했어요. 다시 시도해주세요.'
}

function InviteBoardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id, inviteCode } = useParams()
  const { boardName, boardType = 'CUSTOM' } = location.state ?? {}
  const [copyMessage, setCopyMessage] = useState('')
  const [joinMessage, setJoinMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [members, setMembers] = useState([])
  const isJoinMode = Boolean(inviteCode)

  useEffect(() => {
    if (!id || isJoinMode) return
    getCustomBoardMembers(id)
      .then((data) => {
        const list = data.members ?? data.content ?? (Array.isArray(data) ? data : [])
        setMembers(list)
      })
      .catch(() => {})
  }, [id, isJoinMode])

  const inviteLink = useMemo(() => {
    if (isJoinMode) {
      if (typeof window === 'undefined') return `/board/join/${inviteCode}`
      return `${window.location.origin}/board/join/${inviteCode}`
    }

    if (typeof window === 'undefined') return `/board/${id}`
    return `${window.location.origin}/board/${id}`
  }, [id, inviteCode, isJoinMode])

  if (!id && !inviteCode) {
    return <Navigate to="/record/new" replace />
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('초대 링크를 복사했어요.')
    } catch {
      setCopyMessage('링크를 직접 복사해주세요.')
    }
  }

  const handleKakaoShare = () => {
    const kakao = window.Kakao

    if (kakao?.Share?.sendDefault) {
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: boardName ?? '추억 보드',
          description: '함께 포스트잇과 사진으로 추억을 남겨보세요.',
          imageUrl: 'https://via.placeholder.com/600x400/F0DFC8/3D2415?text=Yeoginamgim',
          link: {
            mobileWebUrl: inviteLink,
            webUrl: inviteLink,
          },
        },
        buttons: [
          {
            title: '보드 참여하기',
            link: {
              mobileWebUrl: inviteLink,
              webUrl: inviteLink,
            },
          },
        ],
      })
      return
    }

    handleCopy()
  }

  const handleJoin = async () => {
    if (!inviteCode || isJoining) return

    if (!getAuthToken()) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    setIsJoining(true)
    setJoinMessage('')

    try {
      const joinedBoard = await joinCustomBoard(inviteCode)
      const joinedBoardId = getJoinedBoardId(joinedBoard)

      if (!joinedBoardId) {
        throw new Error('참여한 보드 정보를 확인하지 못했어요.')
      }

      navigate(`/board/${joinedBoardId}`, {
        replace: true,
        state: {
          boardId: joinedBoardId,
          boardName: getJoinedBoardName(joinedBoard, boardName),
          boardType: 'CUSTOM',
        },
      })
    } catch (error) {
      setJoinMessage(getJoinErrorMessage(error))
    } finally {
      setIsJoining(false)
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
        <h1 className="text-[17px] font-bold text-[#2B1810]">
          {isJoinMode ? '보드 참여하기' : '친구 초대하기'}
        </h1>
      </header>

      <section className="flex-1 overflow-y-auto px-5 pb-8 pt-4 scrollbar-hide">
        <div className="rounded-[18px] bg-[#EEDFCC] px-5 py-5">
          <p className="text-[13px] font-bold text-[#7A5D46]">초대 링크</p>
          <p className="mt-3 break-all rounded-[14px] bg-white/80 px-4 py-3 text-[14px] font-semibold leading-relaxed text-[#3D2415]">
            {inviteLink}
          </p>
          {copyMessage ? (
            <p className="mt-2 text-[12px] font-semibold text-[#7A5D46]">{copyMessage}</p>
          ) : null}
          {joinMessage ? (
            <p className="mt-2 text-[12px] font-semibold text-[#A74831]">{joinMessage}</p>
          ) : null}
        </div>

        {!isJoinMode ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#3D2415] text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(61,36,21,0.18)]"
            >
              <Copy size={16} strokeWidth={2} />
              링크 복사
            </button>
            <button
              type="button"
              onClick={handleKakaoShare}
              className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#FEE500] text-[14px] font-bold text-[#3A2920]"
            >
              <MessageCircle size={16} strokeWidth={2} />
              카카오톡 공유
            </button>
          </div>
        ) : null}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#2B1810]">현재 참여자</h2>
            {members.length > 0 && (
              <span className="text-[12px] font-semibold text-[#9A8068]">{members.length}명</span>
            )}
          </div>

          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="flex items-center justify-between rounded-[16px] bg-white/82 px-4 py-3.5 shadow-[0_8px_24px_rgba(90,60,34,0.07)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE1D1] text-[#6A4D37]">
                    <UserRound size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#2B1810]">나</p>
                    <p className="text-[12px] font-medium text-[#9A8068]">보드를 만든 사람</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#6A4D37] px-3 py-1 text-[12px] font-bold text-white">보드장</span>
              </div>
            ) : (
              members.map((member, i) => {
                const name = member.nickname ?? member.name ?? member.username ?? '멤버'
                const isOwner = member.role === 'OWNER' || member.role === '보드장' || i === 0
                return (
                  <div key={member.memberId ?? member.userId ?? member.id ?? i} className="flex items-center justify-between rounded-[16px] bg-white/82 px-4 py-3.5 shadow-[0_8px_24px_rgba(90,60,34,0.07)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE1D1] text-[#6A4D37]">
                        <UserRound size={20} strokeWidth={1.8} />
                      </span>
                      <p className="text-[14px] font-bold text-[#2B1810]">{name}</p>
                    </div>
                    {isOwner && (
                      <span className="rounded-full bg-[#6A4D37] px-3 py-1 text-[12px] font-bold text-white">보드장</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </section>

      <footer className="px-5 pb-10 pt-3">
        <button
          type="button"
          onClick={isJoinMode ? handleJoin : () => navigate(`/board/${id}`, { state: { boardId: id, boardName, boardType } })}
          disabled={isJoinMode && isJoining}
          className="h-14 w-full rounded-full border border-[#D9C7B4] bg-white/85 text-[15px] font-bold text-[#5B3E2B]"
        >
          {isJoinMode ? (isJoining ? '참여 중...' : '참여하기') : '보드 바로가기'}
        </button>
      </footer>
    </motion.main>
  )
}

export default InviteBoardPage
