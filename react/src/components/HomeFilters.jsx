import { ChevronDown, MapPin } from 'lucide-react'

const categories = ['전체', '카페', '맛집', '편집샵', '공원', '문화', '기타']

function HomeFilters({ activeCategory, onCategoryChange }) {
  return (
    <section className="px-4 pb-2 pt-1">
      <div className="flex items-center rounded-[12px] bg-white px-4 py-3.5 text-[#4B3729] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
        <button type="button" className="flex flex-1 items-center gap-2 font-body-sans text-[15px] font-medium">
          <MapPin size={16} strokeWidth={2} />
          <span>성수동</span>
          <ChevronDown size={15} strokeWidth={2.1} />
        </button>

        <div className="mx-2 h-6 w-px bg-[#F0EAE1]" />

        <button type="button" className="flex items-center gap-1.5 font-body-sans text-[15px] font-medium">
          <span>인기순</span>
          <ChevronDown size={15} strokeWidth={2.1} />
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
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
                isActive ? 'bg-[#3E2A1E] text-white' : 'bg-[#EDE6DD] text-[#7E6D61]'
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
