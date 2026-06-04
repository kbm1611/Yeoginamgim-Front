import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Baby,
  Banknote,
  Building,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleParking,
  Coffee,
  Fuel,
  GraduationCap,
  Hospital,
  Hotel,
  Landmark,
  LocateFixed,
  Loader2,
  Map as MapIcon,
  MapPinned,
  MapPin,
  Navigation,
  Pill,
  RefreshCw,
  School,
  Search,
  ShoppingCart,
  Store,
  TrainFront,
  Utensils,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchOrCreateBoardForPlace } from '../api/boards'
import { ensureKakaoMaps } from '../api/kakaoMaps'
import { fetchPoiPlaces, fetchPopularPlaces } from '../api/places'
import mainLogo from '../assets/logo/image_12-removebg-preview.png'
import {
  buildPoiSearchRequest,
  buildPopularPlaceRequest,
  DEFAULT_MAP_CENTER,
  MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX,
  MAP_BOTTOM_SHEET_HEIGHT,
  MAP_BOTTOM_SHEET_TRANSITION_CLASSES,
  MAP_CURRENT_LOCATION_LEVEL,
  MAP_FLOATING_CONTROLS_TRANSITION_CLASSES,
  MAP_PLACE_CARD_SCROLL_CLASSES,
  MAP_PLACE_LIST_SCROLL_CLASSES,
  MAP_SEARCH_RESULTS_LIST_CLASSES,
  MAP_SEARCH_RESULTS_PANEL_CLASSES,
  MAP_SELECTED_PLACE_PANEL_CONTROLS_BOTTOM,
  MAP_SELECTED_PLACE_PANEL_HEIGHT,
  MAP_SELECTED_PLACE_LEVEL,
  PLACE_MARKER_ICON_PATHS,
  NEARBY_LIMIT,
  getBottomSheetContentClasses,
  getBottomSheetToggleLabel,
  getBottomSheetTransform,
  getCurrentLocationViewPlan,
  getCurrentPositionMarkerTitle,
  getFloatingControlsBottom,
  getMapBottomUiState,
  getMapViewportPlan,
  getMarkerPlaces,
  getPlaceCategoryMeta,
  getPlaceSelectionTransitionState,
  getPlaceInfoRows,
  getSearchResultsPanelState,
  normalizePopularPlaces,
  normalizeSearchPlaces,
} from './Map.utils'

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000,
  timeout: 8000,
}

const LOCATION_REQUIRED_MESSAGE = '현재 위치를 확인해야 주변 장소를 보여줄 수 있어요.'

const CATEGORY_ICON_COMPONENTS = {
  mapPinned: MapPinned,
  shoppingCart: ShoppingCart,
  store: Store,
  baby: Baby,
  school: School,
  graduationCap: GraduationCap,
  circleParking: CircleParking,
  fuel: Fuel,
  trainFront: TrainFront,
  banknote: Banknote,
  landmark: Landmark,
  building2: Building2,
  building: Building,
  map: MapIcon,
  hotel: Hotel,
  coffee: Coffee,
  utensils: Utensils,
  hospital: Hospital,
  pill: Pill,
}

function MapPage() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const mapElementRef = useRef(null)
  const kakaoRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const currentLocationOverlayRef = useRef(null)
  const cardRefs = useRef({})
  const poiSearchRequestIdRef = useRef(0)
  const popularPlacesRequestIdRef = useRef(0)
  const placeLookupRef = useRef(new globalThis.Map())
  const selectedPlaceIdRef = useRef(null)
  const placeSelectionRequestIdRef = useRef(0)
  const isMountedRef = useRef(false)

  const [mapStatus, setMapStatus] = useState('loading')
  const [mapError, setMapError] = useState('')
  const [mapRetryKey, setMapRetryKey] = useState(0)
  const [locationStatus, setLocationStatus] = useState('loading')
  const [locationNotice, setLocationNotice] = useState('')
  const [currentPosition, setCurrentPosition] = useState(DEFAULT_MAP_CENTER)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [searchPlaces, setSearchPlaces] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const [popularPlaces, setPopularPlaces] = useState([])
  const [popularPlacesStatus, setPopularPlacesStatus] = useState('idle')
  const [popularPlacesError, setPopularPlacesError] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [openingPlaceId, setOpeningPlaceId] = useState(null)
  const [boardError, setBoardError] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false)

  const isPoiSearchActive = searchStatus !== 'idle'
  const knownPlaces = [...searchPlaces, ...popularPlaces]
  const selectedPlace = knownPlaces.find((place) => place.kakaoPlaceId === selectedPlaceId) ?? null
  const markerPlaces = useMemo(() => getMarkerPlaces({
    searchPlaces,
    isSearchActive: isPoiSearchActive,
    popularPlaces,
    selectedPlaceId,
  }), [isPoiSearchActive, popularPlaces, searchPlaces, selectedPlaceId])
  const bottomUiState = getMapBottomUiState({ hasSelectedPlace: Boolean(selectedPlace) })
  const isFloatingControlsPinnedToSelectedPanel = bottomUiState.selectedPanelControlsPlacement === 'selected-panel-edge'
  const floatingControlsBottom = isFloatingControlsPinnedToSelectedPanel
    ? MAP_SELECTED_PLACE_PANEL_CONTROLS_BOTTOM
    : getFloatingControlsBottom(isSheetOpen)
  const searchPanelNotice = searchNotice || `"${activeSearchQuery}" 검색 결과`
  const searchResultsPanelState = getSearchResultsPanelState({
    isOpen: isSearchResultsOpen,
    searchStatus,
    searchNotice,
    resultCount: searchPlaces.length,
  })
  const popularPlacesPanelNotice = locationNotice || '현재 위치 기준으로 흔적이 많은 공간을 보여드려요.'
  const clearMarkers = useCallback(() => {
    const kakao = kakaoRef.current
    markersRef.current.forEach(({ marker, element, handler }) => {
      if (element && handler) {
        element.removeEventListener('click', handler)
      } else if (kakao && handler) {
        kakao.maps.event.removeListener(marker, 'click', handler)
      }
      marker.setMap(null)
    })
    markersRef.current = []
  }, [])

  const clearCurrentLocationOverlay = useCallback(() => {
    currentLocationOverlayRef.current?.setMap(null)
    currentLocationOverlayRef.current = null
  }, [])

  const applyMapView = useCallback((viewPlan, { smooth = true } = {}) => {
    const kakao = kakaoRef.current
    const map = mapInstanceRef.current
    if (!kakao || !map || !viewPlan?.center) return

    if (Number.isFinite(viewPlan.level) && typeof map.setLevel === 'function') {
      const currentLevel = typeof map.getLevel === 'function' ? map.getLevel() : null
      if (currentLevel !== viewPlan.level) {
        map.setLevel(viewPlan.level)
      }
    }

    const center = new kakao.maps.LatLng(viewPlan.center.latitude, viewPlan.center.longitude)
    if (smooth && map.panTo) {
      map.panTo(center)
      return
    }
    map.setCenter(center)
  }, [])

  const applyMapViewportPlan = useCallback((viewPlan) => {
    const kakao = kakaoRef.current
    const map = mapInstanceRef.current
    if (!kakao || !map || !viewPlan || viewPlan.type === 'none') return

    if (viewPlan.type === 'single') {
      applyMapView({
        center: viewPlan.center,
        level: viewPlan.level,
      })
      return
    }

    if (viewPlan.type !== 'bounds' || !Array.isArray(viewPlan.points) || viewPlan.points.length === 0) return

    const bounds = new kakao.maps.LatLngBounds()
    viewPlan.points.forEach((point) => {
      bounds.extend(new kakao.maps.LatLng(point.latitude, point.longitude))
    })

    const padding = viewPlan.padding ?? {}
    if (typeof map.setBounds === 'function') {
      map.setBounds(
        bounds,
        padding.top ?? 0,
        padding.right ?? 0,
        padding.bottom ?? 0,
        padding.left ?? 0
      )
    }

    if (Number.isFinite(viewPlan.maxLevel) && typeof map.getLevel === 'function' && typeof map.setLevel === 'function') {
      const fittedLevel = map.getLevel()
      if (fittedLevel > viewPlan.maxLevel) {
        map.setLevel(viewPlan.maxLevel)
      }
    }
  }, [applyMapView])

  const focusMapOnPlace = useCallback((place) => {
    const latitude = Number(place?.latitude)
    const longitude = Number(place?.longitude)
    const map = mapInstanceRef.current
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !map) return

    const currentLevel = typeof map.getLevel === 'function' ? map.getLevel() : null
    applyMapView({
      center: { latitude, longitude },
      level: currentLevel > MAP_SELECTED_PLACE_LEVEL ? MAP_SELECTED_PLACE_LEVEL : null,
    })
  }, [applyMapView])

  const selectPlace = useCallback((kakaoPlaceId, { focusMap = false, closeSearchResults = false, scrollCard = true } = {}) => {
    const nextSelection = getPlaceSelectionTransitionState(kakaoPlaceId)
    const requestId = placeSelectionRequestIdRef.current + 1
    placeSelectionRequestIdRef.current = requestId

    setSelectedPlaceId(nextSelection.selectedPlaceId)
    setOpeningPlaceId(nextSelection.openingPlaceId)
    setBoardError(nextSelection.boardError)

    if (closeSearchResults) {
      setIsSearchResultsOpen(false)
    }

    if (focusMap) {
      focusMapOnPlace(placeLookupRef.current.get(kakaoPlaceId))
    }

    window.setTimeout(() => {
      if (!isMountedRef.current || placeSelectionRequestIdRef.current !== requestId) return

      setSelectedPlaceId(nextSelection.nextSelectedPlaceId)

      if (!scrollCard || !nextSelection.nextSelectedPlaceId) return

      cardRefs.current[nextSelection.nextSelectedPlaceId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }, 0)
  }, [focusMapOnPlace])

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
    } catch {
      if (!isMountedRef.current) return

      setCurrentPosition({
        latitude: null,
        longitude: null,
        label: '현재 위치 필요',
      })
      setLocationStatus('error')
      setLocationNotice(LOCATION_REQUIRED_MESSAGE)
    }
  }, [])

  const loadPopularPlaces = useCallback(async () => {
    if (locationStatus === 'loading') return
    if (locationStatus !== 'success') {
      setPopularPlaces([])
      setPopularPlacesStatus('error')
      setPopularPlacesError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const request = buildPopularPlaceRequest({
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
    })

    if (!request) {
      setPopularPlaces([])
      setPopularPlacesStatus('error')
      setPopularPlacesError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const requestId = popularPlacesRequestIdRef.current + 1
    popularPlacesRequestIdRef.current = requestId
    setPopularPlacesStatus('loading')
    setPopularPlacesError('')

    try {
      const response = await fetchPopularPlaces(request)
      if (!isMountedRef.current || popularPlacesRequestIdRef.current !== requestId) return

      setPopularPlaces(normalizePopularPlaces(response, currentPosition, NEARBY_LIMIT))
      setPopularPlacesStatus('success')
    } catch {
      if (!isMountedRef.current || popularPlacesRequestIdRef.current !== requestId) return

      setPopularPlaces([])
      setPopularPlacesStatus('error')
      setPopularPlacesError('주변 인기 공간을 불러오지 못했어요.')
    }
  }, [currentPosition, locationStatus])

  const runPoiSearch = useCallback(async ({ query = searchInput } = {}) => {
    const trimmedQuery = String(query ?? '').trim()
    if (!trimmedQuery) {
      poiSearchRequestIdRef.current += 1
      setActiveSearchQuery('')
      setSearchPlaces([])
      setSearchStatus('idle')
      setSearchNotice('검색어를 입력해 주세요.')
      setSearchError('')
      setSelectedPlaceId(null)
      setOpeningPlaceId(null)
      setBoardError('')
      setIsSearchResultsOpen(true)
      return
    }

    setActiveSearchQuery(trimmedQuery)
    setSearchInput(trimmedQuery)
    setSearchPlaces([])
    setSelectedPlaceId(null)
    setOpeningPlaceId(null)
    setBoardError('')
    setIsSearchResultsOpen(true)
    setIsSheetOpen(false)

    const request = buildPoiSearchRequest({
      query: trimmedQuery,
    })

    if (!request) {
      setSearchPlaces([])
      setSearchStatus('error')
      setSearchError('검색어를 입력한 뒤 다시 검색해 주세요.')
      setSearchNotice('')
      return
    }

    const requestId = poiSearchRequestIdRef.current + 1
    poiSearchRequestIdRef.current = requestId
    setSearchStatus('loading')
    setSearchError('')
    setSearchNotice('')

    try {
      const response = await fetchPoiPlaces(request)
      if (!isMountedRef.current || poiSearchRequestIdRef.current !== requestId) return

      const normalizedPlaces = normalizeSearchPlaces(response, currentPosition, trimmedQuery, NEARBY_LIMIT)
      setSearchPlaces(normalizedPlaces)
      setSearchStatus('success')
    } catch {
      if (!isMountedRef.current || poiSearchRequestIdRef.current !== requestId) return

      setSearchPlaces([])
      setSearchStatus('error')
      setSearchError('장소 검색을 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
    }
  }, [currentPosition, searchInput])

  const clearPoiSearch = useCallback(() => {
    poiSearchRequestIdRef.current += 1
    placeSelectionRequestIdRef.current += 1
    setSearchInput('')
    setActiveSearchQuery('')
    setSearchPlaces([])
    setSearchStatus('idle')
    setSearchError('')
    setSearchNotice('')
    setIsSearchResultsOpen(false)
    setSelectedPlaceId(null)
    setOpeningPlaceId(null)
    setBoardError('')
  }, [])

  const handleSearchInputChange = (event) => {
    const nextValue = event.target.value
    const trimmedValue = nextValue.trim()

    if (!trimmedValue) {
      clearPoiSearch()
      return
    }

    setSearchInput(nextValue)
    if (searchNotice) setSearchNotice('')

    if (activeSearchQuery && trimmedValue !== activeSearchQuery) {
      poiSearchRequestIdRef.current += 1
      setActiveSearchQuery('')
      setSearchPlaces([])
      setSearchStatus('idle')
      setSearchError('')
      setIsSearchResultsOpen(false)
      setSelectedPlaceId(null)
      setOpeningPlaceId(null)
      setBoardError('')
    }
  }

  const handleSearchResultSelect = (place) => {
    if (!place?.kakaoPlaceId) return

    selectPlace(place.kakaoPlaceId, {
      focusMap: true,
      closeSearchResults: true,
      scrollCard: false,
    })
  }

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
          level: MAP_CURRENT_LOCATION_LEVEL,
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
      clearCurrentLocationOverlay()
      mapInstanceRef.current = null
    }
  }, [clearCurrentLocationOverlay, clearMarkers, mapRetryKey])

  useEffect(() => {
    if (mapStatus !== 'ready') return
    const viewPlan = getCurrentLocationViewPlan(currentPosition)
    if (!viewPlan) return

    applyMapView(viewPlan)
  }, [applyMapView, currentPosition, mapStatus])

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !kakaoRef.current) return
    if (currentPosition.latitude === null || currentPosition.longitude === null) return

    const kakao = kakaoRef.current
    const position = new kakao.maps.LatLng(currentPosition.latitude, currentPosition.longitude)
    const title = getCurrentPositionMarkerTitle(locationStatus)

    clearCurrentLocationOverlay()
    currentLocationOverlayRef.current = new kakao.maps.CustomOverlay({
      map: mapInstanceRef.current,
      position,
      content: createCurrentLocationMarkerElement(title),
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 50,
    })

    return clearCurrentLocationOverlay
  }, [clearCurrentLocationOverlay, currentPosition, locationStatus, mapStatus])

  useEffect(() => {
    const nextLookup = new globalThis.Map()
    ;[...searchPlaces, ...popularPlaces].forEach((place) => {
      if (place?.kakaoPlaceId) {
        nextLookup.set(place.kakaoPlaceId, place)
      }
    })
    placeLookupRef.current = nextLookup
  }, [popularPlaces, searchPlaces])

  useEffect(() => {
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        loadPopularPlaces()
      }
    })
  }, [loadPopularPlaces])

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !kakaoRef.current) return

    const kakao = kakaoRef.current
    const map = mapInstanceRef.current

    clearMarkers()

    markerPlaces.forEach((place) => {
      if (place.latitude === null || place.longitude === null) return

      const position = new kakao.maps.LatLng(place.latitude, place.longitude)
      const markerElement = createPlaceMarkerElement(place)
      const isSelected = place.kakaoPlaceId === selectedPlaceIdRef.current
      setPlaceMarkerElementSelected(markerElement, isSelected)
      const marker = new kakao.maps.CustomOverlay({
        map,
        position,
        content: markerElement,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: isSelected ? 40 : 10,
      })
      const handler = (event) => {
        event.stopPropagation()
        selectPlace(place.kakaoPlaceId, { focusMap: true, closeSearchResults: true })
      }

      markerElement.addEventListener('click', handler)
      markersRef.current.push({ marker, element: markerElement, handler, placeId: place.kakaoPlaceId })
    })

    return clearMarkers
  }, [clearMarkers, mapStatus, markerPlaces, selectPlace])

  useEffect(() => {
    selectedPlaceIdRef.current = selectedPlaceId
    markersRef.current.forEach(({ marker, element, placeId }) => {
      const isSelected = placeId === selectedPlaceId
      marker.setZIndex(isSelected ? 40 : 10)
      if (element) {
        setPlaceMarkerElementSelected(element, isSelected)
      }
    })
  }, [selectedPlaceId])

  useEffect(() => {
    if (mapStatus !== 'ready' || searchStatus !== 'success' || searchPlaces.length === 0) return

    applyMapViewportPlan(getMapViewportPlan(searchPlaces, currentPosition))
  }, [applyMapViewportPlan, currentPosition, mapStatus, searchPlaces, searchStatus])

  const handleOpenKakaoMap = () => {
    if (!selectedPlace?.kakaoMapUrl) return
    window.open(selectedPlace.kakaoMapUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenBoard = async (place) => {
    if (!place?.kakaoPlaceId) return

    setBoardError('')
    setOpeningPlaceId(place.kakaoPlaceId)
    focusMapOnPlace(place)

    try {
      if (place.boardId) {
        navigate(`/board/${place.boardId}`)
        return
      }

      const board = await fetchOrCreateBoardForPlace(place)
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

      <section className="absolute left-0 top-0 z-40 w-full px-5 pb-2 pt-3">
        <div className="mx-auto mb-3 flex w-[95px] items-center justify-center">
          <img src={mainLogo} alt="여기남김" className="w-[95px] object-contain" />
        </div>

        <form
          className="mb-2 flex min-h-12 items-center gap-2 rounded-[20px] border border-[#EDE4D8] bg-white/96 px-3 py-2 shadow-[0_5px_14px_rgba(61,36,21,0.08)] backdrop-blur-sm"
          onSubmit={(event) => {
            event.preventDefault()
            runPoiSearch()
          }}
        >
          <Search size={17} strokeWidth={1.8} className="shrink-0 text-[#7A6558]" />
          <input
            type="search"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder="장소를 검색해 보세요"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#2B1810] outline-none placeholder:text-[#9A8778]"
            aria-label="장소 검색어"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={clearPoiSearch}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F2EA] text-[#7A6558]"
              aria-label="검색어 지우기"
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={searchStatus === 'loading'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3D2415] text-white shadow-[0_5px_12px_rgba(61,36,21,0.2)] disabled:opacity-60"
            aria-label="장소 검색"
          >
            {searchStatus === 'loading' ? (
              <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
            ) : (
              <Search size={16} strokeWidth={1.9} />
            )}
          </button>
        </form>

        {searchResultsPanelState.shouldRender ? (
          <SearchResultsPanel
            title={searchPanelNotice}
            searchStatus={searchStatus}
            searchNotice={searchNotice}
            searchError={searchError}
            places={searchPlaces}
            selectedPlaceId={selectedPlaceId}
            onRetry={() => runPoiSearch({ query: activeSearchQuery || searchInput })}
            onSelectPlace={handleSearchResultSelect}
          />
        ) : null}
      </section>

      {bottomUiState.showFloatingControls ? (
        <FloatingMapControls
          bottom={floatingControlsBottom}
          locationStatus={locationStatus}
          canOpenKakaoMap={Boolean(selectedPlace?.kakaoMapUrl)}
          onCurrentLocation={requestCurrentLocation}
          onOpenKakaoMap={handleOpenKakaoMap}
          className={isFloatingControlsPinnedToSelectedPanel ? 'z-[55]' : ''}
        />
      ) : null}

      {bottomUiState.showSelectedPlacePanel ? (
        <SelectedPlacePanel
          place={selectedPlace}
          isOpening={selectedPlace.kakaoPlaceId === openingPlaceId}
          error={boardError}
          onClose={() => {
            setSelectedPlaceId(null)
            setBoardError('')
          }}
          onOpenBoard={() => handleOpenBoard(selectedPlace)}
        />
      ) : null}

      {bottomUiState.showBottomSheet ? (
        <section
          className={`absolute left-2 right-2 z-20 overflow-hidden rounded-t-[24px] bg-white px-5 pb-4 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] ${MAP_BOTTOM_SHEET_TRANSITION_CLASSES}`}
          style={{
            bottom: `${MAP_BOTTOM_SHEET_BOTTOM_OFFSET_PX}px`,
            height: MAP_BOTTOM_SHEET_HEIGHT,
            transform: getBottomSheetTransform(isSheetOpen),
          }}
        >
          <button
            type="button"
            className="flex h-14 w-full items-center justify-between bg-transparent text-left"
            onClick={() => setIsSheetOpen((prev) => !prev)}
            aria-expanded={isSheetOpen}
            aria-label={getBottomSheetToggleLabel(isSheetOpen)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="h-1 w-12 shrink-0 rounded-full bg-[#DDD3C6]" />
              <span className="truncate text-[18px] font-bold text-[#2B1810]">주변 인기 공간</span>
            </span>
            {isSheetOpen ? (
              <ChevronDown size={18} strokeWidth={1.8} className="shrink-0 text-[#5A4030]" />
            ) : (
              <ChevronUp size={18} strokeWidth={1.8} className="shrink-0 text-[#5A4030]" />
            )}
          </button>

          <div className={getBottomSheetContentClasses(isSheetOpen)} aria-hidden={!isSheetOpen} inert={!isSheetOpen}>
              <div className="mb-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#7A6558]">
                    {popularPlacesPanelNotice}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadPopularPlaces}
                  disabled={popularPlacesStatus === 'loading'}
                  className="ml-3 flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#5A4030] disabled:opacity-60"
                >
                  <RefreshCw size={13} strokeWidth={1.8} className={popularPlacesStatus === 'loading' ? 'animate-spin' : ''} />
                  갱신
                </button>
              </div>

              {boardError ? <p className="mb-2 text-[12px] font-medium text-[#A74831]">{boardError}</p> : null}

              <div className={MAP_PLACE_LIST_SCROLL_CLASSES}>
                {popularPlacesStatus === 'idle' ? (
                  <PlacesPanelState
                    message={locationStatus === 'error'
                      ? '현재 위치를 확인해야 주변 인기 공간을 볼 수 있어요.'
                      : '현재 위치를 확인하면 주변 인기 공간을 보여드려요.'}
                    actionLabel={locationStatus === 'error' ? '위치 다시 확인' : undefined}
                    onAction={locationStatus === 'error' ? requestCurrentLocation : undefined}
                  />
                ) : null}
                {popularPlacesStatus === 'loading' ? <PlaceLoadingCards /> : null}
                {popularPlacesStatus === 'error' ? (
                  <PlacesPanelState
                    message={popularPlacesError}
                    actionLabel={locationStatus === 'success' ? '다시 불러오기' : '위치 다시 확인'}
                    onAction={locationStatus === 'success' ? loadPopularPlaces : requestCurrentLocation}
                  />
                ) : null}
                {popularPlacesStatus === 'success' && popularPlaces.length === 0 ? (
                  <PlacesPanelState message="근처에 보여줄 장소가 아직 없어요." actionLabel="다시 찾기" onAction={loadPopularPlaces} />
                ) : null}
                {popularPlacesStatus === 'success'
                  ? popularPlaces.map((place) => (
                    <PlaceCard
                      key={place.kakaoPlaceId}
                      refCallback={(node) => {
                        if (node) cardRefs.current[place.kakaoPlaceId] = node
                      }}
                      place={place}
                      isSelected={place.kakaoPlaceId === selectedPlaceId}
                      isOpening={place.kakaoPlaceId === openingPlaceId}
                      onSelect={() => selectPlace(place.kakaoPlaceId, { focusMap: true })}
                    />
                  ))
                  : null}
              </div>
          </div>
        </section>
      ) : null}
    </main>
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
          {place.address || place.phone || '주소 정보가 없어요.'}
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

function SelectedPlacePanel({
  place,
  isOpening,
  error,
  onClose,
  onOpenBoard,
}) {
  const rows = getPlaceInfoRows(place)
  const meta = getPlaceCategoryMeta(place.categoryKey)
  const PlaceIcon = CATEGORY_ICON_COMPONENTS[meta.iconName] ?? MapPinned

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

        <div className="flex shrink-0 items-center">
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

function MapOverlay({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F1ECE4]/92 px-8 text-center text-[#3D2415]">
      {children}
    </div>
  )
}

function createPlaceMarkerElement(place) {
  const categoryKey = place.categoryKey ?? 'default'
  const meta = getPlaceCategoryMeta(categoryKey)
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.title = place.placeName
  marker.dataset.categoryKey = categoryKey
  marker.setAttribute('aria-label', `${place.placeName} 선택`)
  marker.style.width = '38px'
  marker.style.height = '44px'
  marker.style.padding = '0'
  marker.style.border = '0'
  marker.style.background = 'transparent'
  marker.style.cursor = 'pointer'
  marker.style.display = 'flex'
  marker.style.flexDirection = 'column'
  marker.style.alignItems = 'center'
  marker.style.justifyContent = 'flex-start'
  marker.style.lineHeight = '0'
  marker.style.transformOrigin = '50% 100%'
  marker.style.transition = 'transform 180ms ease, filter 180ms ease'

  const shell = document.createElement('span')
  shell.dataset.markerShell = 'true'
  shell.style.width = '32px'
  shell.style.height = '32px'
  shell.style.borderRadius = '13px'
  shell.style.background = meta.backgroundColor
  shell.style.display = 'flex'
  shell.style.alignItems = 'center'
  shell.style.justifyContent = 'center'
  shell.style.position = 'relative'
  shell.style.zIndex = '1'

  const icon = createPlaceMarkerIconElement(meta.iconName, meta.markerColor)

  const tail = document.createElement('span')
  tail.dataset.markerTail = 'true'
  tail.style.width = '11px'
  tail.style.height = '11px'
  tail.style.marginTop = '-5px'
  tail.style.background = meta.backgroundColor
  tail.style.transform = 'rotate(45deg)'

  shell.appendChild(icon)
  marker.appendChild(shell)
  marker.appendChild(tail)
  setPlaceMarkerElementSelected(marker, false)

  return marker
}

function createPlaceMarkerIconElement(iconName, color) {
  const svgNamespace = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNamespace, 'svg')
  svg.dataset.markerIcon = 'true'
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', color)
  svg.setAttribute('stroke-width', '1.8')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.width = '17px'
  svg.style.height = '17px'
  svg.style.display = 'block'
  svg.style.transition = 'width 180ms ease, height 180ms ease, stroke-width 180ms ease'

  const paths = PLACE_MARKER_ICON_PATHS[iconName] ?? PLACE_MARKER_ICON_PATHS.mapPinned
  paths.forEach((pathData) => {
    const path = document.createElementNS(svgNamespace, 'path')
    path.setAttribute('d', pathData)
    svg.appendChild(path)
  })

  return svg
}

function setPlaceMarkerElementSelected(marker, isSelected) {
  const meta = getPlaceCategoryMeta(marker.dataset.categoryKey)
  const shell = marker.querySelector('[data-marker-shell]')
  const icon = marker.querySelector('[data-marker-icon]')
  const tail = marker.querySelector('[data-marker-tail]')
  const borderColor = isSelected ? meta.selectedBorderColor : meta.borderColor
  const borderWidth = isSelected ? '2px' : '1.5px'

  marker.setAttribute('aria-pressed', String(isSelected))
  marker.style.transform = isSelected ? 'scale(1.16)' : 'scale(1)'
  marker.style.filter = isSelected ? `drop-shadow(0 10px 14px ${meta.shadowColor})` : 'none'

  if (shell) {
    shell.style.border = `${borderWidth} solid ${borderColor}`
    shell.style.boxShadow = isSelected
      ? `0 8px 18px ${meta.shadowColor}`
      : `0 5px 12px ${meta.shadowColor}`
  }

  if (icon) {
    icon.setAttribute('stroke', meta.markerColor)
    icon.setAttribute('stroke-width', isSelected ? '2.1' : '1.8')
    icon.style.width = isSelected ? '19px' : '17px'
    icon.style.height = isSelected ? '19px' : '17px'
  }

  if (tail) {
    tail.style.borderRight = `${borderWidth} solid ${borderColor}`
    tail.style.borderBottom = `${borderWidth} solid ${borderColor}`
  }
}

function createCurrentLocationMarkerElement(title) {
  const marker = document.createElement('div')
  marker.title = title
  marker.setAttribute('aria-label', title)
  marker.style.width = '28px'
  marker.style.height = '28px'
  marker.style.borderRadius = '9999px'
  marker.style.background = 'rgba(37, 99, 235, 0.16)'
  marker.style.border = '1px solid rgba(37, 99, 235, 0.28)'
  marker.style.display = 'flex'
  marker.style.alignItems = 'center'
  marker.style.justifyContent = 'center'
  marker.style.boxShadow = '0 6px 14px rgba(37, 99, 235, 0.24)'

  const dot = document.createElement('span')
  dot.style.width = '13px'
  dot.style.height = '13px'
  dot.style.borderRadius = '9999px'
  dot.style.background = '#2563EB'
  dot.style.border = '3px solid #FFFFFF'
  dot.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.24)'
  marker.appendChild(dot)

  return marker
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

  if (message.includes('timed out') || message.includes('did not initialize')) {
    return 'Kakao Map을 초기화하지 못했어요. JavaScript Key와 등록 도메인을 확인해주세요.'
  }

  return 'Kakao Map SDK를 불러오지 못했어요.'
}

export default MapPage
