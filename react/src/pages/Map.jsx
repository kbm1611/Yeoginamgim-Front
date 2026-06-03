import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createBoard, fetchBoardByKakaoPlaceId } from '../api/boards'
import { ensureKakaoMaps } from '../api/kakaoMaps'
import { fetchNearbyPlaces } from '../api/places'
import mainLogo from '../assets/logo/image_12-removebg-preview.png'
import placePlaceholder from '../assets/images/home/place-placeholder.png'
import {
  buildBoardRequestFromPlace,
  buildNearbyPlaceRequests,
  CATEGORY_FILTERS,
  DEFAULT_MAP_CENTER,
  NEARBY_LIMIT,
  normalizePlaces,
} from './Map.utils'

const DISMISS_THRESHOLD = 150
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000,
  timeout: 8000,
}

function MapPage() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const mapElementRef = useRef(null)
  const kakaoRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const cardRefs = useRef({})
  const placesRequestIdRef = useRef(0)
  const isMountedRef = useRef(false)
  const dragStateRef = useRef({ dragging: false, startY: 0, startHeight: 0 })
  const heightRef = useRef(280)

  const [mapStatus, setMapStatus] = useState('loading')
  const [mapError, setMapError] = useState('')
  const [mapRetryKey, setMapRetryKey] = useState(0)
  const [locationStatus, setLocationStatus] = useState('loading')
  const [locationNotice, setLocationNotice] = useState('')
  const [currentPosition, setCurrentPosition] = useState(DEFAULT_MAP_CENTER)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [places, setPlaces] = useState([])
  const [placesStatus, setPlacesStatus] = useState('idle')
  const [placesError, setPlacesError] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [openingPlaceId, setOpeningPlaceId] = useState(null)
  const [boardError, setBoardError] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(280)
  const [isDragging, setIsDragging] = useState(false)

  const selectedPlace = places.find((place) => place.kakaoPlaceId === selectedPlaceId) ?? null
  const locationLabel =
    locationStatus === 'loading'
      ? '현재 위치 확인 중'
      : locationStatus === 'fallback'
        ? `${DEFAULT_MAP_CENTER.label} 기준`
        : '현재 위치 근처'

  const getHeightBounds = () => {
    const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
    return {
      minHeight: 70,
      maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
    }
  }

  const clampHeight = (value, allowBelowMin = false) => {
    const { minHeight, maxHeight } = getHeightBounds()
    const minBoundary = allowBelowMin ? 0 : minHeight
    return Math.max(minBoundary, Math.min(maxHeight, value))
  }

  const clearMarkers = useCallback(() => {
    const kakao = kakaoRef.current
    markersRef.current.forEach(({ marker, handler }) => {
      if (kakao && handler) {
        kakao.maps.event.removeListener(marker, 'click', handler)
      }
      marker.setMap(null)
    })
    markersRef.current = []
  }, [])

  const moveMapTo = useCallback((position, { smooth = true } = {}) => {
    const kakao = kakaoRef.current
    const map = mapInstanceRef.current
    if (!kakao || !map || !position) return

    const center = new kakao.maps.LatLng(position.latitude, position.longitude)
    if (smooth && map.panTo) {
      map.panTo(center)
      return
    }
    map.setCenter(center)
  }, [])

  const selectPlace = useCallback((kakaoPlaceId) => {
    setSelectedPlaceId(kakaoPlaceId)
    setIsSheetOpen(true)

    window.setTimeout(() => {
      cardRefs.current[kakaoPlaceId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }, 0)
  }, [])

  const requestCurrentLocation = useCallback(async () => {
    setLocationStatus('loading')
    setLocationNotice('')

    try {
      const position = await getCurrentPosition()
      if (!isMountedRef.current) return

      const nextPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: '현재 위치',
      }
      setCurrentPosition(nextPosition)
      setLocationStatus('success')
      moveMapTo(nextPosition)
    } catch {
      if (!isMountedRef.current) return

      setCurrentPosition(DEFAULT_MAP_CENTER)
      setLocationStatus('fallback')
      setLocationNotice('위치 권한을 사용할 수 없어 성수동 기준으로 보여드려요.')
      moveMapTo(DEFAULT_MAP_CENTER)
    }
  }, [moveMapTo])

  const loadNearbyPlaces = useCallback(async () => {
    const requests = buildNearbyPlaceRequests({
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
      selectedCategory,
    })

    if (requests.length === 0) {
      setPlaces([])
      setPlacesStatus('error')
      setPlacesError('좌표를 확인할 수 없어 주변 장소를 불러오지 못했어요.')
      return
    }

    const requestId = placesRequestIdRef.current + 1
    placesRequestIdRef.current = requestId
    setPlacesStatus('loading')
    setPlacesError('')
    setBoardError('')

    try {
      const responses = await Promise.all(requests.map((request) => fetchNearbyPlaces(request)))
      if (!isMountedRef.current || placesRequestIdRef.current !== requestId) return

      const normalizedPlaces = normalizePlaces(responses, currentPosition, NEARBY_LIMIT)
      setPlaces(normalizedPlaces)
      setSelectedPlaceId((currentId) =>
        normalizedPlaces.some((place) => place.kakaoPlaceId === currentId)
          ? currentId
          : normalizedPlaces[0]?.kakaoPlaceId ?? null
      )
      setPlacesStatus('success')
    } catch {
      if (!isMountedRef.current || placesRequestIdRef.current !== requestId) return

      setPlaces([])
      setSelectedPlaceId(null)
      setPlacesStatus('error')
      setPlacesError('주변 장소를 불러오지 못했어요.')
    }
  }, [currentPosition, selectedCategory])

  useEffect(() => {
    isMountedRef.current = true
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        requestCurrentLocation()
      }
    })

    return () => {
      isMountedRef.current = false
    }
  }, [requestCurrentLocation])

  useEffect(() => {
    let cancelled = false

    ensureKakaoMaps()
      .then((kakao) => {
        if (cancelled || !mapElementRef.current) return

        kakaoRef.current = kakao
        mapElementRef.current.innerHTML = ''

        const center = new kakao.maps.LatLng(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude)
        mapInstanceRef.current = new kakao.maps.Map(mapElementRef.current, {
          center,
          level: 5,
        })
        setMapStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return

        setMapStatus('error')
        setMapError(getMapErrorMessage(error))
      })

    return () => {
      cancelled = true
      clearMarkers()
      mapInstanceRef.current = null
    }
  }, [clearMarkers, mapRetryKey])

  useEffect(() => {
    if (mapStatus !== 'ready') return
    moveMapTo(currentPosition, { smooth: false })
  }, [currentPosition, mapStatus, moveMapTo])

  useEffect(() => {
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        loadNearbyPlaces()
      }
    })
  }, [loadNearbyPlaces])

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !kakaoRef.current) return

    const kakao = kakaoRef.current
    const map = mapInstanceRef.current
    const bounds = new kakao.maps.LatLngBounds()
    const markerPositions = []

    clearMarkers()

    places.forEach((place) => {
      if (place.latitude === null || place.longitude === null) return

      const position = new kakao.maps.LatLng(place.latitude, place.longitude)
      const marker = new kakao.maps.Marker({
        map,
        position,
        title: place.placeName,
      })
      const handler = () => selectPlace(place.kakaoPlaceId)

      kakao.maps.event.addListener(marker, 'click', handler)
      markersRef.current.push({ marker, handler, placeId: place.kakaoPlaceId })
      bounds.extend(position)
      markerPositions.push(position)
    })

    if (markerPositions.length === 1) {
      map.setLevel(4)
      map.setCenter(markerPositions[0])
    } else if (markerPositions.length > 1) {
      map.setBounds(bounds)
    }

    return clearMarkers
  }, [clearMarkers, mapStatus, places, selectPlace])

  useEffect(() => {
    markersRef.current.forEach(({ marker, placeId }) => {
      marker.setZIndex(placeId === selectedPlaceId ? 20 : 1)
    })
  }, [selectedPlaceId])

  useEffect(() => {
    const getHeightBoundsForEffect = () => {
      const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
      return {
        minHeight: 70,
        maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
      }
    }

    const clampHeightForEffect = (value, allowBelowMin = false) => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      const minBoundary = allowBelowMin ? 0 : minHeight
      return Math.max(minBoundary, Math.min(maxHeight, value))
    }

    const setInitialHeight = () => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      setSheetHeight((prev) => {
        if (prev !== 280) return clampHeightForEffect(prev)
        const preferred = Math.floor((minHeight + maxHeight) * 0.52)
        return clampHeightForEffect(preferred)
      })
    }

    setInitialHeight()
    window.addEventListener('resize', setInitialHeight)
    return () => window.removeEventListener('resize', setInitialHeight)
  }, [])

  useEffect(() => {
    heightRef.current = sheetHeight
  }, [sheetHeight])

  useEffect(() => {
    const getHeightBoundsForEffect = () => {
      const viewportHeight = containerRef.current?.clientHeight ?? window.innerHeight
      return {
        minHeight: 70,
        maxHeight: Math.max(70, Math.floor(viewportHeight * 0.85)),
      }
    }

    const clampHeightForEffect = (value, allowBelowMin = false) => {
      const { minHeight, maxHeight } = getHeightBoundsForEffect()
      const minBoundary = allowBelowMin ? 0 : minHeight
      return Math.max(minBoundary, Math.min(maxHeight, value))
    }

    const onMouseMove = (event) => {
      if (!dragStateRef.current.dragging) return
      const deltaY = dragStateRef.current.startY - event.clientY
      setSheetHeight(clampHeightForEffect(dragStateRef.current.startHeight + deltaY, true))
    }

    const onTouchMove = (event) => {
      if (!dragStateRef.current.dragging) return
      const point = event.touches[0]
      if (!point) return
      const deltaY = dragStateRef.current.startY - point.clientY
      setSheetHeight(clampHeightForEffect(dragStateRef.current.startHeight + deltaY, true))
    }

    const endDrag = () => {
      if (dragStateRef.current.dragging) {
        if (heightRef.current <= DISMISS_THRESHOLD) {
          setIsSheetOpen(false)
        } else {
          setSheetHeight(clampHeightForEffect(heightRef.current))
        }
      }
      dragStateRef.current.dragging = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', endDrag)
    window.addEventListener('touchcancel', endDrag)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', endDrag)
      window.removeEventListener('touchcancel', endDrag)
    }
  }, [])

  const openSheet = () => {
    const { minHeight, maxHeight } = getHeightBounds()
    const defaultHeight = Math.floor((minHeight + maxHeight) * 0.4)
    setIsSheetOpen(true)
    setSheetHeight(clampHeight(defaultHeight))
  }

  const startDrag = (clientY) => {
    if (!isSheetOpen) {
      openSheet()
      return
    }
    dragStateRef.current = {
      dragging: true,
      startY: clientY,
      startHeight: sheetHeight,
    }
    setIsDragging(true)
  }

  const onHandleMouseDown = (event) => {
    event.preventDefault()
    startDrag(event.clientY)
  }

  const onHandleTouchStart = (event) => {
    const point = event.touches[0]
    if (!point) return
    startDrag(point.clientY)
  }

  const handleCategorySelect = (categoryLabel) => {
    setSelectedCategory(categoryLabel)
    setSelectedPlaceId(null)
    setIsSheetOpen(true)
  }

  const handleOpenKakaoMap = () => {
    if (!selectedPlace?.kakaoMapUrl) return
    window.open(selectedPlace.kakaoMapUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenBoard = async (place) => {
    if (!place?.kakaoPlaceId) return

    setBoardError('')
    setOpeningPlaceId(place.kakaoPlaceId)
    selectPlace(place.kakaoPlaceId)

    try {
      if (place.boardId) {
        navigate(`/board/${place.boardId}`)
        return
      }

      const board = await fetchOrCreateBoard(place)
      if (!board?.boardId) {
        throw new Error('Board response does not include boardId.')
      }

      navigate(`/board/${board.boardId}`)
    } catch {
      if (isMountedRef.current) {
        setBoardError('보드로 이동하지 못했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      if (isMountedRef.current) {
        setOpeningPlaceId(null)
      }
    }
  }

  return (
    <main
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#F7F2EA]"
      style={{ fontFamily: "'Noto Serif KR', serif", color: '#2B1810' }}
    >
      <section className="absolute inset-0 z-[5] bg-[#F1ECE4]">
        <div ref={mapElementRef} className="h-full w-full" aria-label="카카오 지도" />

        {mapStatus === 'loading' ? (
          <MapOverlay>
            <Loader2 size={24} className="animate-spin" />
            <p className="mt-2 text-[14px] font-semibold">지도를 불러오는 중이에요.</p>
          </MapOverlay>
        ) : null}

        {mapStatus === 'error' ? (
          <MapOverlay>
            <AlertCircle size={25} />
            <p className="mt-2 text-[14px] font-semibold">{mapError}</p>
            <button
              type="button"
              onClick={() => {
                setMapStatus('loading')
                setMapError('')
                setMapRetryKey((value) => value + 1)
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D2415] px-4 py-2 text-[12px] font-semibold text-white"
            >
              <RefreshCw size={13} />
              다시 시도
            </button>
          </MapOverlay>
        ) : null}
      </section>

      <section className="absolute left-0 top-0 z-10 w-full px-5 pb-2 pt-3">
        <div className="mx-auto mb-3 flex w-[95px] items-center justify-center">
          <img src={mainLogo} alt="여기남김" className="w-[95px] object-contain" />
        </div>

        <div className="flex items-center rounded-[20px] border border-[#EDE4D8] bg-white/95 px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm">
          <button type="button" className="flex flex-1 items-center gap-2 text-[14px] font-medium">
            {locationStatus === 'loading' ? (
              <Loader2 size={15} strokeWidth={1.7} className="animate-spin" />
            ) : (
              <MapPin size={15} strokeWidth={1.7} />
            )}
            <span>{locationLabel}</span>
            <ChevronDown size={14} strokeWidth={1.8} />
          </button>
          <div className="mx-2 h-5 w-px bg-[#EFE7DB]" />
          <button type="button" className="flex items-center gap-1.5 text-[14px] font-medium">
            <SlidersHorizontal size={14} strokeWidth={1.8} />
            <span>{selectedCategory}</span>
          </button>
        </div>

        <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleCategorySelect(item.label)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] ${
                selectedCategory === item.label ? 'bg-[#3D2415] text-white' : 'bg-[#EEE6DA] text-[#5A4030]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="absolute right-4 top-[48%] z-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={requestCurrentLocation}
          disabled={locationStatus === 'loading'}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4D3729] shadow-[0_6px_14px_rgba(0,0,0,0.12)] disabled:opacity-60"
          aria-label="현재 위치로 이동"
        >
          {locationStatus === 'loading' ? (
            <Loader2 size={20} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <LocateFixed size={20} strokeWidth={1.8} />
          )}
        </button>
        <button
          type="button"
          onClick={handleOpenKakaoMap}
          disabled={!selectedPlace?.kakaoMapUrl}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4D3729] shadow-[0_6px_14px_rgba(0,0,0,0.12)] disabled:opacity-45"
          aria-label="카카오맵에서 선택 장소 열기"
        >
          <Navigation size={20} strokeWidth={1.8} />
        </button>
      </div>

      <section
        className="absolute bottom-[90px] left-2 right-2 z-20 rounded-t-[24px] bg-white px-5 pb-4 pt-1 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]"
        style={{
          height: `${sheetHeight}px`,
          transform: isSheetOpen ? 'translateY(0)' : 'translateY(130%)',
          transition: isDragging ? 'none' : 'transform 240ms ease, height 200ms ease',
        }}
      >
        <button
          type="button"
          className="mb-1 flex h-9 w-full items-center justify-center bg-transparent"
          onMouseDown={onHandleMouseDown}
          onTouchStart={onHandleTouchStart}
          aria-label="주변 장소 시트 높이 조절"
          style={{ touchAction: 'none' }}
        >
          <span className="h-1 w-16 rounded-full bg-[#DDD3C6]" />
        </button>

        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#2B1810]">주변 공간</h2>
            {locationNotice ? <p className="mt-0.5 text-[12px] text-[#7A6558]">{locationNotice}</p> : null}
          </div>
          <button
            type="button"
            onClick={loadNearbyPlaces}
            disabled={placesStatus === 'loading'}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#5A4030] disabled:opacity-60"
          >
            <RefreshCw size={13} strokeWidth={1.8} className={placesStatus === 'loading' ? 'animate-spin' : ''} />
            갱신
          </button>
        </div>

        {boardError ? <p className="mb-2 text-[12px] font-medium text-[#A74831]">{boardError}</p> : null}

        <div className="scrollbar-hide flex h-[calc(100%-76px)] gap-3 overflow-x-auto overflow-y-hidden pb-1">
          {placesStatus === 'loading' ? <PlaceLoadingCards /> : null}
          {placesStatus === 'error' ? (
            <PlacesPanelState message={placesError} actionLabel="다시 불러오기" onAction={loadNearbyPlaces} />
          ) : null}
          {placesStatus === 'success' && places.length === 0 ? (
            <PlacesPanelState message="근처에 보여줄 장소가 아직 없어요." actionLabel="다시 찾기" onAction={loadNearbyPlaces} />
          ) : null}
          {placesStatus === 'success'
            ? places.map((place) => (
              <PlaceCard
                key={place.kakaoPlaceId}
                refCallback={(node) => {
                  if (node) cardRefs.current[place.kakaoPlaceId] = node
                }}
                place={place}
                isSelected={place.kakaoPlaceId === selectedPlaceId}
                isOpening={place.kakaoPlaceId === openingPlaceId}
                onSelect={() => selectPlace(place.kakaoPlaceId)}
                onOpen={() => handleOpenBoard(place)}
              />
            ))
            : null}
        </div>
      </section>
    </main>
  )
}

function PlaceCard({ place, isSelected, isOpening, onSelect, onOpen, refCallback }) {
  return (
    <article
      ref={refCallback}
      className={`w-[156px] shrink-0 overflow-hidden rounded-[16px] border bg-white transition ${
        isSelected ? 'border-[#3D2415] shadow-[0_8px_18px_rgba(61,36,21,0.16)]' : 'border-[#EFE6DB]'
      }`}
    >
      <button type="button" onClick={onOpen} onMouseEnter={onSelect} className="block h-full w-full text-left">
        <img src={place.imageUrl || placePlaceholder} alt={place.placeName} className="aspect-square w-full object-cover" />
        <div className="px-2.5 pb-2.5 pt-2">
          <span className="inline-block rounded-full bg-[#F2EBDF] px-2 py-0.5 text-[10px] font-medium text-[#6B5343]">
            {place.groupName}
          </span>
          <p className="mt-1 truncate text-[15px] font-bold text-[#2B1810]">{place.placeName}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[32px] text-[12px] font-normal leading-[1.35] text-[#5F4A3B]">
            {place.address || place.phone || '주소 정보가 없어요.'}
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
      <button
        type="button"
        onClick={onAction}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D2415] px-4 py-2 text-[12px] font-semibold text-white"
      >
        <RefreshCw size={13} />
        {actionLabel}
      </button>
    </div>
  )
}

function MapOverlay({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F1ECE4]/92 px-8 text-center text-[#3D2415]">
      {children}
    </div>
  )
}

async function fetchOrCreateBoard(place) {
  try {
    return await fetchBoardByKakaoPlaceId(place.kakaoPlaceId)
  } catch (error) {
    if (error?.status !== 404) throw error
    return createBoard(buildBoardRequestFromPlace(place))
  }
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEOLOCATION_OPTIONS)
  })
}

function getMapErrorMessage(error) {
  const message = String(error?.message ?? '')
  if (message.includes('VITE_KAKAO_JAVASCRIPT_KEY')) {
    return 'Kakao JavaScript Key가 설정되지 않았어요.'
  }

  return 'Kakao Map SDK를 불러오지 못했어요.'
}

export default MapPage
