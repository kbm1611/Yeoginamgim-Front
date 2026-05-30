import { ChevronRight, Clock3, Plus } from 'lucide-react'

const traces = [
  {
    place: '어니언 성수',
    category: '카페',
    time: '10분 전',
    review: '커피와 디저트 모두 완벽한 조합 ☕️',
    thumb: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
    user: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    place: '성수연방',
    category: '카페',
    time: '1시간 전',
    review: '창가 자리에 앉으면 마음이 차분해져요.',
    thumb: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
    user: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
  },
  {
    place: '뚝섬한강공원',
    category: '공원',
    time: '2시간 전',
    review: '해질 때 노을이 정말 예뻐요 🌅',
    thumb: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=400&q=80',
    user: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=80',
  },
  {
    place: '언더스탠드에비뉴',
    category: '편집샵',
    time: '3시간 전',
    review: '볼거리도 많고 감성 사진 남기기 좋아요.',
    thumb: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    user: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
  },
]

function RecentTracesSection() {
  return (
    <section className="px-4 pb-5 pt-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-body-sans text-[20px] font-bold tracking-[-0.01em] text-[#3E2A1E]">
          <Clock3 className="mr-1 inline-block" size={20} />최근 남겨진 흔적
        </h2>
        <button type="button" className="flex items-center text-[15px] font-medium text-[#5B4739]">
          <span>더보기</span>
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="mb-4 font-body-sans text-[15px] text-[#9C8F84]">방금 이 공간에 새로운 흔적이 남겨졌어요.</p>

      <div className="overflow-hidden rounded-[20px] border border-[#EEE7DD] bg-[#FCF8F3]">
        {traces.map((item, idx) => (
          <article
            key={`${item.place}-${idx}`}
            className={`flex items-center gap-3 px-4 py-3 ${idx !== traces.length - 1 ? 'border-b border-[#EFE7DD]' : ''}`}
          >
            <img src={item.thumb} alt={item.place} className="h-16 w-16 rounded-[12px] object-cover" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate font-body-sans text-[17px] font-semibold text-[#2F2218]">{item.place}</h3>
                <span className="shrink-0 rounded-full bg-[#EFE8DE] px-2 py-0.5 text-[11px] text-[#7F6E61]">{item.category}</span>
              </div>
              <p className="truncate font-body-sans text-[15px] text-[#5C4B3D]">“{item.review}”</p>
            </div>
            <div className="flex w-[48px] flex-col items-end gap-2">
              <span className="text-[12px] text-[#8A7A71]">{item.time}</span>
              <img src={item.user} alt="" className="h-7 w-7 rounded-full object-cover" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-[20px] bg-[#F4EEE5] px-4 py-4">
        <div>
          <p className="font-body-sans text-[19px] font-semibold text-[#3E2A1E]">아직 남긴 장소가 없어요</p>
          <p className="font-body-sans text-[14px] leading-snug text-[#7D6D61]">
            좋아하는 장소를 남기고
            <br />
            나만의 지도를 만들어보세요.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#3E2A1E] px-5 py-3 font-body-sans text-[16px] font-medium text-white"
        >
          <Plus size={18} />
          장소 남기기
        </button>
      </div>
    </section>
  )
}

export default RecentTracesSection
