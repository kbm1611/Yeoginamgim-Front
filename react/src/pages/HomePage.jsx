import { useState } from 'react'
import HomeFilters from '../components/HomeFilters'
import RecentTracesSection from '../components/RecentTracesSection'
import TopPlacesSection from '../components/TopPlacesSection'

const APP_BG = '#F7F2EA'

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <div className="scrollbar-hide h-full overflow-y-auto pb-2" style={{ backgroundColor: APP_BG }}>
      <HomeFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <TopPlacesSection />
      <RecentTracesSection />
    </div>
  )
}

export default HomePage
