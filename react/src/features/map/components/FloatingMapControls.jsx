import { Loader2, LocateFixed, Navigation } from 'lucide-react'
import { MAP_FLOATING_CONTROLS_TRANSITION_CLASSES } from '../../../utils/pages/Map.utils'

function FloatingMapControls({
  bottom,
  locationStatus,
  canOpenKakaoMap,
  onCurrentLocation,
  onOpenKakaoMap,
  className = '',
}) {
  return (
    <div
      className={`absolute right-4 z-30 flex flex-col gap-3 ${MAP_FLOATING_CONTROLS_TRANSITION_CLASSES} ${className}`}
      style={{ bottom }}
    >
      <MapActionButton
        icon={locationStatus === 'loading' ? Loader2 : LocateFixed}
        isLoading={locationStatus === 'loading'}
        disabled={locationStatus === 'loading'}
        onClick={onCurrentLocation}
        label="현재 위치로 이동"
      />
      <MapActionButton
        icon={Navigation}
        disabled={!canOpenKakaoMap}
        onClick={onOpenKakaoMap}
        label="카카오맵에서 선택 장소 열기"
      />
    </div>
  )
}

function MapActionButton({ icon: Icon, label, disabled = false, isLoading = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#4D3729] shadow-[0_6px_14px_rgba(0,0,0,0.12)] transition disabled:opacity-45 ${className}`}
      aria-label={label}
    >
      <Icon size={20} strokeWidth={1.8} className={isLoading ? 'animate-spin' : ''} />
    </button>
  )
}

export default FloatingMapControls
