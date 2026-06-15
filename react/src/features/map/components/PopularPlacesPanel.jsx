import { useCallback, useRef } from 'react'
import { ChevronDown, ChevronUp, Loader2, MapPin, MapPinned, RefreshCw } from 'lucide-react'
import {
  MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX,
  MAP_BOTTOM_SHEET_HEIGHT,
  MAP_BOTTOM_SHEET_TRANSITION_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  getHorizontalDragScrollLeft,
  getHorizontalDragStartState,
  getBottomSheetContentClasses,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getPlaceCategoryMeta,
} from '../../../pages/Map.utils'
import { CATEGORY_ICON_COMPONENTS } from '../mapIcons'

function PopularPlacesPanel({
  isOpen,
  locationStatus,
  notice,
  boardError,
  places,
  status,
  error,
  selectedPlaceId,
  openingPlaceId,
  cardRefs,
  onToggleOpen,
  onRetryLocation,
  onRetryPlaces,
  onSelectPlace,
}) {
  const dragStateRef = useRef(null)
  const didDragRef = useRef(false)

  const handleWheel = useCallback((event) => {
    const container = event.currentTarget
    if (container.scrollWidth <= container.clientWidth) return

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY
    if (delta === 0) return

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const nextScrollLeft = Math.max(0, Math.min(container.scrollLeft + delta, maxScrollLeft))
    if (nextScrollLeft === container.scrollLeft) return

    event.preventDefault()
    container.scrollLeft = nextScrollLeft
  }, [])

  const handlePointerDown = useCallback((event) => {
    const container = event.currentTarget
    const dragState = getHorizontalDragStartState({
      pointerType: event.pointerType,
      button: event.button,
      clientX: event.clientX,
      scrollLeft: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
    })
    if (!dragState) return

    dragStateRef.current = {
      ...dragState,
      pointerId: event.pointerId,
    }
    didDragRef.current = false
  }, [])

  const handlePointerMove = useCallback((event) => {
    const container = event.currentTarget
    const nextDragState = getHorizontalDragScrollLeft(dragStateRef.current, {
      clientX: event.clientX,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
    })
    if (!nextDragState) return

    if (nextDragState.isDragging) {
      if (!dragStateRef.current.isDragging) {
        container.setPointerCapture?.(dragStateRef.current.pointerId)
      }
      didDragRef.current = true
      event.preventDefault()
    }
    dragStateRef.current = {
      ...dragStateRef.current,
      isDragging: nextDragState.isDragging,
    }
    container.scrollLeft = nextDragState.scrollLeft
  }, [])

  const handlePointerEnd = useCallback((event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
    dragStateRef.current = null
  }, [])

  const handlePlaceSelect = useCallback((event, place) => {
    if (didDragRef.current) {
      event.preventDefault()
      event.stopPropagation()
      didDragRef.current = false
      return
    }

    onSelectPlace(place)
  }, [onSelectPlace])

  return (
    <section
      className={`absolute left-2 right-2 z-20 overflow-hidden rounded-t-[24px] bg-white px-5 pb-4 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] ${MAP_BOTTOM_SHEET_TRANSITION_CLASSES}`}
      style={{
        bottom: `${MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX}px`,
        height: MAP_BOTTOM_SHEET_HEIGHT,
        transform: getBottomSheetTransform(isOpen),
      }}
    >
      <button
        type="button"
        className="flex h-14 w-full items-center justify-between bg-transparent text-left"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        aria-label={getBottomSheetToggleLabel(isOpen)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="h-1 w-12 shrink-0 rounded-full bg-[#DDD3C6]" />
          <span className="truncate text-[18px] font-bold text-[#2B1810]">주변 인기 공간</span>
        </span>
        {isOpen ? (
          <ChevronDown size={18} strokeWidth={1.8} className="shrink-0 text-[#5A4030]" />
        ) : (
          <ChevronUp size={18} strokeWidth={1.8} className="shrink-0 text-[#5A4030]" />
        )}
      </button>

      <div className={getBottomSheetContentClasses(isOpen)} aria-hidden={!isOpen} inert={!isOpen}>
        <div className="mb-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-[#7A6558]">
              {notice}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetryPlaces}
            disabled={status === 'loading'}
            className="ml-3 flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#5A4030] disabled:opacity-60"
          >
            <RefreshCw size={13} strokeWidth={1.8} className={status === 'loading' ? 'animate-spin' : ''} />
            갱신
          </button>
        </div>

        {boardError ? <p className="mb-2 text-[12px] font-medium text-[#A74831]">{boardError}</p> : null}

        <div
          className={MAP_PLACE_LIST_SCROLL_CLASSES}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {status === 'idle' ? (
            <PlacesPanelState
              message={locationStatus === 'error'
                ? '현재 위치를 확인해야 주변 인기 공간을 볼 수 있어요.'
                : '현재 위치를 확인하면 주변 인기 공간을 보여드려요.'}
              actionLabel={locationStatus === 'error' ? '위치 다시 확인' : undefined}
              onAction={locationStatus === 'error' ? onRetryLocation : undefined}
            />
          ) : null}
          {status === 'loading' ? <PlaceLoadingCards /> : null}
          {status === 'error' ? (
            <PlacesPanelState
              message={error}
              actionLabel={locationStatus === 'success' ? '다시 불러오기' : '위치 다시 확인'}
              onAction={locationStatus === 'success' ? onRetryPlaces : onRetryLocation}
            />
          ) : null}
          {status === 'success' && places.length === 0 ? (
            <PlacesPanelState message="근처에 보여줄 장소가 아직 없어요." actionLabel="다시 찾기" onAction={onRetryPlaces} />
          ) : null}
          {status === 'success'
            ? places.map((place) => (
              <PlaceCard
                key={place.kakaoPlaceId}
                refCallback={(node) => {
                  if (node) cardRefs.current[place.kakaoPlaceId] = node
                }}
                place={place}
                isSelected={place.kakaoPlaceId === selectedPlaceId}
                isOpening={place.kakaoPlaceId === openingPlaceId}
                onSelect={(event) => handlePlaceSelect(event, place)}
              />
            ))
            : null}
        </div>
      </div>
    </section>
  )
}

function PlaceCard({ place, isSelected, isOpening, onSelect, refCallback }) {
  return (
    <article
      ref={refCallback}
      className={`${MAP_PLACE_CARD_SCROLL_CLASSES} w-[156px] shrink-0 overflow-hidden rounded-[16px] border bg-white transition ${
        isSelected ? 'border-[#3D2415] shadow-[0_8px_18px_rgba(61,36,21,0.16)]' : 'border-[#EFE6DB]'
      }`}
    >
      <button type="button" onClick={onSelect} className="block h-full w-full text-left">
        <PlaceCardImage place={place} />
        <div className="px-2.5 pb-2.5 pt-2">
          <span className="inline-block rounded-full bg-[#F2EBDF] px-2 py-0.5 text-[10px] font-medium text-[#6B5343]">
            {place.groupName}
          </span>
          <p className="mt-1 truncate text-[15px] font-bold text-[#2B1810]">{place.placeName}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[32px] text-[12px] font-normal leading-[1.35] text-[#5F4A3B]">
            {place.address || place.phone || '주소 정보가 없어요'}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] font-normal text-[#5F4A3B]">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={11} strokeWidth={1.6} />
              <span>{place.distanceLabel || '거리 미상'}</span>
            </span>
            <span className="shrink-0 text-[#8B715F]">흔적 {place.traceCount}</span>
          </div>
          {isOpening ? (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3D2415]">
              <Loader2 size={12} className="animate-spin" />
              이동 중
            </span>
          ) : null}
        </div>
      </button>
    </article>
  )
}

function PlaceCardImage({ place }) {
  if (place.imageUrl) {
    return <img src={place.imageUrl} alt={place.placeName} className="aspect-square w-full object-cover" />
  }

  const meta = getPlaceCategoryMeta(place.categoryKey)
  const PlaceholderIcon = CATEGORY_ICON_COMPONENTS[meta.iconName] ?? MapPinned

  return (
    <div
      className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-[#F7F2EA] text-[#6B5343]"
      aria-label={`${place.placeName} 장소 이미지`}
    >
      <PlaceholderIcon size={28} strokeWidth={1.6} />
      <span className="text-[12px] font-semibold">{meta.label}</span>
    </div>
  )
}

function PlaceLoadingCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article key={index} className="w-[156px] shrink-0 overflow-hidden rounded-[16px] border border-[#EFE6DB] bg-white">
      <div className="aspect-square w-full animate-pulse bg-[#EFE7DB]" />
      <div className="space-y-2 px-2.5 pb-2.5 pt-2">
        <div className="h-4 w-12 animate-pulse rounded-full bg-[#F2EBDF]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#EFE7DB]" />
        <div className="h-8 w-full animate-pulse rounded bg-[#F5EFE7]" />
      </div>
    </article>
  ))
}

function PlacesPanelState({ message, actionLabel, onAction }) {
  return (
    <div className="flex min-w-full flex-col items-center justify-center rounded-[16px] border border-[#EFE6DB] bg-[#FBF8F3] px-5 text-center">
      <p className="text-[14px] font-semibold text-[#3D2415]">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D2415] px-4 py-2 text-[12px] font-semibold text-white"
        >
          <RefreshCw size={13} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default PopularPlacesPanel
