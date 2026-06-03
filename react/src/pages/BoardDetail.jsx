import { useEffect, useState } from 'react'
import { Filter, Plus, ScanSearch } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BoardCanvas from '../components/board/BoardCanvas'
import boardBg from '../assets/image.png'

const storageKey = (id) => `board_posts_${id}`

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [sort, setSort] = useState('latest')
  const [posts, setPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(boardId))) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const draft = location.state?.placementDraft
    if (!draft) return
    const post = { ...draft }

    queueMicrotask(() => {
      setPosts((prev) => {
        const next = [post, ...prev]
        localStorage.setItem(storageKey(boardId), JSON.stringify(next))
        return next
      })
      navigate(location.pathname, { replace: true, state: {} })
    })
  }, [boardId, location.pathname, location.state?.placementDraft, navigate])

  const sortedPosts =
    sort === 'latest'
      ? [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [...posts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))

  const handleAdd = () => navigate(`/board/${boardId}/postit`)

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
            { key: 'popular', label: '랭기순' },
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
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm text-[#3D2B1F]"
        >
          <Filter size={17} />
        </button>
      </div>

      {/* 보드 캔버스 */}
      <div className="absolute inset-0">
        <BoardCanvas posts={sortedPosts} onAdd={handleAdd} />
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
