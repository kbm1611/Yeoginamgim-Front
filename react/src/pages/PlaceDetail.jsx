import { motion } from 'framer-motion'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Share2,
  Soup,
  Store,
  UserRound,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

const placeData = {
  onion: {
    name: '어니언 성수',
    distance: '450m',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    category: '카페',
    address: '서울 성동구 아차산로9길 8',
    hours: '매일 10:00 - 22:00',
    tag: '#성수동',
    intro: '붉은 벽돌 창고를 개조한 감성 카페.\n커피와 디저트가 모두 맛있기로 유명한 곳.',
  },
  yeonbang: {
    name: '성수연방',
    distance: '650m',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    category: '문화',
    address: '서울 성동구 성수이로14길 14',
    hours: '매일 11:00 - 21:00',
    tag: '#성수동',
    intro: '감각적인 셀렉트숍과 카페가 모인 복합 문화 공간.',
  },
  mildo: {
    name: '밀도 성수',
    distance: '800m',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    category: '베이커리',
    address: '서울 성동구 연무장길 33',
    hours: '매일 09:00 - 21:00',
    tag: '#성수동',
    intro: '고소한 빵 향과 따뜻한 분위기가 매력적인 베이커리.',
  },
  daelim: {
    name: '대림창고',
    distance: '1.2km',
    image: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=1200&q=80',
    category: '편집샵',
    address: '서울 성동구 성수이로78',
    hours: '매일 11:00 - 22:00',
    tag: '#성수동',
    intro: '전시, 음악, 카페 감성을 동시에 즐길 수 있는 명소.',
  },
  forest: {
    name: '서울숲',
    distance: '1.2km',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=80',
    category: '공원',
    address: '서울 성동구 뚝섬로 273',
    hours: '매일 24시간',
    tag: '#서울숲',
    intro: '산책과 피크닉을 즐기기 좋은 도심 속 휴식 공간.',
  },
}

const traceCards = [
  { id: 1, type: 'note', color: 'bg-[#F5EBB8]', text: '창가 자리에 앉으면\n시간이 천천히\n흘러가는 기분 ☀️', date: '24.05.12' },
  { id: 2, type: 'photo', image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=500&q=80', text: '비 오는 날\n여기만 생각나요 ☔', date: '24.05.11' },
  { id: 3, type: 'note', color: 'bg-[#F7DBDB]', text: '라떼랑 스콘\n조합 최고!\n또 올게요 : )', date: '24.05.10' },
  { id: 4, type: 'photo', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80', text: '햇살 가득한 오후\n너무 좋았던 곳.', date: '' },
  { id: 5, type: 'photo', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80', text: '혼자 책 읽기\n좋은 공간 📖', date: '' },
  { id: 6, type: 'note', color: 'bg-[#DDEAF4]', text: '분위기가 정말\n차분하고 편안해요.\n마음이 정리되는 느낌 ☁️', date: '24.05.09' },
  { id: 7, type: 'photo', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80', text: '오늘의 행복 ☕', date: '' },
  { id: 8, type: 'note', color: 'bg-[#F6E9B7]', text: '친구랑 오래\n수다 떨기 좋은 곳!\n시간 가는 줄 몰랐어요 ☆', date: '24.05.08' },
]

function TraceCard({ card }) {
  if (card.type === 'photo') {
    return (
      <article className="relative rounded-[4px] bg-white p-2 shadow-[0_6px_16px_rgba(50,33,20,0.14)]">
        <span className="absolute left-1/2 top-0 h-2 w-14 -translate-x-1/2 -translate-y-1 rotate-6 bg-[#EFE2D4]/85" />
        <img src={card.image} alt="" className="h-[122px] w-full object-cover" />
        <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-[#3E2A1E]">{card.text}</p>
        <div className="mt-1 flex items-center justify-end text-[#B0927A]">
          <Heart size={15} />
        </div>
      </article>
    )
  }

  return (
    <article className={`relative min-h-[190px] rounded-[2px] p-4 shadow-[0_8px_18px_rgba(50,33,20,0.12)] ${card.color}`}>
      <span className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1 rounded-full bg-gradient-to-b from-[#D8B98E] to-[#A8784A] shadow" />
      <p className="whitespace-pre-line text-[15px] leading-8 text-[#3E2A1E]">{card.text}</p>
      <p className="mt-3 text-right text-[13px] text-[#6E5A4C]">- {card.date}</p>
    </article>
  )
}

function PlaceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const place = placeData[id] ?? placeData.onion

  return (
    <motion.main
      className="app-device h-full w-full overflow-hidden bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative h-full overflow-y-auto bg-[#FBF9F6] pb-44">
        <section className="relative">
          <img src={place.image} alt={place.name} className="h-[300px] w-full object-cover" />

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#3E2A1E] shadow"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="absolute right-4 top-6 flex gap-2">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#3E2A1E] shadow" aria-label="북마크">
              <Bookmark size={20} />
            </button>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#3E2A1E] shadow" aria-label="공유">
              <Share2 size={20} />
            </button>
          </div>

          <span className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-[16px] text-white">1 / 8</span>
        </section>

        <section className="-mt-5 rounded-t-[26px] bg-white px-5 pb-6 pt-4">
          <span className="inline-block rounded-full bg-[#EFE7DB] px-3 py-1 text-[12px] text-[#6F5D4F]">{place.category}</span>
          <h1 className="mt-3 font-brand-serif text-[52px] leading-tight text-[#2F2118]">{place.name}</h1>

          <div className="mt-3 space-y-2 text-[#5A4739]">
            <div className="flex items-center gap-3 text-[18px]">
              <MapPin size={16} className="text-[#B0957C]" />
              <span>{place.address}</span>
              <span className="text-[#D8CCBF]">|</span>
              <span className="inline-flex items-center gap-1"><UserRound size={14} className="text-[#B0957C]" />여기서 {place.distance}</span>
            </div>
            <div className="flex items-center gap-3 text-[18px]">
              <Clock3 size={16} className="text-[#B0957C]" />
              <span>{place.hours}</span>
              <span className="text-[#D8CCBF]">|</span>
              <span className="rounded-full bg-[#F1E9DF] px-3 py-1 text-[17px] text-[#6A5748]">{place.tag}</span>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-[18px] leading-8 text-[#4A392C]">{place.intro}</p>

          <hr className="my-6 border-[#EFE8DE]" />

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[37px] font-bold text-[#3A2A1F]">최근 남겨진 흔적</h2>
            <button type="button" className="inline-flex items-center text-[18px] font-medium text-[#5E4A3C]">더보기 <ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {traceCards.map((card) => (
              <div key={card.id} className={card.id === 4 || card.id === 8 ? 'mt-4' : card.id === 5 ? 'mt-2' : ''}>
                <TraceCard card={card} />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-[#F6F1EA] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9D7C2] text-[#6A4B33]">
                <Store size={24} />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-[#3A2A1F]">아직 남긴 흔적이 없나요?</p>
                <p className="text-[15px] text-[#6F5D4F]">이 장소의 첫 번째 흔적을 남겨보세요.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="absolute inset-x-0 bottom-0 bg-white px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(35,24,16,0.08)]">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="h-16 rounded-2xl border border-[#EADFD1] bg-[#F4EEE5] text-[17px] font-semibold text-[#3E2A1E]">
            📝 흔적 남기기
          </button>
          <button
            type="button"
            onClick={() => navigate(`/board/${id ?? 'onion'}`)}
            className="h-16 rounded-2xl bg-[#3E2A1E] text-[17px] font-semibold text-white"
          >
            📖 보드 구경하기
          </button>
        </div>
      </footer>
    </motion.main>
  )
}

export default PlaceDetail
