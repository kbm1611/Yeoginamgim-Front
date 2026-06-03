import { useEffect, useState } from 'react'
import { Filter, Home, Plus, ScanSearch, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'
import { createTraceReport } from '../api/reports'
import { addTraceLike, fetchBoardTraces, removeTraceLike } from '../api/traces'
import BoardCanvas from '../components/board/BoardCanvas'
import boardBg from '../assets/image.png'

const POSTIT_COLOR_BY_HEX = {
  '#fff8dc': 'cream',
  '#ffe4e1': 'pink',
  '#f3d98e': 'yellow',
  '#eeb7c6': 'pink',
  '#d2d4a2': 'green',
  '#f0ead6': 'cream',
  '#f8f6f0': 'white',
}

function parseStyleJson(styleJson) {
  if (!styleJson) return {}
  if (typeof styleJson === 'object') return styleJson

  try {
    return JSON.parse(styleJson)
  } catch {
    return {}
  }
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  if (/^[a-zA-Z]:[\\/]/.test(imageUrl)) return ''
  if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`

  return imageUrl
}

function resolvePaperColor(style) {
  if (style.paperColor) return style.paperColor

  const backgroundColor = style.backgroundColor?.toLowerCase()
  return POSTIT_COLOR_BY_HEX[backgroundColor] ?? 'yellow'
}

function formatDateLabel(dateText) {
  if (!dateText) return ''

  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function traceToPost(trace) {
  const element = trace.elements?.[0] ?? {}
  const style = parseStyleJson(element.styleJson)
  const isPolaroid = element.contentType === 'POLAROID'

  return {
    id: trace.traceId ?? element.elementId,
    type: isPolaroid ? 'polaroid' : 'postit',
    content: element.textContent ?? '',
    media: isPolaroid
      ? {
          image: resolveImageUrl(element.imageUrl),
          dateLabel: formatDateLabel(trace.createdAt),
        }
      : undefined,
    style: isPolaroid
      ? {
          ...style,
          color: style.textColor ?? '#2E231B',
        }
      : {
          ...style,
          paperColor: resolvePaperColor(style),
        },
    position: {
      x: trace.traceX,
      y: trace.traceY,
    },
    createdAt: trace.createdAt,
    likes: trace.likeCount ?? 0,
    liked: trace.liked === true,
    nickname: trace.nickname,
  }
}

function BoardDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [sort, setSort] = useState('latest')
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadTraces() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await fetchBoardTraces(boardId, { sort, limit: 100 })
        if (ignore) return

        setPosts((data.traces ?? []).map(traceToPost))
      } catch (error) {
        if (ignore) return

        setPosts([])
        setErrorMessage(error.message ?? '흔적을 불러오지 못했습니다.')
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadTraces()

    return () => {
      ignore = true
    }
  }, [boardId, sort])

  const renderBoardContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-[18px] font-semibold text-[#5C4030]">
          흔적을 불러오는 중...
        </div>
      )
    }

    if (errorMessage) {
      return (
        <div className="flex h-full items-center justify-center px-8 text-center">
          <div className="rounded-[8px] bg-white/85 px-5 py-4 text-[#5C4030] shadow-md backdrop-blur-sm">
            <p className="text-[16px] font-semibold">흔적을 불러오지 못했습니다.</p>
            <p className="mt-2 break-words text-[13px] text-[#8A6A58]">{errorMessage}</p>
          </div>
        </div>
      )
    }

    return (
      <BoardCanvas
        posts={posts}
        onAdd={handleAdd}
        onToggleLike={handleToggleLike}
        onReport={handleCreateReport}
      />
    )
  }

  const handleAdd = () => navigate(`/board/${boardId}/postit`)
  const handleGoHome = () => navigate('/home')
  const handleGoMyPage = () => navigate('/my')
  const handleToggleLike = async (post) => {
    const result = post.liked ? await removeTraceLike(post.id) : await addTraceLike(post.id)

    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: result.liked === true,
              likes: result.likeCount ?? item.likes,
            }
          : item,
      ),
    )

    return result
  }

  const handleCreateReport = (post, reportKind) => {
    return createTraceReport(post.id, { reportKind })
  }

  return (
    <main className="app-device relative overflow-hidden">
      {/* 항상 꽉 차는 보드 배경 — 줌과 무관하게 고정 */}
      <img
        src={boardBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* 플로팅 헤더 */}
      <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
        <div className="flex gap-1 rounded-full bg-white/85 p-1 shadow-md backdrop-blur-sm">
          {[
            { key: 'popular', label: '인기순' },
            { key: 'latest', label: '최신순' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
                sort === key ? 'bg-[#3D2B1F] text-white shadow-sm' : 'text-[#6B5344]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="홈으로 이동"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#3D2B1F] shadow-md backdrop-blur-sm"
          >
            <Home size={17} />
          </button>
          <button
            type="button"
            onClick={handleGoMyPage}
            aria-label="내 화면으로 이동"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#3D2B1F] shadow-md backdrop-blur-sm"
          >
            <UserRound size={17} />
          </button>
          <button
            type="button"
            aria-label="필터"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#3D2B1F] shadow-md backdrop-blur-sm"
          >
            <Filter size={17} />
          </button>
        </div>
      </div>

      {/* 보드 캔버스 */}
      <div className="absolute inset-0">
        {renderBoardContent()}
      </div>

      {/* 플로팅 버튼 */}
      <button
        type="button"
        className="absolute bottom-7 left-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#3D2B1F] shadow-[0_8px_20px_rgba(57,39,25,0.18)]"
      >
        <ScanSearch size={22} />
      </button>
      <button
        type="button"
        onClick={handleAdd}
        className="absolute bottom-7 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3D2B1F] text-white shadow-[0_8px_20px_rgba(57,39,25,0.3)]"
      >
        <Plus size={26} />
      </button>
    </main>
  )
}

export default BoardDetail
