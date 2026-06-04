import { motion } from 'framer-motion'
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
  Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockPlace = {
  name: '메가커피 성수점',
  address: '서울 성동구 연무장7길 13',
  category: '카페',
  savedCount: 85,
  stats: { traces: 124, todayVisit: 37, likes: '2.4k' },
  intro: '창가 좌석이 많고 햇살이 잘 들어오는 공간이에요.\n조용해서 공부하거나 책 읽기에도 좋아요.',
  tags: [
    { label: '#카페', emoji: '☕', bg: '#F2EBE0', text: '#5C4230', border: '#E4D5C4' },
    { label: '#조용해요', emoji: '🌿', bg: '#E5EFE2', text: '#3D5C38', border: '#C8DEC4' },
    { label: '#공부하기 좋아요', emoji: '📖', bg: '#DDE8F5', text: '#2B4D73', border: '#BACEEA' },
    { label: '#감성적', emoji: '✨', bg: '#FAF0D5', text: '#7A5A1A', border: '#EDD9A0' },
    { label: '#창가자리', emoji: '🌤', bg: '#FDF3DC', text: '#7A5A1A', border: '#EDD9A0' },
  ],
  images: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  ],
  totalImages: 8,
}

const mockTraces = [
  {
    id: 1,
    type: 'photo',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
    text: '아침 햇살 맞집 🌤',
    user: 'daily_sun',
    time: '2시간 전',
    likes: 23,
  },
  {
    id: 2,
    type: 'photo',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=400&q=80',
    text: '창가 자리 최고 ♡',
    user: 'window_lover',
    time: '5시간 전',
    likes: 17,
  },
  {
    id: 3,
    type: 'note',
    noteBg: '#F5EDD5',
    text: '테라스 너무 예뻐요\n또 올게요! :)',
    date: '2024.06.09',
    user: 'mood_yeon',
    time: '6시간 전',
    likes: 12,
  },
  {
    id: 4,
    type: 'photo',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
    text: '역시 메가커피 👍',
    user: 'happy_day',
    time: '1일 전',
    likes: 15,
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function HeroImage({ src, totalImages }) {
  return (
    <div className="relative h-[260px] w-full overflow-hidden">
      <img src={src} alt="장소 이미지" className="h-full w-full object-cover" />
      {/* 이미지 카운터 배지 — 이미지 우측 하단, 겹침 영역 위 */}
      <div className="absolute bottom-8 right-3 rounded-full bg-black/45 px-2.5 py-[3px] text-[12px] font-medium text-white backdrop-blur-sm">
        1/{totalImages}
      </div>
    </div>
  )
}

function PlaceInfo({ place }) {
  return (
    <div className="px-5 pb-1 pt-5">
      {/* 제목 + 별 아이콘 */}
      <div className="flex items-center gap-2">
        <h1 className="text-[26px] font-bold leading-tight text-[#3B2A1E]">{place.name}</h1>
        <Star size={20} className="shrink-0 fill-[#F5C842] text-[#F5C842]" />
      </div>

      {/* 주소 + 카테고리 + 저장 버튼 */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-[#8B7A6B]">
          <MapPin size={13} className="shrink-0 text-[#B0957C]" />
          <span className="truncate">{place.address}</span>
          <span className="shrink-0 text-[#D0C4B6]">·</span>
          <span className="shrink-0">{place.category}</span>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E0D4C5] bg-[#F5F0EA] px-3 py-1.5 text-[13px] font-medium text-[#5C4A3B]"
        >
          <Bookmark size={13} strokeWidth={1.8} />
          저장 {place.savedCount}
        </button>
      </div>
    </div>
  )
}

function StatsCard({ stats }) {
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-[#EBE1D6] bg-white px-3 py-3.5 shadow-[0_2px_8px_rgba(60,42,30,0.07)]">
      <div className="grid grid-cols-3">
        {/* 흔적 */}
        <div className="flex flex-col items-center gap-0.5 border-r border-[#EBE1D6]">
          <div className="flex items-center gap-1 text-[12px] text-[#8B7A6B]">
            <ClipboardList size={13} strokeWidth={1.5} className="text-[#B0957C]" />
            흔적
          </div>
          <span className="text-[20px] font-bold leading-tight text-[#3B2A1E]">{stats.traces}개</span>
        </div>
        {/* 오늘 방문 */}
        <div className="flex flex-col items-center gap-0.5 border-r border-[#EBE1D6]">
          <div className="flex items-center gap-1 text-[12px] text-[#8B7A6B]">
            <Users size={13} strokeWidth={1.5} className="text-[#B0957C]" />
            오늘 방문
          </div>
          <span className="text-[20px] font-bold leading-tight text-[#3B2A1E]">{stats.todayVisit}명</span>
        </div>
        {/* 좋아요 */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-[12px] text-[#8B7A6B]">
            <Heart size={13} strokeWidth={1.5} className="text-[#B0957C]" />
            좋아요
          </div>
          <span className="text-[20px] font-bold leading-tight text-[#3B2A1E]">{stats.likes}</span>
        </div>
      </div>
    </div>
  )
}

function IntroBox({ intro }) {
  return (
    <div className="relative mx-5 mt-4 overflow-hidden rounded-2xl border border-[#EBE1D6] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(60,42,30,0.05)]">
      <p className="whitespace-pre-line text-[14px] leading-[1.85] text-[#4A3728]">{intro}</p>
      {/* 꽃 장식 */}
      <div className="pointer-events-none absolute bottom-3 right-3 select-none text-[28px] opacity-20">
        ✿
      </div>
    </div>
  )
}

function MoodTags({ tags }) {
  return (
    <div className="mt-5 px-5">
      <h2 className="mb-3 text-[16px] font-bold text-[#3B2A1E]">분위기 태그</h2>
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
        <h2 className="text-[16px] font-bold text-[#3B2A1E]">최근 흔적</h2>
        <button
          type="button"
          onClick={onMore}
          className="flex items-center gap-0.5 text-[13px] font-medium text-[#6B5A4C]"
        >
          더보기
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
      {/* 가로 스크롤 */}
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
        <span className="text-[17px]">📌</span>
        <span>흔적 보드 보기</span>
      </button>
    </div>
  )
}

const NAV_ITEMS = [
  { key: 'home', label: '홈', icon: Home, path: '/home' },
  { key: 'space', label: '공간', icon: MapPin, path: '/map' },
  { key: 'trace', label: '내 흔적', icon: Bookmark, path: null },
  { key: 'my', label: '마이페이지', icon: User, path: null },
]

function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="border-t border-[#E8DDD1] bg-[#FBF6EE] px-2 pb-7 pt-2.5">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          // place 상세 화면이므로 "공간" 탭 항상 활성화
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

// ─── Main ─────────────────────────────────────────────────────────────────────

function PlaceDetailScreen() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <motion.div
      className="app-device flex flex-col overflow-hidden bg-[#FBF6EE]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Status bar 영역 (뒤로/공유/더보기) ── */}
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

      {/* ── 스크롤 본문 ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Hero 이미지 */}
        <HeroImage src={mockPlace.images[0]} totalImages={mockPlace.totalImages} />

        {/* 정보 카드 — Hero에 살짝 겹치게 (목표 이미지 기준 ~24px) */}
        <div className="-mt-6 rounded-t-[28px] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.10)]">
          <PlaceInfo place={mockPlace} />
          <StatsCard stats={mockPlace.stats} />
          <IntroBox intro={mockPlace.intro} />
          <MoodTags tags={mockPlace.tags} />
          <RecentTraceList
            traces={mockTraces}
            onMore={() => navigate(`/board/${id ?? 'onion'}`)}
          />
          {/* 하단 여유 공간 — CTA(56px) + 패딩(12px) + 네비(72px) = 140px */}
          <div className="h-36" />
        </div>
      </div>

      {/* ── 하단 고정 영역 ── */}
      <div className="shrink-0 bg-[#FBF6EE] shadow-[0_-6px_20px_rgba(58,36,24,0.08)]">
        <BottomCTA onClick={() => navigate(`/board/${id ?? 'onion'}`)} />
        <BottomNav />
      </div>
    </motion.div>
  )
}

export default PlaceDetailScreen
