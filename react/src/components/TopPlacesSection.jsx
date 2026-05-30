import { ChevronRight } from 'lucide-react'

const topPlaces = [
  {
    rank: 1,
    name: '카페 연남방앗간',
    category: '카페',
    quote: '혼자 있고 싶을 때 자주 와요.',
    traces: 128,
    image:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 2,
    name: '성수연방',
    category: '카페',
    quote: '비 오는 날 생각나는 공간이에요.',
    traces: 96,
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 3,
    name: '밀도 성수',
    category: '베이커리',
    quote: '빵 냄새가 따뜻해서 자주 오게 돼요.',
    traces: 68,
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 4,
    name: '대림창고',
    category: '편집샵',
    quote: '구경하다 보면 시간 가는 줄 몰라요.',
    traces: 64,
    image:
      'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=900&q=80',
  },
  {
    rank: 5,
    name: '서울숲 피크닉장',
    category: '공원',
    quote: '따뜻한 햇살 아래에서 책 읽기 좋은 날.',
    traces: 52,
    image:
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80',
  },
]

function TopPlacesSection() {
  return (
    <section className="px-4 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-body-sans text-[20px] font-bold tracking-[-0.01em] text-[#3E2A1E]">
          <span className="mr-1">🔥</span>성수동 인기 공간 TOP 5
        </h2>
        <button type="button" className="flex items-center text-[15px] font-medium text-[#5B4739]">
          <span>더보기</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mb-4 font-body-sans text-[15px] text-[#9C8F84]">사람들이 오래 기억한 공간들이에요.</p>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {topPlaces.map((place) => (
          <article
            key={place.rank}
            className="w-[162px] shrink-0 overflow-hidden rounded-[18px] border border-[#EEE7DD] bg-[#FCF8F3]"
          >
            <div className="relative h-[148px] overflow-hidden rounded-t-[18px]">
              <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#B17543] text-sm font-bold text-white">
                {place.rank}
              </span>
            </div>

            <div className="space-y-2 px-3 pb-4 pt-3">
              <h3 className="font-body-sans text-[17px] font-semibold leading-tight text-[#2F2218]">{place.name}</h3>
              <span className="inline-flex rounded-full bg-[#EFE8DE] px-2 py-1 text-[12px] font-medium text-[#7F6E61]">
                {place.category}
              </span>
              <p className="font-body-sans text-[15px] leading-snug text-[#5C4B3D]">“{place.quote}”</p>
              <p className="font-body-sans text-[14px] font-medium text-[#6D5C4E]">흔적 {place.traces}개</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TopPlacesSection
