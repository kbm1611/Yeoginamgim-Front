import { useState } from 'react'
import { ChevronDown, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { ALL_DISTRICTS_LABEL, HOME_PERIOD_OPTIONS, filterSupportedDistricts } from '../pages/HomePage.utils'

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
  const filteredDistricts = filterSupportedDistricts(districtSearchQuery)

  const openDistrictSheet = () => {
    setDistrictSearchQuery('')
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
        <div className="absolute inset-0 z-40 flex items-end bg-black/20 px-3 pb-3">
          <div className="flex h-[76%] max-h-[560px] w-full flex-col overflow-hidden rounded-[24px] bg-[#FFFDF9] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EFE7DD] px-5 py-4">
              <div className="min-w-[96px]">
                <p className="text-[12px] font-bold text-[#8B63F7]">전국</p>
                <h2 className="text-[20px] font-bold text-[#2B1810]">구 선택</h2>
              </div>
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-[#F5EFE7] px-3 py-2 text-[#5F5146]">
                <Search size={16} className="shrink-0 text-[#8B63F7]" />
                <input
                  type="search"
                  value={districtSearchQuery}
                  onChange={(event) => setDistrictSearchQuery(event.target.value)}
                  placeholder="자치구 검색"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#3B2A1E] outline-none placeholder:text-[#9B8B7D]"
                />
              </label>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={closeDistrictSheet}
                  aria-label="지역 선택 닫기"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4EEE6] text-[#5F5146]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!districtSearchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => handleDistrictSelect(ALL_DISTRICTS_LABEL)}
                  className={`mb-3 w-full rounded-[14px] px-4 py-3 text-left text-[15px] font-bold ${
                    selectedDistrict === ALL_DISTRICTS_LABEL ? 'bg-[#3E2A1E] text-white' : 'bg-[#F3EEE7] text-[#3B2A1E]'
                  }`}
                >
                  전체
                </button>
              ) : null}
              {filteredDistricts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredDistricts.map((district) => {
                    const isActive = selectedDistrict === district

                    return (
                      <button
                        key={district}
                        type="button"
                        onClick={() => handleDistrictSelect(district)}
                        className={`rounded-[14px] px-4 py-3 text-left text-[14px] font-bold ${
                          isActive
                            ? 'bg-[#8B63F7] text-white'
                            : 'bg-white text-[#3B2A1E] shadow-[0_3px_10px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        {district}
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
