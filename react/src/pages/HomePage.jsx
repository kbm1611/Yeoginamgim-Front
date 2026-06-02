import { useState } from 'react'
import { motion } from 'framer-motion'
import HomeFilters from '../components/HomeFilters'
import TopPlacesSection from '../components/TopPlacesSection'
import RecentTracesSection from '../components/RecentTracesSection'

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <motion.div
      className="h-full overflow-y-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <HomeFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <TopPlacesSection />
      <RecentTracesSection />
    </motion.div>
  )
}

export default HomePage
