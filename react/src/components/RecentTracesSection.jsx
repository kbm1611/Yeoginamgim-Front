import { ChevronRight, Plus } from 'lucide-react'

const traces = [
  {
    id: 1,
    place: '어니언 성수',
    category: '카페',
    time: '10분 전',
    text: '커피와 디저트 모두 완벽한 조합 ☕',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    place: '성수연방',
    category: '카페',
    time: '1시간 전',
    text: '창가 자리에 앉으면 마음이 차분해져요.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    place: '뚝섬한강공원',
    category: '공원',
    time: '2시간 전',
    text: '해질 때 노을이 정말 예뻐요 🌆',
    image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    place: '언더스탠드에비뉴',
    category: '편집샵',
    time: '3시간 전',
    text: '볼거리도 많고 감성 사진 남기기 좋아요.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  },
]

function RecentTracesSection() {
  return (
    <section className="pb-5 pt-4">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="font-body-sans text-[28px] font-bold tracking-[-0.015em] text-[#2F2118]">최근 남겨진 흔적</h2>
        <button type="button" className="flex items-center text-[13px] font-medium text-[#7D6E62]">
          더보기<ChevronRight size={15} />
        </button>
      </div>
      <p className="mb-3 px-5 text-[14px] text-[#8E8177]">방금 이 공간에 새로운 흔적이 남겨졌어요.</p>

      <div className="mx-4 rounded-[16px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {traces.map((trace, index) => (
          <article
            key={trace.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${index !== traces.length - 1 ? 'border-b border-[#F1ECE4]' : ''}`}
          >
            <img src={trace.image} alt={trace.place} className="h-14 w-14 rounded-[10px] object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[16px] font-semibold text-[#2F2118]">{trace.place}</p>
                <span className="rounded-[8px] bg-[#F3EEE7] px-1.5 py-0.5 text-[10px] text-[#7E6E62]">{trace.category}</span>
              </div>
              <p className="mt-1 truncate text-[14px] text-[#5E5146]">"{trace.text}"</p>
            </div>
            <p className="shrink-0 text-[12px] text-[#8E8177]">{trace.time}</p>
          </article>
        ))}
      </div>

      <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-[16px] bg-[#EFE8DE] px-4 py-4">
        <div>
          <p className="text-[18px] font-semibold text-[#2F2118]">아직 남긴 장소가 없어요</p>
          <p className="text-[14px] leading-snug text-[#75695F]">좋아하는 장소를 남기고, 나만의 지도를 만들어보세요.</p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#3E2A1E] px-4 py-2.5 text-[14px] font-medium text-white"
        >
          <Plus size={16} />
          장소 남기기
        </button>
      </div>
    </section>
  )
}

export default RecentTracesSection
