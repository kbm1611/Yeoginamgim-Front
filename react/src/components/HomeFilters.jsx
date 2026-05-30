import { ChevronDown, MapPin } from 'lucide-react'

const categories = ['전체', '카페', '맛집', '편집샵', '공원', '문화', '기타']

function HomeFilters({ activeCategory, onCategoryChange }) {
  return (
    <section className="px-4 pb-2">
      <div className="flex items-center justify-between rounded-[20px] border border-[#EDE5DB] bg-[#FDFBF8] px-4 py-4 text-[#4B3729]">
        <button type="button" className="flex items-center gap-2 font-body-sans text-[15px] font-medium">
          <MapPin size={18} strokeWidth={2} />
          <span>성수동</span>
          <ChevronDown size={16} strokeWidth={2.2} />
        </button>
        <button type="button" className="flex items-center gap-1.5 font-body-sans text-[15px] font-medium">
          <span>인기순</span>
          <ChevronDown size={16} strokeWidth={2.2} />
        </button>
      </div>

      <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const isActive = activeCategory === category

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-full px-5 py-2.5 font-body-sans text-sm font-semibold ${
                isActive ? 'bg-[#3E2A1E] text-white' : 'bg-[#EFEAE2] text-[#8A7A71]'
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default HomeFilters
