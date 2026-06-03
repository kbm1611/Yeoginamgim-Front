import { useEffect, useRef, useState } from 'react'
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Coffee,
  LocateFixed,
  MapPin,
  Navigation,
  SlidersHorizontal,
  Sprout,
  Store,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import mainLogo from '../assets/logo/image_12-removebg-preview.png'

const categories = ['전체', '카페', '맛집', '편집샵', '공원', '문화']

const mapPins = [
  { id: 'a', placeId: 'yeonbang', name: '성수연방', distance: '250m', top: '29%', left: '25%', icon: Briefcase },
  { id: 'b', placeId: 'mildo', name: '밀도 성수', distance: '300m', top: '45%', left: '50%', icon: Coffee },
  { id: 'c', placeId: 'daelim', name: '대림창고', distance: '300m', top: '38%', left: '72%', icon: Store },
  { id: 'd', placeId: 'forest', name: '서울숲', distance: '400m', top: '63%', left: '55%', icon: Sprout },
]

const nearbyPlaces = [
  {
    id: '1',
    name: '어니언 성수',
    category: '카페',
    summary: '커피와 디저트가 정말 완벽한 조합',
    distance: '120m',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: '2',
    name: '성수연방',
    category: '카페',
    summary: '비 오는 날 생각나는 공간',
    distance: '250m',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: '3',
    name: '밀도 성수',
    category: '베이커리',
    summary: '빵 냄새가 따뜻해서 자주 오게 돼요',
    distance: '300m',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: '4',
    name: '대림창고',
    category: '편집샵',
    summary: '구경하다 보면 시간 가는 줄 몰라요',
    distance: '300m',
    image: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: '5',
    name: '서울숲',
    category: '공원',
    summary: '따뜻한 햇살 아래 책 읽기 좋은 곳',
    distance: '400m',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=700&q=80',
  },
]

function MapPage() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const dragStateRef = useRef({ dragging: false, startY: 0, startHeight: 0 })
  const heightRef = useRef(280)
  const [isSheetOpen, setIsSheetOpen] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(280)
  const [isDragging, setIsDragging] = useState(false)
  const DISMISS_THRESHOLD = 150

  const getHeightBounds = () => {
    const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
    return {
      minHeight: 70,
      maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
    }
  }

  const clampHeight = (value, allowBelowMin = false) => {
    const { minHeight, maxHeight } = getHeightBounds()
    const minBoundary = allowBelowMin ? 0 : minHeight
    return Math.max(minBoundary, Math.min(maxHeight, value))
  }

  useEffect(() => {
    const getHeightBoundsForEffect = () => {
      const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
      return {
        minHeight: 70,
        maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
      }
    }

    const clampHeightForEffect = (value, allowBelowMin = false) => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      const minBoundary = allowBelowMin ? 0 : minHeight
      return Math.max(minBoundary, Math.min(maxHeight, value))
    }

    const setInitialHeight = () => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      setSheetHeight((prev) => {
        if (prev !== 280) return clampHeightForEffect(prev)
        const preferred = Math.floor((minHeight + maxHeight) * 0.52)
        return clampHeightForEffect(preferred)
      })
    }

    setInitialHeight()
    window.addEventListener('resize', setInitialHeight)
    return () => window.removeEventListener('resize', setInitialHeight)
  }, [])

  useEffect(() => {
    heightRef.current = sheetHeight
  }, [sheetHeight])

  useEffect(() => {
    const getHeightBoundsForEffect = () => {
      const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
      return {
        minHeight: 70,
        maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
      }
    }

    const clampHeightForEffect = (value, allowBelowMin = false) => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      const minBoundary = allowBelowMin ? 0 : minHeight
      return Math.max(minBoundary, Math.min(maxHeight, value))
    }

    const onMouseMove = (event) => {
      if (!dragStateRef.current.dragging) return
      const deltaY = dragStateRef.current.startY - event.clientY
      setSheetHeight(clampHeightForEffect(dragStateRef.current.startHeight + deltaY, true))
    }

    const onTouchMove = (event) => {
      if (!dragStateRef.current.dragging) return
      const point = event.touches[0]
      if (!point) return
      const deltaY = dragStateRef.current.startY - point.clientY
      setSheetHeight(clampHeightForEffect(dragStateRef.current.startHeight + deltaY, true))
    }

    const endDrag = () => {
      if (dragStateRef.current.dragging) {
        if (heightRef.current <= DISMISS_THRESHOLD) {
          setIsSheetOpen(false)
        } else {
          setSheetHeight(clampHeightForEffect(heightRef.current, false))
        }
      }
      dragStateRef.current.dragging = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', endDrag)
    window.addEventListener('touchcancel', endDrag)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', endDrag)
      window.removeEventListener('touchcancel', endDrag)
    }
  }, [])

  const openSheet = () => {
    const { minHeight, maxHeight } = getHeightBounds()
    const defaultHeight = Math.floor((minHeight + maxHeight) * 0.4)
    setIsSheetOpen(true)
    setSheetHeight(clampHeight(defaultHeight))
  }

  const startDrag = (clientY) => {
    if (!isSheetOpen) {
      openSheet()
      return
    }
    dragStateRef.current = {
      dragging: true,
      startY: clientY,
      startHeight: sheetHeight,
    }
    setIsDragging(true)
  }

  const onHandleMouseDown = (event) => {
    event.preventDefault()
    startDrag(event.clientY)
  }

  const onHandleTouchStart = (event) => {
    const point = event.touches[0]
    if (!point) return
    startDrag(point.clientY)
  }

  return (
    <main
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#F7F2EA]"
      style={{ fontFamily: "'Noto Serif KR', serif", color: '#2B1810' }}
    >
      <div className="absolute inset-0 z-0 bg-[#F1ECE4]">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(222,212,199,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(222,212,199,0.6)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute left-[8%] top-[60%] h-[26%] w-[42%] rounded-[48%] bg-[#d7e2ce]/65" />
        <div className="absolute left-[0%] top-[74%] h-[22%] w-[100%] bg-[#b8d0e8]/70" />
      </div>

      <section className="absolute left-0 top-0 z-10 w-full px-5 pb-2 pt-3">
        <div className="mx-auto mb-3 flex w-[95px] items-center justify-center">
          <img src={mainLogo} alt="여기남김" className="w-[95px] object-contain" />
        </div>

        <div className="flex items-center rounded-[20px] border border-[#EDE4D8] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
          <button type="button" className="flex flex-1 items-center gap-2 text-[14px] font-medium">
            <MapPin size={15} strokeWidth={1.7} />
            <span>성수동</span>
            <ChevronDown size={14} strokeWidth={1.8} />
          </button>
          <div className="mx-2 h-5 w-px bg-[#EFE7DB]" />
          <button type="button" className="flex items-center gap-1.5 text-[14px] font-medium">
            <SlidersHorizontal size={14} strokeWidth={1.8} />
            <span>필터</span>
          </button>
        </div>

        <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] ${
                idx === 0 ? 'bg-[#3D2415] text-white' : 'bg-[#EEE6DA] text-[#5A4030]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="absolute inset-0 z-[5]">
        {mapPins.map((pin) => {
          const Icon = pin.icon
          return (
            <div
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pin.top, left: pin.left }}
            >
              <button
                type="button"
                onClick={() => navigate(`/place/${pin.placeId}`)}
                className="mx-auto mb-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#3D2415] text-white shadow-[0_6px_12px_rgba(0,0,0,0.16)]"
                aria-label={`${pin.name} 보기`}
              >
                <Icon size={18} strokeWidth={1.9} />
              </button>
              <div className="min-w-[106px] rounded-[12px] border border-[#EADFD2] bg-white px-2.5 py-2 shadow-[0_6px_12px_rgba(0,0,0,0.08)]">
                <p className="text-[14px] font-bold leading-tight text-[#2B1810]">{pin.name}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-normal text-[#6E594A]">
                  <MapPin size={11} strokeWidth={1.6} />
                  <span>{pin.distance}</span>
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <div className="absolute right-4 top-[48%] z-10 flex flex-col gap-3">
        <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4D3729] shadow-[0_6px_14px_rgba(0,0,0,0.12)]">
          <LocateFixed size={20} strokeWidth={1.8} />
        </button>
        <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4D3729] shadow-[0_6px_14px_rgba(0,0,0,0.12)]">
          <Navigation size={20} strokeWidth={1.8} />
        </button>
      </div>

      <section
        className="absolute bottom-[90px] left-2 right-2 z-20 rounded-t-[24px] bg-white px-5 pb-4 pt-1 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]"
        style={{
          height: `${sheetHeight}px`,
          transform: isSheetOpen ? 'translateY(0)' : 'translateY(130%)',
          transition: isDragging ? 'none' : 'transform 240ms ease, height 200ms ease',
        }}
      >
        <button
          type="button"
          className="mb-1 flex h-9 w-full items-center justify-center bg-transparent"
          onMouseDown={onHandleMouseDown}
          onTouchStart={onHandleTouchStart}
          aria-label="주변 인기 공간 시트 높이 조절"
          style={{ touchAction: 'none' }}
        >
          <span className="h-1 w-16 rounded-full bg-[#DDD3C6]" />
        </button>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#2B1810]">주변 인기 공간</h2>
          <button type="button" className="flex items-center text-[12px] font-medium text-[#5A4030]">
            더보기 <ChevronRight size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div className="scrollbar-hide flex h-[calc(100%-70px)] gap-3 overflow-x-auto overflow-y-auto pb-1">
          {nearbyPlaces.map((place) => (
            <article key={place.id} className="w-[145px] shrink-0 overflow-hidden rounded-[16px] border border-[#EFE6DB] bg-white">
              <img src={place.image} alt={place.name} className="aspect-square w-full object-cover" />
              <div className="px-2.5 pb-2.5 pt-2">
                <span className="inline-block rounded-full bg-[#F2EBDF] px-2 py-0.5 text-[10px] font-medium text-[#6B5343]">{place.category}</span>
                <p className="mt-1 text-[15px] font-bold text-[#2B1810]">{place.name}</p>
                <p className="mt-0.5 text-[12px] font-normal leading-[1.35] text-[#5F4A3B]">{place.summary}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-normal text-[#5F4A3B]">
                  <MapPin size={11} strokeWidth={1.6} />
                  <span>{place.distance}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default MapPage
