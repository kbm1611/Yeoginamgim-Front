import { useState } from 'react'
import HomeFilters from '../components/HomeFilters'
import RecentTracesSection from '../components/RecentTracesSection'
import TopPlacesSection from '../components/TopPlacesSection'

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <div className="scrollbar-hide h-full overflow-y-auto bg-[#F7F2EA] pb-2">
      <HomeFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <TopPlacesSection />
      <RecentTracesSection />
    </div>
  )
}

export default HomePage
