import { useState } from 'react'
import { Bell, ChevronDown, LocateFixed, MapPin, X } from 'lucide-react'
import { ALL_DISTRICTS_LABEL, HOME_PERIOD_OPTIONS, SEOUL_DISTRICTS } from '../pages/HomePage.utils'

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

  const handleDistrictSelect = (district) => {
    onDistrictChange(district)
    setDistrictSheetOpen(false)
  }

  return (
    <section className="px-5 pb-2 pt-3">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight text-[#171B2A]">자치구별 인기 방명록</h1>
          <p className="mt-2 text-[14px] leading-snug text-[#7A8394]">
            선택한 자치구 안에서 사람들이 많이 기록한 장소를 둘러보세요.
          </p>
        </div>
        <button
          type="button"
          aria-label="알림"
          className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#171B2A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
        >
          <Bell size={21} strokeWidth={1.8} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#8B63F7]" />
        </button>
      </div>

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
          onClick={() => setDistrictSheetOpen(true)}
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
          <div className="max-h-[76%] w-full overflow-hidden rounded-[24px] bg-[#FFFDF9] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#EFE7DD] px-5 py-4">
              <div>
                <p className="text-[12px] font-bold text-[#8B63F7]">서울특별시</p>
                <h2 className="text-[20px] font-bold text-[#2B1810]">구 선택</h2>
              </div>
              <button
                type="button"
                onClick={() => setDistrictSheetOpen(false)}
                aria-label="지역 선택 닫기"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4EEE6] text-[#5F5146]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[430px] overflow-y-auto px-4 py-4">
              <button
                type="button"
                onClick={() => handleDistrictSelect(ALL_DISTRICTS_LABEL)}
                className={`mb-3 w-full rounded-[14px] px-4 py-3 text-left text-[15px] font-bold ${
                  selectedDistrict === ALL_DISTRICTS_LABEL ? 'bg-[#3E2A1E] text-white' : 'bg-[#F3EEE7] text-[#3B2A1E]'
                }`}
              >
                전체
              </button>
              <div className="grid grid-cols-2 gap-2">
                {SEOUL_DISTRICTS.map((district) => {
                  const isActive = selectedDistrict === district

                  return (
                    <button
                      key={district}
                      type="button"
                      onClick={() => handleDistrictSelect(district)}
                      className={`rounded-[14px] px-4 py-3 text-left text-[14px] font-bold ${
                        isActive ? 'bg-[#8B63F7] text-white' : 'bg-white text-[#3B2A1E] shadow-[0_3px_10px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      {district}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default HomeFilters
