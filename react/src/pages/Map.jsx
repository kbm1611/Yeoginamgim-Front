import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Coffee,
  Crosshair,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trees,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const categories = [
  { key: 'all', label: '전체', icon: '🤎', active: true },
  { key: 'cafe', label: '카페', icon: '☕' },
  { key: 'food', label: '맛집', icon: '🍴' },
  { key: 'shop', label: '편집샵', icon: '🛍️' },
  { key: 'park', label: '공원', icon: '🌲' },
  { key: 'culture', label: '문화', icon: '🏛️' },
]

const places = [
  {
    id: 'onion',
    name: '어니언 성수',
    category: '카페',
    distance: '450m',
    icon: Coffee,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    pos: { top: '35%', left: '50%' },
  },
  {
    id: 'yeonbang',
    name: '성수연방',
    category: '문화',
    distance: '650m',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    pos: { top: '49%', left: '22%' },
  },
  {
    id: 'mildo',
    name: '밀도 성수',
    category: '베이커리',
    distance: '800m',
    icon: Coffee,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    pos: { top: '60%', left: '51%' },
  },
  {
    id: 'daelim',
    name: '대림창고',
    category: '편집샵',
    distance: '1.2km',
    icon: ShoppingBag,
    image: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=600&q=80',
    pos: { top: '62%', left: '78%' },
  },
  {
    id: 'forest',
    name: '서울숲',
    category: '공원',
    distance: '1.2km',
    icon: Trees,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=600&q=80',
    pos: { top: '76%', left: '22%' },
  },
]

const SHEET = {
  MIN: 'MIN',
  HALF: 'HALF',
  FULL: 'FULL',
  FULL_DETAIL: 'FULL_DETAIL',
}

const cycleOrder = [SHEET.MIN, SHEET.HALF, SHEET.FULL, SHEET.FULL_DETAIL]
const MAP_STATE_KEY = 'map_ui_state'

function MapPage() {
  const navigate = useNavigate()

  const [selectedPlaceId, setSelectedPlaceId] = useState(() => {
    const saved = sessionStorage.getItem(MAP_STATE_KEY)
    if (!saved) return places[0].id
    try {
      return JSON.parse(saved).selectedPlaceId ?? places[0].id
    } catch {
      return places[0].id
    }
  })

  const [sheetState, setSheetState] = useState(() => {
    const saved = sessionStorage.getItem(MAP_STATE_KEY)
    if (!saved) return SHEET.HALF
    try {
      return JSON.parse(saved).sheetState ?? SHEET.HALF
    } catch {
      return SHEET.HALF
    }
  })

  useEffect(() => {
    sessionStorage.setItem(MAP_STATE_KEY, JSON.stringify({ selectedPlaceId, sheetState }))
  }, [selectedPlaceId, sheetState])

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? places[0],
    [selectedPlaceId],
  )

  const onHandleToggle = () => {
    const currentIndex = cycleOrder.indexOf(sheetState)
    const nextIndex = (currentIndex + 1) % cycleOrder.length
    setSheetState(cycleOrder[nextIndex])
  }

  const onSelectPlace = (placeId) => {
    setSelectedPlaceId(placeId)
    setSheetState((prev) => (prev === SHEET.MIN ? SHEET.HALF : prev))
  }

  const onMarkerClick = (placeId) => {
    setSelectedPlaceId(placeId)
    navigate(`/place/${placeId}`)
  }

  const onPlaceCardClick = (placeId) => {
    if (selectedPlaceId === placeId) {
      navigate(`/place/${placeId}`)
      return
    }
    onSelectPlace(placeId)
  }

  const sheetHeightClass =
    sheetState === SHEET.MIN
      ? 'h-[120px]'
      : sheetState === SHEET.HALF
        ? 'h-[380px]'
        : sheetState === SHEET.FULL
          ? 'h-[calc(100vh-140px)]'
          : 'h-full rounded-none'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 z-0 h-full w-full bg-[#F4F1EA]">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(219,205,187,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(219,205,187,0.28)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute -right-[12%] top-[8%] h-[40%] w-[42%] rounded-[50%] bg-[#d8e2ea]/65" />
        <div className="absolute -left-[8%] bottom-[18%] h-[34%] w-[56%] rounded-[48%] bg-[#dfe6d3]/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.55),transparent_42%),radial-gradient(circle_at_70%_85%,rgba(255,255,255,0.32),transparent_38%)]" />
      </div>

      <div className="absolute inset-0 z-[5] pointer-events-none">
        {places.map((place) => {
          const Icon = place.icon
          const isActive = place.id === selectedPlaceId

          return (
            <article
              key={place.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ top: place.pos.top, left: place.pos.left }}
            >
              <button type="button" onClick={() => onMarkerClick(place.id)} className="block">
                <div className={`mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg ${isActive ? 'bg-[#2E1D13]' : 'bg-[#3E2A1E]'}`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className={`min-w-[104px] rounded-[12px] border bg-white px-3 py-2 text-left shadow-[0_8px_16px_rgba(62,42,30,0.12)] ${isActive ? 'border-[#8C5A38]' : 'border-[#E8DDD1]'}`}>
                  <p className="text-[16px] font-semibold leading-tight text-[#3A2A1F]">{place.name}</p>
                  <p className="mt-1 text-[13px] text-[#8B796B]">📍 {place.distance}</p>
                </div>
              </button>
            </article>
          )
        })}
      </div>

      <div className="absolute top-0 left-0 z-10 flex w-full flex-col gap-2 bg-gradient-to-b from-[#FAF6F0]/95 via-[#FAF6F0]/70 to-transparent p-4 pb-8">
        <div className="flex items-center justify-between">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DFD2] bg-white/95 px-5 py-3 text-[15px] font-medium text-[#4A3628] shadow-sm">
            <MapPin size={16} />성수동<ChevronDown size={15} />
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DFD2] bg-white/95 px-5 py-3 text-[15px] font-medium text-[#4A3628] shadow-sm">
            <SlidersHorizontal size={16} />필터
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[#E9DFD2] bg-white/95 px-4 py-3 text-[#B2A396] shadow-sm">
          <Search size={17} />
          <span className="text-[16px]">장소, 카테고리, 키워드 검색</span>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`shrink-0 rounded-full border px-4 py-2 text-[15px] font-medium ${
                category.active ? 'border-[#3E2A1E] bg-[#3E2A1E] text-white' : 'border-[#E9DFD2] bg-white/95 text-[#6F5D4F]'
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="absolute bottom-32 right-4 z-10 rounded-full bg-white p-3 text-[#5A4536] shadow-lg" aria-label="현재 위치로 이동">
        <Crosshair size={20} />
      </button>

      <section className={`absolute bottom-0 left-0 z-20 w-full rounded-t-3xl bg-white p-4 pb-24 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out ${sheetHeightClass}`}>
        <button type="button" onClick={onHandleToggle} className="mx-auto mb-3 block h-6 w-20" aria-label="시트 높이 전환">
          <span className="mx-auto block h-1.5 w-12 rounded-full bg-[#D8CEC2]" />
        </button>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#3E2A1E]">지도의 인기 공간</h2>
          <button type="button" className="flex items-center text-[14px] font-medium text-[#5E4A3C]">더보기 <ChevronRight size={16} /></button>
        </div>

        {sheetState !== SHEET.MIN && (
          <>
            {sheetState === SHEET.HALF && (
              <div className="scrollbar-hide flex overflow-x-auto gap-3 pb-2">
                {places.map((place) => {
                  const Icon = place.icon
                  const isActive = selectedPlace.id === place.id
                  return (
                    <button key={place.id} type="button" onClick={() => onPlaceCardClick(place.id)} className={`w-[112px] shrink-0 overflow-hidden rounded-[14px] border bg-white text-left ${isActive ? 'border-[#8C5A38] ring-1 ring-[#8C5A38]/30' : 'border-[#ECE3D8]'}`}>
                      <div className="relative h-[88px]">
                        <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                        <span className="absolute right-2 top-2 rounded-full bg-[#3E2A1E]/90 p-1 text-white"><Icon size={13} /></span>
                      </div>
                      <div className="px-2.5 pb-2.5 pt-2">
                        <p className="truncate text-[16px] font-semibold text-[#3A2A1F]">{place.name}</p>
                        <p className="mt-1 text-[13px] text-[#8A7767]">📍 {place.distance}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {sheetState === SHEET.FULL && (
              <div className="h-[calc(100%-90px)] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3 pb-3">
                  {places.map((place) => {
                    const Icon = place.icon
                    const isActive = selectedPlace.id === place.id
                    return (
                      <button key={place.id} type="button" onClick={() => onPlaceCardClick(place.id)} className={`overflow-hidden rounded-[14px] border bg-white text-left ${isActive ? 'border-[#8C5A38] ring-1 ring-[#8C5A38]/30' : 'border-[#ECE3D8]'}`}>
                        <div className="relative h-[110px]">
                          <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                          <span className="absolute right-2 top-2 rounded-full bg-[#3E2A1E]/90 p-1 text-white"><Icon size={13} /></span>
                        </div>
                        <div className="px-2.5 pb-2.5 pt-2">
                          <p className="truncate text-[15px] font-semibold text-[#3A2A1F]">{place.name}</p>
                          <p className="mt-1 text-[13px] text-[#8A7767]">📍 {place.distance}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {sheetState === SHEET.FULL_DETAIL && (
              <div className="h-[calc(100%-90px)] overflow-y-auto pr-1">
                <div className="space-y-3 pb-4">
                  {places.map((place) => {
                    const Icon = place.icon
                    const isActive = selectedPlace.id === place.id
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => onPlaceCardClick(place.id)}
                        className={`flex w-full items-center gap-3 overflow-hidden rounded-[14px] border bg-white p-2 text-left ${
                          isActive ? 'border-[#8C5A38] ring-1 ring-[#8C5A38]/30' : 'border-[#ECE3D8]'
                        }`}
                      >
                        <div className="relative h-[90px] w-[110px] shrink-0 overflow-hidden rounded-[10px]">
                          <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                          <span className="absolute right-2 top-2 rounded-full bg-[#3E2A1E]/90 p-1 text-white">
                            <Icon size={13} />
                          </span>
                        </div>
                        <div>
                          <p className="text-[16px] font-semibold text-[#3A2A1F]">{place.name}</p>
                          <p className="mt-1 text-[13px] text-[#8A7767]">📍 {place.distance}</p>
                          <p className="mt-1 text-[12px] text-[#9A8A7E]">{place.category}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {sheetState === SHEET.HALF && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] bg-[#F5EEE5] px-3 py-3">
                <div>
                  <p className="text-[18px] font-semibold text-[#3E2A1E]">아직 남긴 장소가 없어요</p>
                  <p className="text-[14px] text-[#7D6D61]">좋아하는 장소를 남겨보세요.</p>
                </div>
                <button type="button" className="inline-flex shrink-0 items-center rounded-full bg-[#3E2A1E] px-4 py-2.5 text-[15px] font-medium text-white">+ 장소 남기기</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default MapPage
