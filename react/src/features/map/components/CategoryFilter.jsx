import { useCallback, useRef } from 'react'
import { MapPinned } from 'lucide-react'
import {
  CATEGORY_FILTERS,
  MAP_CATEGORY_FILTER_BUTTON_CLASSES,
  MAP_CATEGORY_FILTER_SCROLL_CLASSES,
  getHorizontalDragScrollLeft,
  getHorizontalDragStartState,
} from '../../../pages/Map.utils'
import { CATEGORY_ICON_COMPONENTS } from '../mapIcons'

function CategoryFilter({
  selectedCategory,
  disabled = false,
  status,
  error,
  isEmpty = false,
  onSelect,
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

  const handleCategoryClick = useCallback((event, categoryLabel) => {
    if (didDragRef.current) {
      event.preventDefault()
      didDragRef.current = false
      return
    }

    onSelect(categoryLabel)
  }, [onSelect])

  return (
    <>
      <div
        className={MAP_CATEGORY_FILTER_SCROLL_CLASSES}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {CATEGORY_FILTERS.map((item) => {
          const CategoryIcon = CATEGORY_ICON_COMPONENTS[item.iconName] ?? MapPinned
          const isSelected = selectedCategory === item.label

          return (
            <button
              key={item.label}
              type="button"
              onClick={(event) => handleCategoryClick(event, item.label)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${item.label} 카테고리`}
              className={`${MAP_CATEGORY_FILTER_BUTTON_CLASSES} ${
                disabled
                  ? 'cursor-not-allowed border-[#E2D6C8] bg-[#EEE6DA] text-[#8D7A6B] opacity-60'
                  : isSelected
                    ? 'border-[#3D2415] bg-[#3D2415] text-white shadow-[0_6px_14px_rgba(61,36,21,0.18)]'
                    : 'border-[#E2D6C8] bg-[#EEE6DA] text-[#5A4030]'
              }`}
            >
              <CategoryIcon size={14} strokeWidth={1.9} className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </div>

      {status === 'error' && error ? (
        <p className="mt-2 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-[#A74831] shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
          {error}
        </p>
      ) : null}
      {status === 'success' && selectedCategory && isEmpty ? (
        <p className="mt-2 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-[#6B5343] shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
          선택한 카테고리의 장소가 아직 없어요.
        </p>
      ) : null}
    </>
  )
}

export default CategoryFilter
