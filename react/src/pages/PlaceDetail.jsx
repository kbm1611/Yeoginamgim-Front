import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  MapPin,
  MoreHorizontal,
  Share,
  Star,
  User,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchBoardDetailForRouteId } from '../api/boards'
import {
  getPlaceDetailRows,
  getTraceCountText,
  mergeBoardDetailIntoPlace,
  resolveBoardNavigationId,
} from './PlaceDetail.utils'

// ??? Mock Data ????????????????????????????????????????????????????????????????

const mockPlace = {
  name: '성수의 작은 카페',
  address: '서울 성동구 연무장길 13',
  category: '카페',
  kakaoPlaceId: '',
  latitude: null,
  longitude: null,
  phone: '',
  savedCount: 85,
  stats: { traces: 0, todayVisit: 37, likes: '2.4k' },
  intro: '창가 자리가 좋고 조용히 머물기 좋은 공간입니다.\n이곳에 남겨진 흔적을 천천히 둘러보세요.',
  tags: [
    { label: '#카페', emoji: '커피', bg: '#F2EBE0', text: '#5C4230', border: '#E4D5C4' },
    { label: '#조용해요', emoji: '쉼', bg: '#E5EFE2', text: '#3D5C38', border: '#C8DEC4' },
    { label: '#머물기좋은', emoji: '공간', bg: '#DDE8F5', text: '#2B4D73', border: '#BACEEA' },
  ],
  images: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  ],
  totalImages: 1,
}

const mockTraces = [
  {
    id: 1,
    type: 'photo',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
    text: '따뜻한 커피가 좋았던 아침',
    user: 'daily_sun',
    time: '2시간 전',
    likes: 23,
  },
  {
    id: 2,
    type: 'note',
    noteBg: '#F5EDD5',
    text: '조용히 쉬어가기 좋은 자리',
    date: '2024.06.09',
    user: 'mood_yeon',
    time: '6시간 전',
    likes: 12,
  },
]

// ??? Components ???????????????????????????????????????????????????????????????

function HeroImage({ src, totalImages }) {
  return (
    <div className="relative h-[260px] w-full overflow-hidden">
      <img src={src} alt="?μ냼 ?대?吏" className="h-full w-full object-cover" />
      {/* ?대?吏 移댁슫??諛곗? ???대?吏 ?곗륫 ?섎떒, 寃뱀묠 ?곸뿭 ??*/}
      <div className="absolute bottom-8 right-3 rounded-full bg-black/45 px-2.5 py-[3px] text-[12px] font-medium text-white backdrop-blur-sm">
        1/{totalImages}
      </div>
    </div>
  )
}

function PlaceInfoCard({ place, traceStatus }) {
  const detailRows = getPlaceDetailRows(place)
  const traceCountText = getTraceCountText(place.stats?.traces, traceStatus)

  return (
    <section className="mx-5 mt-5 rounded-[16px] border border-[#EBE1D6] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(60,42,30,0.07)]">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="min-w-0 truncate text-[24px] font-bold leading-tight text-[#3B2A1E]">{place.name}</h1>
            <Star size={18} className="shrink-0 fill-[#F5C842] text-[#F5C842]" />
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#7A5A2E]">
            <ClipboardList size={11} strokeWidth={1.8} />
            흔적 {traceCountText}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-[#8B7A6B]">
          <MapPin size={13} className="shrink-0 text-[#B0957C]" />
          <span className="min-w-0 truncate">{place.address || '주소 정보 없음'}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F5F0EA] px-2.5 py-1 text-[12px] font-medium text-[#6B5344]">
            {place.category || '카테고리 없음'}
          </span>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-full border border-[#E0D4C5] bg-[#F5F0EA] px-2.5 py-1 text-[12px] font-medium text-[#5C4A3B]"
          >
            <Bookmark size={12} strokeWidth={1.8} />
            저장 {place.savedCount ?? 0}
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-[#F0E7DC] pt-3">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-[12px]">
            <dt className="shrink-0 font-medium text-[#9A8573]">{row.label}</dt>
            <dd className="min-w-0 break-words text-right font-semibold text-[#4A3728]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {traceStatus === 'error' ? (
        <p className="mt-3 rounded-[8px] bg-[#FFF7F2] px-3 py-2 text-[12px] font-medium text-[#A85C3B]">
          흔적 수를 불러오지 못해 장소 정보만 표시하고 있습니다.
        </p>
      ) : null}
    </section>
  )
}

function IntroBox({ intro }) {
  return (
    <div className="relative mx-5 mt-4 overflow-hidden rounded-2xl border border-[#EBE1D6] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(60,42,30,0.05)]">
      <p className="whitespace-pre-line text-[14px] leading-[1.85] text-[#4A3728]">{intro}</p>
      {/* 苑??μ떇 */}
      <div className="pointer-events-none absolute bottom-3 right-3 select-none text-[28px] opacity-20">
        ??
      </div>
    </div>
  )
}

function MoodTags({ tags }) {
  return (
    <div className="mt-5 px-5">
      <h2 className="mb-3 text-[16px] font-bold text-[#3B2A1E]">遺꾩쐞湲??쒓렇</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
            style={{
              backgroundColor: tag.bg,
              color: tag.text,
              border: `1px solid ${tag.border}`,
            }}
          >
            <span className="text-[14px]">{tag.emoji}</span>
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function RecentTraceCard({ trace }) {
  if (trace.type === 'photo') {
    return (
      <article className="w-[148px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(60,42,30,0.10)]">
        <img src={trace.image} alt="" className="h-[120px] w-full object-cover" />
        <div className="px-2.5 py-2">
          <p className="truncate text-[12px] font-medium text-[#3B2A1E]">{trace.text}</p>
          <p className="mt-0.5 text-[11px] text-[#8B7A6B]">{trace.user}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8B7A6B]">
            <span>{trace.time}</span>
            <span className="flex items-center gap-0.5">
              <Heart size={10} strokeWidth={1.5} />
              {trace.likes}
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="w-[148px] shrink-0 overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(60,42,30,0.10)]"
      style={{ backgroundColor: trace.noteBg }}
    >
      <div className="min-h-[120px] px-3 pb-2 pt-3">
        {trace.date && (
          <p className="mb-2 text-[11px] text-[#8B7A6B]">{trace.date}</p>
        )}
        <p
          className="whitespace-pre-line text-[14px] leading-[1.7] text-[#3B2A1E]"
          style={{ fontFamily: "'Nanum Pen Script', cursive" }}
        >
          {trace.text}
        </p>
      </div>
      <div className="px-3 pb-2">
        <p className="text-[11px] text-[#8B7A6B]">{trace.user}</p>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#8B7A6B]">
          <span>{trace.time}</span>
          <span className="flex items-center gap-0.5">
            <Heart size={10} strokeWidth={1.5} />
            {trace.likes}
          </span>
        </div>
      </div>
    </article>
  )
}

function RecentTraceList({ traces, onMore }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-[16px] font-bold text-[#3B2A1E]">理쒓렐 ?붿쟻</h2>
        <button
          type="button"
          onClick={onMore}
          className="flex items-center gap-0.5 text-[13px] font-medium text-[#6B5A4C]"
        >
          ?붾낫湲?
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
      {/* 媛濡??ㅽ겕濡?*/}
      <div
        className="flex gap-3 overflow-x-auto px-5 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {traces.map((trace) => (
          <RecentTraceCard key={trace.id} trace={trace} />
        ))}
      </div>
    </div>
  )
}

function BottomCTA({ onClick }) {
  return (
    <div className="px-5 pb-1 pt-3">
      <button
        type="button"
        onClick={onClick}
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#3A2418] text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(58,36,24,0.35)] active:opacity-80"
      >
        <span className="text-[17px]">?뱦</span>
        <span>?붿쟻 蹂대뱶 蹂닿린</span>
      </button>
    </div>
  )
}

const NAV_ITEMS = [
  { key: 'home', label: '홈', icon: Home, path: '/home' },
  { key: 'space', label: '공간', icon: MapPin, path: '/map' },
  { key: 'trace', label: '내 흔적', icon: Bookmark, path: null },
  { key: 'my', label: '마이', icon: User, path: null },
]

function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="border-t border-[#E8DDD1] bg-[#FBF6EE] px-2 pb-7 pt-2.5">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          // place ?곸꽭 ?붾㈃?대?濡?"怨듦컙" ????긽 ?쒖꽦??
          const active = item.key === 'space'
          return (
            <li key={item.key} className="flex justify-center">
              <button
                type="button"
                onClick={() => item.path && navigate(item.path)}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.5}
                  className={active ? 'text-[#3A2418]' : 'text-[#9B8A7B]'}
                />
                <span
                  className={`text-[11px] font-medium ${active ? 'text-[#3A2418]' : 'text-[#9B8A7B]'}`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ??? Main ?????????????????????????????????????????????????????????????????????

function PlaceDetailScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [boardDetail, setBoardDetail] = useState(null)
  const [boardDetailStatus, setBoardDetailStatus] = useState(id ? 'loading' : 'ready')
  const place = mergeBoardDetailIntoPlace(mockPlace, boardDetail)
  const boardNavigationId = resolveBoardNavigationId(id, boardDetail)

  useEffect(() => {
    if (!id) {
      return
    }

    let ignore = false

    async function loadBoardDetail() {
      try {
        const detail = await fetchBoardDetailForRouteId(id)
        if (!ignore) {
          setBoardDetail(detail)
          setBoardDetailStatus('ready')
        }
      } catch {
        if (!ignore) {
          setBoardDetail(null)
          setBoardDetailStatus('error')
        }
      }
    }

    loadBoardDetail()

    return () => {
      ignore = true
    }
  }, [id])

  return (
    <motion.div
      className="app-device flex flex-col overflow-hidden bg-[#FBF6EE]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ?? Status bar ?곸뿭 (?ㅻ줈/怨듭쑀/?붾낫湲? ?? */}
      <div className="flex items-center justify-between bg-[#FBF6EE] px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="flex h-9 w-9 items-center justify-center"
        >
          <ChevronLeft size={26} strokeWidth={1.8} className="text-[#3B2A1E]" />
        </button>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="공유" className="flex h-9 w-9 items-center justify-center">
            <Share size={20} strokeWidth={1.8} className="text-[#3B2A1E]" />
          </button>
          <button type="button" aria-label="더보기" className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal size={22} strokeWidth={1.8} className="text-[#3B2A1E]" />
          </button>
        </div>
      </div>

      {/* ?? ?ㅽ겕濡?蹂몃Ц ?? */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Hero ?대?吏 */}
        <HeroImage src={place.images[0]} totalImages={place.totalImages} />

        {/* ?뺣낫 移대뱶 ??Hero???댁쭩 寃뱀튂寃?(紐⑺몴 ?대?吏 湲곗? ~24px) */}
        <div className="-mt-6 rounded-t-[28px] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.10)]">
          <PlaceInfoCard place={place} traceStatus={boardDetailStatus} />
          <IntroBox intro={place.intro} />
          <MoodTags tags={place.tags} />
          <RecentTraceList
            traces={mockTraces}
            onMore={() => navigate(`/board/${boardNavigationId}`)}
          />
          {/* ?섎떒 ?ъ쑀 怨듦컙 ??CTA(56px) + ?⑤뵫(12px) + ?ㅻ퉬(72px) = 140px */}
          <div className="h-36" />
        </div>
      </div>

      {/* ?? ?섎떒 怨좎젙 ?곸뿭 ?? */}
      <div className="shrink-0 bg-[#FBF6EE] shadow-[0_-6px_20px_rgba(58,36,24,0.08)]">
        <BottomCTA onClick={() => navigate(`/board/${boardNavigationId}`)} />
        <BottomNav />
      </div>
    </motion.div>
  )
}

export default PlaceDetailScreen
