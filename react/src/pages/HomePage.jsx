import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HomeFilters from '../components/HomeFilters'
import TopPlacesSection from '../components/TopPlacesSection'
import RecentTracesSection from '../components/RecentTracesSection'
import { resolveCurrentDistrict } from '../api/locationDistrict'

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [districtInfo, setDistrictInfo] = useState(null)
  const [locationStatus, setLocationStatus] = useState('loading')

  const refreshDistrict = useCallback(async ({ forceRefresh = false } = {}) => {
    setLocationStatus('loading')
    const nextDistrictInfo = await resolveCurrentDistrict({ forceRefresh })
    setDistrictInfo(nextDistrictInfo)
    setLocationStatus(nextDistrictInfo ? 'ready' : 'unavailable')
    return nextDistrictInfo
  }, [])

  useEffect(() => {
    let ignored = false

    resolveCurrentDistrict().then((nextDistrictInfo) => {
      if (ignored) return

      setDistrictInfo(nextDistrictInfo)
      setLocationStatus(nextDistrictInfo ? 'ready' : 'unavailable')
    })

    return () => {
      ignored = true
    }
  }, [])

  return (
    <motion.div
      className="h-full overflow-y-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <HomeFilters
        activeCategory={activeCategory}
        locationLabel={districtInfo?.district ?? '전체 지역'}
        isLocationLoading={locationStatus === 'loading'}
        onCategoryChange={setActiveCategory}
        onRefreshLocation={() => refreshDistrict({ forceRefresh: true })}
      />
      <TopPlacesSection
        districtInfo={districtInfo}
        locationStatus={locationStatus}
        onRefreshDistrict={() => refreshDistrict({ forceRefresh: true })}
      />
      <RecentTracesSection />
    </motion.div>
  )
}

export default HomePage
