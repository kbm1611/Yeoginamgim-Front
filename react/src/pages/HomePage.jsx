import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HomeFilters from '../components/HomeFilters'
import NotificationButton from '../components/NotificationButton'
import TopPlacesSection from '../components/TopPlacesSection'
import RecentTracesSection from '../components/RecentTracesSection'
import { resolveCurrentDistrict } from '../api/locationDistrict'
import { ALL_DISTRICTS_LABEL, DEFAULT_HOME_PERIOD, normalizeHomeDistrict } from '../utils/pages/HomePage.utils'

function HomePage() {
  const [period, setPeriod] = useState(DEFAULT_HOME_PERIOD)
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS_LABEL)
  const [currentDistrict, setCurrentDistrict] = useState(ALL_DISTRICTS_LABEL)
  const [locationStatus, setLocationStatus] = useState('loading')

  const applyDistrictInfo = useCallback((nextDistrictInfo) => {
    const district = normalizeHomeDistrict(nextDistrictInfo)
    setCurrentDistrict(district)
    setSelectedDistrict(district)
    setLocationStatus(district === ALL_DISTRICTS_LABEL ? 'unavailable' : 'ready')
    return district
  }, [])

  const refreshDistrict = useCallback(async ({ forceRefresh = false } = {}) => {
    setLocationStatus('loading')
    const nextDistrictInfo = await resolveCurrentDistrict({ forceRefresh })
    return applyDistrictInfo(nextDistrictInfo)
  }, [applyDistrictInfo])

  useEffect(() => {
    let ignored = false

    resolveCurrentDistrict().then((nextDistrictInfo) => {
      if (ignored) return
      applyDistrictInfo(nextDistrictInfo)
    })

    return () => {
      ignored = true
    }
  }, [applyDistrictInfo])

  return (
    <motion.div
      className="h-full overflow-y-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-end px-5 pb-1 pt-2">
        <NotificationButton />
      </div>
      <HomeFilters
        period={period}
        selectedDistrict={selectedDistrict}
        currentDistrict={currentDistrict}
        isLocationLoading={locationStatus === 'loading'}
        onPeriodChange={setPeriod}
        onDistrictChange={setSelectedDistrict}
        onRefreshLocation={() => refreshDistrict({ forceRefresh: true })}
      />
      <TopPlacesSection
        period={period}
        district={selectedDistrict}
        locationStatus={locationStatus}
        onRefreshDistrict={() => refreshDistrict({ forceRefresh: true })}
      />
      <RecentTracesSection period={period} district={selectedDistrict} />
    </motion.div>
  )
}

export default HomePage
