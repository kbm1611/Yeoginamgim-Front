import { ChevronRight, UserRound } from 'lucide-react'

const topPlaces = [
  {
    rank: 1,
    name: '카페 연남방앗간',
    category: '카페',
    quote: '혼자 있고 싶을 때 자주 와요.',
    traces: 128,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 2,
    name: '성수연방',
    category: '카페',
    quote: '비 오는 날이면 마음이 차분해져요.',
    traces: 96,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 3,
    name: '밀도 성수',
    category: '베이커리',
    quote: '빵 냄새가 따뜻해서 자주 오게 돼요.',
    traces: 68,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 4,
    name: '대림창고',
    category: '편집샵',
    quote: '구경하다 보면 시간 가는 줄 몰라요.',
    traces: 64,
    image: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 5,
    name: '서울숲 피크닉장',
    category: '공원',
    quote: '따뜻한 햇살 아래에서 쉬기 좋아요.',
    traces: 52,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80',
  },
]

function TopPlacesSection() {
  return (
    <section className="pt-4">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[30px] font-bold tracking-[-0.015em] text-[#2B1810]">성수동 인기 공간 TOP 5</h2>
        <button type="button" className="flex items-center text-[13px] font-medium text-[#7D6E62]">
          더보기<ChevronRight size={15} />
        </button>
      </div>
      <p className="mb-3 px-5 text-[14px] font-normal text-[#8E8177]">사람들이 오래 기억한 공간들이에요.</p>

      <div className="scrollbar-hide flex gap-2.5 overflow-x-scroll px-5 pb-3">
        {topPlaces.map((place) => (
          <article
            key={place.rank}
            className="w-[122px] shrink-0 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.08)]"
          >
            <div className="relative aspect-square overflow-hidden">
              <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#3E2A1E] text-[10px] font-bold text-white">
                {place.rank}
              </span>
            </div>

            <div className="bg-white px-2.5 pb-2.5 pt-2">
              <h3 className="truncate text-[13px] font-medium leading-tight text-[#2F2118]">{place.name}</h3>
              <span className="mt-1 inline-block rounded-[8px] bg-[#F3EEE7] px-1.5 py-0.5 text-[10px] text-[#7E6E62]">
                {place.category}
              </span>
              <p className="mt-1.5 line-clamp-2 text-[11px] font-normal leading-[1.35] text-[#66564A]">"{place.quote}"</p>
              <p className="mt-1.5 flex items-center gap-0.5 text-[11px] font-normal text-[#8A7A6D]">
                <UserRound size={11} strokeWidth={1.7} />
                <span>{place.traces}개의 흔적</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TopPlacesSection

