import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bookmark, Ellipsis } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BoardCanvas from '../components/board/BoardCanvas'
import FloatingAddButton from '../components/board/FloatingAddButton'

const fontFamilyMap = {
  hand: "'Nanum Pen Script', 'Gaegu', cursive",
  soft: "'Nanum Pen Script', 'Apple SD Gothic Neo', cursive",
  gothic: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  gaeguri: "'Nanum Pen Script', 'Bradley Hand', cursive",
  nanumpen: "'Nanum Pen Script', 'Apple SD Gothic Neo', cursive",
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

function formatDate(input) {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

function mapSavedPostIt(item) {
  return {
    id: item.id ?? `postit-${Date.now()}`,
    type: 'postit',
    text: item.text ?? '',
    color: item.paperColor ?? 'yellow',
    textColor: item.textColor ?? 'rgba(59,42,31,0.93)',
    fontFamily: item.fontFamily ?? fontFamilyMap[item.font] ?? fontFamilyMap.hand,
    fontSize: item.fontSize ?? 22,
    date: formatDate(item.createdAt) || formatDate(new Date().toISOString()),
    x: item.x ?? randomRange(10, 62),
    y: item.y ?? randomRange(12, 70),
    rotation: item.rotation ?? randomRange(-3, 3),
  }
}

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [postIts, setPostIts] = useState([])
  const [polaroids, setPolaroids] = useState([])
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [justCreatedId, setJustCreatedId] = useState(null)
  const [placementDraft, setPlacementDraft] = useState(null)

  useEffect(() => {
    try {
      const storageKey = `yeoginamgim:board:${boardId}:postits`
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      if (Array.isArray(saved)) {
        setPostIts(saved.map(mapSavedPostIt))
      }
    } catch (error) {
      console.error('포스트잇 불러오기 실패:', error)
    }
  }, [boardId])

  useEffect(() => {
    const draft = location.state?.placementDraft
    if (!draft) return

    setPlacementDraft(mapSavedPostIt(draft))
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const allItemsCount = postIts.length + polaroids.length

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  const handleCreatePostIt = () => {
    setIsMenuOpen(false)
    navigate(`/board/${boardId}/postit`)
  }

  const handleCreatePolaroid = () => {
    const newId = `polaroid-${Date.now()}`
    setPolaroids((prev) => [
      ...prev,
      {
        id: newId,
        type: 'polaroid',
        text: '여기서의 순간 📷',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80',
        x: randomRange(12, 62),
        y: randomRange(18, 72),
        rotation: randomRange(-4, 4),
      },
    ])
    setSelectedItemId(newId)
    setIsMenuOpen(false)
  }

  const handlePlaceDraft = ({ x, y }) => {
    if (!placementDraft) return

    const finalized = {
      ...placementDraft,
      x,
      y,
      rotation: randomRange(-3, 3),
      createdAt: new Date().toISOString(),
    }

    const mapped = mapSavedPostIt(finalized)
    setPostIts((prev) => [...prev, mapped])
    setPlacementDraft(null)
    setSelectedItemId(mapped.id)
    setJustCreatedId(mapped.id)

    try {
      const storageKey = `yeoginamgim:board:${boardId}:postits`
      const prev = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      const next = Array.isArray(prev) ? [...prev, finalized] : [finalized]
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch (error) {
      console.error('포스트잇 저장 실패:', error)
    }

    setTimeout(() => setJustCreatedId(null), 700)
  }

  const boardSubtitle = useMemo(
    () => (placementDraft ? '위치를 드래그해서 놓아주세요' : allItemsCount === 0 ? '빈 보드' : `${allItemsCount}개의 흔적`),
    [allItemsCount, placementDraft],
  )

  return (
    <motion.main
      className="app-device relative h-full w-full overflow-hidden bg-[#F7F3EE]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#F7F3EE]">
        <header className="flex items-center justify-between px-4 pb-3 pt-4 text-[#3E2A1E]">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={28} />
          </button>

          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">성수에서 혼자 보내는 오후 ☕</h1>
            <p className="mt-0.5 text-[12px] text-[#866E59]">{boardSubtitle}</p>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full">
              <Bookmark size={24} />
            </button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full">
              <Ellipsis size={24} />
            </button>
          </div>
        </header>

        <section className="relative flex-1 px-4 pb-4">
          <BoardCanvas
            postIts={postIts}
            polaroids={polaroids}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            justCreatedId={justCreatedId}
            placementDraft={placementDraft}
            onPlaceDraft={handlePlaceDraft}
          />
        </section>
      </div>

      <FloatingAddButton
        className="absolute bottom-10 right-10 z-[9999]"
        isMenuOpen={isMenuOpen}
        onToggle={handleToggleMenu}
        onCreatePostIt={handleCreatePostIt}
        onCreatePolaroid={handleCreatePolaroid}
      />
    </motion.main>
  )
}

export default BoardDetail
