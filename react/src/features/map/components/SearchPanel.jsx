import { Loader2, MapPinned, RefreshCw, Search, X } from 'lucide-react'
import {
  MAP_SEARCH_RESULTS_LIST_CLASSES,
  MAP_SEARCH_RESULTS_PANEL_CLASSES,
  getPlaceCategoryMeta,
} from '../../../pages/Map.utils'
import { CATEGORY_ICON_COMPONENTS } from '../mapIcons'

function SearchPanel({
  input,
  title,
  status,
  notice,
  error,
  places,
  selectedPlaceId,
  shouldRenderResults,
  onInputChange,
  onSubmit,
  onClear,
  onRetry,
  onSelectPlace,
}) {
  return (
    <>
      <form
        className="mb-2 flex min-h-12 items-center gap-2 rounded-[20px] border border-[#EDE4D8] bg-white/96 px-3 py-2 shadow-[0_5px_14px_rgba(61,36,21,0.08)] backdrop-blur-sm"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <input
          type="search"
          value={input}
          onChange={onInputChange}
          placeholder="장소를 검색해 보세요"
          className="map-search-input min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#2B1810] outline-none placeholder:text-[#9A8778]"
          aria-label="장소 검색어"
        />
        {input ? (
          <button
            type="button"
            onClick={onClear}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F2EA] text-[#7A6558]"
            aria-label="검색어 지우기"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        ) : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3D2415] text-white shadow-[0_5px_12px_rgba(61,36,21,0.2)] disabled:opacity-60"
          aria-label="장소 검색"
        >
          {status === 'loading' ? (
            <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Search size={16} strokeWidth={1.9} />
          )}
        </button>
      </form>

      {shouldRenderResults ? (
        <SearchResultsPanel
          title={title}
          searchStatus={status}
          searchNotice={notice}
          searchError={error}
          places={places}
          selectedPlaceId={selectedPlaceId}
          onRetry={onRetry}
          onSelectPlace={onSelectPlace}
        />
      ) : null}
    </>
  )
}

function SearchResultsPanel({
  title,
  searchStatus,
  searchNotice,
  searchError,
  places,
  selectedPlaceId,
  onRetry,
  onSelectPlace,
}) {
  const showHeader = searchStatus !== 'idle' && !searchNotice

  return (
    <div className={MAP_SEARCH_RESULTS_PANEL_CLASSES} role="region" aria-label="장소 검색 결과">
      {showHeader ? (
        <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[#F0E6DA] px-4 py-2">
          <p className="min-w-0 truncate text-[13px] font-semibold text-[#4A3324]">{title}</p>
          {searchStatus === 'loading' ? (
            <Loader2 size={15} strokeWidth={1.8} className="shrink-0 animate-spin text-[#7A6558]" />
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F7F2EA] px-3 py-1.5 text-[12px] font-semibold text-[#5A4030]"
            >
              <RefreshCw size={12} strokeWidth={1.8} />
              다시 검색
            </button>
          )}
        </div>
      ) : null}

      <div className={MAP_SEARCH_RESULTS_LIST_CLASSES}>
        {searchStatus === 'idle' && searchNotice ? (
          <SearchResultsState message={searchNotice} />
        ) : null}
        {searchStatus === 'loading' ? <SearchResultSkeletons /> : null}
        {searchStatus === 'error' ? (
          <SearchResultsState
            message={searchError}
            actionLabel="다시 검색"
            onAction={onRetry}
          />
        ) : null}
        {searchStatus === 'success' && places.length === 0 ? (
          <SearchResultsState
            message="검색 결과가 없어요. 다른 검색어로 찾아보세요."
            actionLabel="다시 검색"
            onAction={onRetry}
          />
        ) : null}
        {searchStatus === 'success'
          ? places.map((place) => (
            <SearchResultItem
              key={place.kakaoPlaceId}
              place={place}
              isSelected={place.kakaoPlaceId === selectedPlaceId}
              onSelect={() => onSelectPlace(place)}
            />
          ))
          : null}
      </div>
    </div>
  )
}

function SearchResultItem({ place, isSelected, onSelect }) {
  const meta = getPlaceCategoryMeta(place.categoryKey)
  const PlaceIcon = CATEGORY_ICON_COMPONENTS[meta.iconName] ?? MapPinned

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex min-h-[78px] w-full items-center gap-3 border-b border-[#F0E6DA] px-4 py-3 text-left transition last:border-b-0 ${
        isSelected ? 'bg-[#F7F2EA]' : 'bg-white hover:bg-[#FBF8F3]'
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[#E1D3C5] bg-[#F8F2EA] text-[#5A4030]">
        <PlaceIcon size={19} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-[#2B1810]">{place.placeName}</span>
        <span className="mt-1 block truncate text-[12px] font-medium text-[#7A6558]">
          {place.groupName || '장소'} · {place.distanceLabel || '거리 미상'}
        </span>
        <span className="mt-1 block truncate text-[12px] font-normal text-[#5F4A3B]">
          {place.address || place.phone || '주소 정보가 없어요'}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-[#F2EBDF] px-2 py-1 text-[11px] font-semibold text-[#6B5343]">
        흔적 {place.traceCount}
      </span>
    </button>
  )
}

function SearchResultSkeletons() {
  return Array.from({ length: 4 }, (_, index) => (
    <div key={index} className="flex min-h-[78px] items-center gap-3 border-b border-[#F0E6DA] px-4 py-3 last:border-b-0">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-[15px] bg-[#EFE7DB]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-[#EFE7DB]" />
        <div className="h-3 w-36 animate-pulse rounded bg-[#F2EBDF]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#F5EFE7]" />
      </div>
    </div>
  ))
}

function SearchResultsState({ message, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[110px] flex-col items-center justify-center px-5 py-5 text-center">
      <p className="text-[14px] font-semibold leading-[1.45] text-[#3D2415]">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D2415] px-4 py-2 text-[12px] font-semibold text-white"
        >
          <RefreshCw size={13} strokeWidth={1.8} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default SearchPanel
