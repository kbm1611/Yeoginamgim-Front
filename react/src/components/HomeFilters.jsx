import { useState } from 'react'
import { ChevronDown, LocateFixed, MapPin, Search, X } from 'lucide-react'
import {
  ALL_DISTRICTS_LABEL,
  HOME_PERIOD_OPTIONS,
  REGION_GROUPS,
  filterRegionDistricts,
  findRegionIdByDistrict,
} from '../pages/HomePage.utils'

function HomeFilters({
  period,
  selectedDistrict,
  currentDistrict,
  isLocationLoading = false,
  onPeriodChange,
  onDistrictChange,
  onRefreshLocation,
}) {
  const [isDistrictSheetOpen, setDistrictSheetOpen] = useState(false)
  const [districtSearchQuery, setDistrictSearchQuery] = useState('')
  const [activeRegionId, setActiveRegionId] = useState('all')
  const filteredDistricts = filterRegionDistricts({
    activeRegionId,
    query: districtSearchQuery,
  })

  const openDistrictSheet = () => {
    setDistrictSearchQuery('')
    setActiveRegionId(findRegionIdByDistrict(selectedDistrict))
    setDistrictSheetOpen(true)
  }

  const closeDistrictSheet = () => {
    setDistrictSearchQuery('')
    setDistrictSheetOpen(false)
  }

  const handleDistrictSelect = (district) => {
    onDistrictChange(district)
    closeDistrictSheet()
  }

  return (
    <section className="px-5 pb-2 pt-1">
      <div className="grid grid-cols-4 rounded-[14px] border border-[#EEE7F8] bg-white p-1 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
        {HOME_PERIOD_OPTIONS.map((option) => {
          const isActive = period === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodChange(option.value)}
              className={`h-11 rounded-[12px] text-[14px] font-bold transition ${
                isActive ? 'bg-[#ECE4FF] text-[#7B55F6]' : 'text-[#6F7685]'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={openDistrictSheet}
          className="flex min-w-0 flex-1 items-center justify-between rounded-[14px] bg-white px-4 py-3 text-left text-[#3B2A1E] shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin size={17} strokeWidth={2} className="shrink-0 text-[#8B63F7]" />
            <span className="truncate text-[15px] font-bold">{selectedDistrict}</span>
          </span>
          <ChevronDown size={16} strokeWidth={2.1} className="shrink-0 text-[#7D6E62]" />
        </button>
        <button
          type="button"
          onClick={onRefreshLocation}
          disabled={isLocationLoading}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-white text-[#7D6E62] shadow-[0_4px_12px_rgba(0,0,0,0.04)] disabled:opacity-50"
          aria-label="현재 위치로 지역 설정"
        >
          <LocateFixed size={18} className={isLocationLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {currentDistrict !== ALL_DISTRICTS_LABEL ? (
        <p className="mt-2 px-1 text-[12px] font-medium text-[#8E8177]">현재 위치 기준 {currentDistrict}</p>
      ) : null}

      {isDistrictSheetOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 px-3 pb-3 sm:items-center sm:p-6">
          <div className="flex h-[82%] max-h-[640px] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-[#FFFDF9] shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:h-[78vh] sm:min-h-[560px] sm:max-h-[720px]">
            <div className="shrink-0 border-b border-[#EFE7DD] px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-bold text-[#2B1810]">지역 선택</h2>
                <button
                  type="button"
                  onClick={closeDistrictSheet}
                  aria-label="지역 선택 닫기"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4EEE6] text-[#5F5146]"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="mt-4 flex min-h-[48px] items-center gap-2 rounded-[15px] bg-[#F5EFE7] px-4 text-[#5F5146]">
                <Search size={17} className="shrink-0 text-[#8B63F7]" />
                <input
                  type="search"
                  value={districtSearchQuery}
                  onChange={(event) => setDistrictSearchQuery(event.target.value)}
                  placeholder="지역명 검색"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#3B2A1E] outline-none placeholder:text-[#9B8B7D]"
                />
              </label>

              <div className="-mx-5 mt-4 overflow-x-auto px-5 scrollbar-hide sm:mx-0 sm:overflow-visible sm:px-0">
                <div className="flex w-max gap-2 sm:grid sm:w-full sm:grid-cols-5">
                  {REGION_GROUPS.map((region) => {
                    const isActive = activeRegionId === region.id

                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => setActiveRegionId(region.id)}
                        className={`h-10 shrink-0 rounded-full px-4 text-[14px] font-bold transition ${
                          isActive
                            ? 'bg-[#8B63F7] text-white shadow-[0_5px_12px_rgba(139,99,247,0.24)]'
                            : 'bg-white text-[#6F6258] shadow-[0_3px_10px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        {region.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filteredDistricts.length > 0 ? (
                <div className="grid auto-rows-[58px] grid-cols-2 gap-2 sm:grid-cols-3">
                  {filteredDistricts.map((district, index) => {
                    const isActive = selectedDistrict === district

                    return (
                      <button
                        key={`${district}-${index}`}
                        type="button"
                        onClick={() => handleDistrictSelect(district)}
                        className={`flex h-full items-center rounded-[14px] px-4 py-3 text-left text-[14px] font-bold leading-snug transition ${
                          isActive
                            ? 'bg-[#8B63F7] text-white shadow-[0_5px_12px_rgba(139,99,247,0.24)]'
                            : 'bg-white text-[#3B2A1E] shadow-[0_3px_10px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        <span className="whitespace-normal break-keep">{district}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[14px] bg-white px-4 py-8 text-center text-[14px] font-medium text-[#8E8177] shadow-[0_3px_10px_rgba(0,0,0,0.04)]">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default HomeFilters
