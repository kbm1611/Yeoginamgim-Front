import { ArrowRight, ClipboardList, Loader2, MapPinned, Star, X } from 'lucide-react'
import {
  MAP_SELECTED_PLACE_PANEL_HEIGHT,
  getPlaceCategoryMeta,
  getPlaceInfoRows,
} from '../../../pages/Map.utils'
import { CATEGORY_ICON_COMPONENTS } from '../mapIcons'

function SelectedPlaceCard({
  place,
  isOpening,
  isFavorite,
  isFavoriteLoading,
  error,
  favoriteError,
  onClose,
  onToggleFavorite,
  onOpenBoard,
}) {
  const rows = getPlaceInfoRows(place)
  const meta = getPlaceCategoryMeta(place.categoryKey)
  const PlaceIcon = CATEGORY_ICON_COMPONENTS[meta.iconName] ?? MapPinned
  const traceCount = Number(place.traceCount)
  const traceCountLabel = Number.isFinite(traceCount) ? `${traceCount}개` : '0개'

  return (
    <aside
      className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] border-t border-[#E8DED2] bg-white/97 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 text-[#2B1810] shadow-[0_-16px_34px_rgba(61,36,21,0.18)] backdrop-blur-sm"
      style={{ height: MAP_SELECTED_PLACE_PANEL_HEIGHT }}
      aria-live="polite"
    >
      <span className="mx-auto mb-3 h-1 w-12 shrink-0 rounded-full bg-[#DDD3C6]" />

      <div className="flex shrink-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[#E1D3C5] bg-[#F8F2EA] text-[#5A4030]">
          <PlaceIcon size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold leading-tight">{place.placeName}</p>
          <p className="mt-1 truncate text-[12px] font-medium text-[#7A6558]">{place.groupName || '장소'}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#7A5A2E]">
            <ClipboardList size={11} strokeWidth={1.8} />
            흔적 {traceCountLabel}
          </span>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isFavoriteLoading}
            className={`mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${
              isFavorite ? 'bg-[#FCE9E5] text-[#C94A36]' : 'bg-[#F7F2EA] text-[#7A6558] hover:bg-[#F0E7DC]'
            }`}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {isFavoriteLoading ? (
              <Loader2 size={17} strokeWidth={1.8} className="animate-spin" />
            ) : (
              <Star size={18} strokeWidth={1.8} fill={isFavorite ? 'currentColor' : 'none'} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2EA] text-[#7A6558] transition hover:bg-[#F0E7DC]"
            aria-label="선택 장소 정보 닫기"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {rows.length > 0 ? (
          <dl className="grid gap-2 text-[13px] leading-[1.4]">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 rounded-[14px] bg-[#FBF8F3] px-3 py-2">
                <dt className="text-[#8A7464]">{row.label}</dt>
                <dd className="min-w-0 break-words text-[#4E3829]">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {error ? <p className="mt-2 text-[12px] font-medium text-[#A74831]">{error}</p> : null}
        {favoriteError ? <p className="mt-2 text-[12px] font-medium text-[#A74831]">{favoriteError}</p> : null}
      </div>

      <button
        type="button"
        onClick={onOpenBoard}
        disabled={isOpening}
        className="mt-3 flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#3D2415] px-4 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(61,36,21,0.18)] transition disabled:opacity-65"
      >
        {isOpening ? (
          <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
        ) : (
          <ArrowRight size={15} strokeWidth={1.9} />
        )}
        <span>{isOpening ? '이동 중' : '보드 이동'}</span>
      </button>
    </aside>
  )
}

export default SelectedPlaceCard
