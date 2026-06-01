import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bookmark, Ellipsis, Filter, Plus } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BoardCanvas from '../components/board/BoardCanvas'

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
  const style = item.style ?? {}
  const position = item.position ?? {}
  return {
    id: item.id ?? `postit-${Date.now()}`,
    type: 'postit',
    text: item.content ?? item.text ?? '',
    color: style.paperColor ?? item.paperColor ?? 'yellow',
    textColor: style.color ?? item.textColor ?? 'rgba(59,42,31,0.93)',
    fontFamily: style.fontFamily ?? item.fontFamily ?? fontFamilyMap[style.font ?? item.font] ?? fontFamilyMap.hand,
    fontSize: style.fontSize ?? item.fontSize ?? 22,
    date: formatDate(item.createdAt) || formatDate(new Date().toISOString()),
    x: position.x ?? item.x ?? randomRange(10, 62),
    y: position.y ?? item.y ?? randomRange(12, 70),
    rotation: item.rotation ?? randomRange(-3, 3),
    zIndex: item.zIndex ?? Math.floor(randomRange(4, 10)),
    createdAt: item.createdAt,
  }
}

function mapSavedPolaroid(item) {
  const style = item.style ?? {}
  const position = item.position ?? {}
  const media = item.media ?? {}
  return {
    id: item.id ?? `polaroid-${Date.now()}`,
    type: 'polaroid',
    text: item.content ?? item.text ?? '오늘의 기록',
    image: media.image ?? item.image ?? 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    dateLabel: media.dateLabel ?? formatDate(item.createdAt),
    textColor: style.color ?? '#3E2A1E',
    fontFamily: style.fontFamily ?? fontFamilyMap[style.font ?? item.font] ?? fontFamilyMap.hand,
    x: position.x ?? item.x ?? randomRange(10, 62),
    y: position.y ?? item.y ?? randomRange(12, 70),
    rotation: item.rotation ?? randomRange(-4, 4),
    zIndex: item.zIndex ?? Math.floor(randomRange(5, 11)),
    createdAt: item.createdAt,
  }
}

function BoardDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const boardId = id ?? 'default'

  const [postIts, setPostIts] = useState([])
  const [polaroids, setPolaroids] = useState([])
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [justCreatedId, setJustCreatedId] = useState(null)
  const [placementDraft, setPlacementDraft] = useState(null)
  const [sortMode, setSortMode] = useState('popular')

  useEffect(() => {
    try {
      const postitKey = `yeoginamgim:board:${boardId}:postits`
      const polaroidKey = `yeoginamgim:board:${boardId}:polaroids`
      const savedPostIts = JSON.parse(localStorage.getItem(postitKey) ?? '[]')
      const savedPolaroids = JSON.parse(localStorage.getItem(polaroidKey) ?? '[]')

      if (Array.isArray(savedPostIts)) setPostIts(savedPostIts.map(mapSavedPostIt))
      if (Array.isArray(savedPolaroids)) setPolaroids(savedPolaroids.map(mapSavedPolaroid))
    } catch (error) {
      console.error('보드 데이터 불러오기 실패:', error)
    }
  }, [boardId])

  useEffect(() => {
    const draft = location.state?.placementDraft
    if (!draft) return

    const mapped = draft.type === 'polaroid' ? mapSavedPolaroid(draft) : mapSavedPostIt(draft)
    setPlacementDraft(mapped)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const allItemsCount = postIts.length + polaroids.length

  const sortedPostIts = useMemo(() => {
    if (sortMode === 'latest') {
      return [...postIts].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    }
    return [...postIts].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
  }, [postIts, sortMode])

  const sortedPolaroids = useMemo(() => {
    if (sortMode === 'latest') {
      return [...polaroids].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    }
    return [...polaroids].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
  }, [polaroids, sortMode])

  const handleDraftPositionChange = ({ x, y }) => {
    setPlacementDraft((prev) => (prev ? { ...prev, x, y } : prev))
  }

  const handleCancelPlacement = () => {
    setPlacementDraft(null)
  }

  const handleConfirmPlacement = () => {
    if (!placementDraft) return

    if (placementDraft.type === 'polaroid') {
      const finalizedPolaroid = {
        id: placementDraft.id,
        type: 'polaroid',
        content: placementDraft.text,
        style: {
          color: placementDraft.textColor,
          fontFamily: placementDraft.fontFamily,
        },
        media: {
          image: placementDraft.image,
          dateLabel: placementDraft.dateLabel,
        },
        position: { x: placementDraft.x, y: placementDraft.y },
        rotation: randomRange(-4, 4),
        zIndex: Math.floor(randomRange(6, 12)),
        createdAt: new Date().toISOString(),
      }

      const mapped = mapSavedPolaroid(finalizedPolaroid)
      setPolaroids((prev) => [...prev, mapped])
      setPlacementDraft(null)
      setSelectedItemId(mapped.id)
      setJustCreatedId(mapped.id)

      try {
        const key = `yeoginamgim:board:${boardId}:polaroids`
        const prev = JSON.parse(localStorage.getItem(key) ?? '[]')
        const next = Array.isArray(prev) ? [...prev, finalizedPolaroid] : [finalizedPolaroid]
        localStorage.setItem(key, JSON.stringify(next))
      } catch (error) {
        console.error('폴라로이드 저장 실패:', error)
      }

      setTimeout(() => setJustCreatedId(null), 700)
      return
    }

    const finalizedPostIt = {
      id: placementDraft.id,
      type: 'postit',
      content: placementDraft.text,
      style: {
        fontSize: placementDraft.fontSize,
        fontFamily: placementDraft.fontFamily,
        color: placementDraft.textColor,
        paperColor: placementDraft.color,
      },
      position: { x: placementDraft.x, y: placementDraft.y },
      rotation: randomRange(-3, 3),
      zIndex: Math.floor(randomRange(5, 11)),
      createdAt: new Date().toISOString(),
    }

    const mapped = mapSavedPostIt(finalizedPostIt)
    setPostIts((prev) => [...prev, mapped])
    setPlacementDraft(null)
    setSelectedItemId(mapped.id)
    setJustCreatedId(mapped.id)

    try {
      const key = `yeoginamgim:board:${boardId}:postits`
      const prev = JSON.parse(localStorage.getItem(key) ?? '[]')
      const next = Array.isArray(prev) ? [...prev, finalizedPostIt] : [finalizedPostIt]
      localStorage.setItem(key, JSON.stringify(next))
    } catch (error) {
      console.error('포스트잇 저장 실패:', error)
    }

    setTimeout(() => setJustCreatedId(null), 700)
  }

  return (
    <motion.main
      className="app-device relative h-full w-full overflow-hidden bg-[#F7F3EE]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#F7F3EE]">
        <header className="px-4 pb-3 pt-4 text-[#3E2A1E]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowLeft size={22} />
            </button>

            <div className="text-center">
              <h1 className="text-[22px] font-semibold tracking-[-0.01em]">성수에서 혼자 보내는 오후 ☕</h1>
              <p className="mt-0.5 text-[12px] text-[#866E59]">{placementDraft ? '배치 모드' : `${allItemsCount}개 흔적`}</p>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full">
                <Bookmark size={20} />
              </button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full">
                <Ellipsis size={20} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="rounded-full border border-[#E5DBCE] bg-[#FBF8F3] p-1">
              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setSortMode('popular')}
                  className={`rounded-full px-4 py-1.5 font-medium ${sortMode === 'popular' ? 'bg-[#4A3124] text-white' : 'text-[#6b5647]'}`}
                >
                  인기순
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('latest')}
                  className={`rounded-full px-4 py-1.5 font-medium ${sortMode === 'latest' ? 'bg-[#4A3124] text-white' : 'text-[#6b5647]'}`}
                >
                  최신순
                </button>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[#E5DBCE] bg-[#FBF8F3] px-4 py-2 text-sm font-medium text-[#4A3124]"
            >
              <Filter size={15} />
              필터
            </button>
          </div>
        </header>

        <section className="relative flex-1 px-4 pb-4">
          <BoardCanvas
            postIts={sortedPostIts}
            polaroids={sortedPolaroids}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            justCreatedId={justCreatedId}
            placementDraft={placementDraft}
            onDraftPositionChange={handleDraftPositionChange}
          />
        </section>

        {placementDraft ? (
          <div className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl border border-[#E8DED2] bg-white p-3 shadow-[0_14px_28px_rgba(41,25,16,0.12)]">
            <p className="mb-1 text-center text-[11px] font-semibold text-[#7A4218]">배치 모드</p>
            <p className="mb-2 text-center text-xs text-[#765e4f]">이 위치에 남길까요?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelPlacement}
                className="flex-1 rounded-xl border border-[#e5d8cb] bg-white py-2 text-sm font-medium text-[#5c4638]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmPlacement}
                className="flex-1 rounded-xl bg-[#4A3124] py-2 text-sm font-semibold text-white"
              >
                남기기
              </button>
            </div>
          </div>
        ) : null}

        {!placementDraft ? (
          <button
            type="button"
            onClick={() => navigate(`/board/${boardId}/postit`)}
            className="absolute bottom-7 right-6 z-50 inline-flex rounded-full bg-[#4A3124] p-4 text-white shadow-[0_10px_22px_rgba(66,38,20,0.28)]"
            aria-label="흔적 남기기"
          >
            <Plus size={28} />
          </button>
        ) : null}
      </div>
    </motion.main>
  )
}

export default BoardDetail
