import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../api/client'
import { handleUnauthorizedApiError as handleApiUnauthorizedError } from '../api/errors'
import mainLogo from '../assets/logo/image_12-removebg-preview.png'
import NotificationButton from '../components/NotificationButton'
import CategoryFilter from '../features/map/components/CategoryFilter'
import FloatingMapControls from '../features/map/components/FloatingMapControls'
import MapOverlay from '../features/map/components/MapOverlay'
import PopularPlacesPanel from '../features/map/components/PopularPlacesPanel'
import SearchPanel from '../features/map/components/SearchPanel'
import SelectedPlaceCard from '../features/map/components/SelectedPlaceCard'
import { LOCATION_REQUIRED_MESSAGE, useCurrentLocation } from '../features/map/hooks/useCurrentLocation'
import { useEnterBoard } from '../features/map/hooks/useEnterBoard'
import { useFavoritePlaces } from '../features/map/hooks/useFavoritePlaces'
import { useKakaoMap } from '../features/map/hooks/useKakaoMap'
import { useNearbyPlaces } from '../features/map/hooks/useNearbyPlaces'
import { usePlaceSearch } from '../features/map/hooks/usePlaceSearch'
import { usePopularPlaces } from '../features/map/hooks/usePopularPlaces'
import {
  MAP_SELECTED_PLACE_PANEL_CONTROLS_BOTTOM,
  getCategoryToggleState,
  getFloatingControlsBottom,
  getMapBottomUiState,
  getMapViewportPlan,
  getMarkerPlaces,
  getPlaceSelectionTransitionState,
  getSearchResultsPanelState,
} from '../utils/pages/Map.utils'

function MapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mapElementRef = useRef(null)
  const cardRefs = useRef({})
  const placeSelectionRequestIdRef = useRef(0)
  const selectPlaceRef = useRef(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleUnauthorizedApiError = useCallback((error) => {
    return handleApiUnauthorizedError(error, {
      clearToken: clearAuthToken,
      navigate,
      location,
      redirect: true,
    })
  }, [location, navigate])

  const {
    currentPosition,
    locationStatus,
    locationNotice,
    requestCurrentLocation,
  } = useCurrentLocation()

  const search = usePlaceSearch({
    currentPosition,
    locationStatus,
    onUnauthorized: handleUnauthorizedApiError,
  })
  const isPoiSearchActive = search.searchStatus !== 'idle'
  const isPoiSearchLoading = search.searchStatus === 'loading'

  const {
    categoryPlaces,
    categoryPlacesStatus,
    categoryPlacesError,
    resetCategoryPlaces,
  } = useNearbyPlaces({
    currentPosition,
    locationStatus,
    selectedCategory,
    isSearchActive: isPoiSearchActive,
    onUnauthorized: handleUnauthorizedApiError,
  })

  const {
    popularPlaces,
    popularPlacesStatus,
    popularPlacesError,
    loadPopularPlaces,
    setPopularPlaces,
  } = usePopularPlaces({
    currentPosition,
    locationStatus,
    onUnauthorized: handleUnauthorizedApiError,
  })

  const favoritePlaces = useFavoritePlaces({
    onUnauthorized: handleUnauthorizedApiError,
  })

  const knownPlaces = useMemo(
    () => [...search.searchPlaces, ...categoryPlaces, ...popularPlaces],
    [categoryPlaces, popularPlaces, search.searchPlaces]
  )
  const placeLookup = useMemo(() => {
    const nextLookup = new globalThis.Map()
    knownPlaces.forEach((place) => {
      if (place?.kakaoPlaceId) {
        nextLookup.set(place.kakaoPlaceId, place)
      }
    })
    return nextLookup
  }, [knownPlaces])
  const selectedPlace = knownPlaces.find((place) => place.kakaoPlaceId === selectedPlaceId) ?? null
  const isSelectedPlaceFavorite = selectedPlace
    ? favoritePlaces.favoritePlaceIds.has(selectedPlace.kakaoPlaceId)
    : false
  const markerPlaces = useMemo(() => getMarkerPlaces({
    searchPlaces: search.searchPlaces,
    isSearchActive: isPoiSearchActive,
    categoryPlaces,
    popularPlaces,
    selectedCategory,
    selectedPlaceId,
    focusedSearchPlaceId: search.focusedSearchPlaceId,
  }), [
    categoryPlaces,
    isPoiSearchActive,
    popularPlaces,
    search.focusedSearchPlaceId,
    search.searchPlaces,
    selectedCategory,
    selectedPlaceId,
  ])

  const handleMarkerSelect = useCallback((...args) => {
    selectPlaceRef.current?.(...args)
  }, [])

  const {
    mapStatus,
    mapError,
    retryMap,
    applyMapViewportPlan,
    focusMapOnPlace,
  } = useKakaoMap({
    mapElementRef,
    currentPosition,
    locationStatus,
    markerPlaces,
    selectedPlaceId,
    onSelectPlace: handleMarkerSelect,
  })

  const board = useEnterBoard({
    navigate,
    onUnauthorized: handleUnauthorizedApiError,
    onFocusPlace: focusMapOnPlace,
  })

  const selectPlace = useCallback((kakaoPlaceId, {
    focusMap = false,
    closeSearchResults = false,
    scrollCard = true,
  } = {}) => {
    const nextSelection = getPlaceSelectionTransitionState(kakaoPlaceId)
    const requestId = placeSelectionRequestIdRef.current + 1
    placeSelectionRequestIdRef.current = requestId

    setSelectedPlaceId(nextSelection.selectedPlaceId)
    board.resetBoardError()
    favoritePlaces.resetFavoriteError()

    if (closeSearchResults) {
      search.setIsSearchResultsOpen(false)
    }

    if (focusMap) {
      focusMapOnPlace(placeLookup.get(kakaoPlaceId))
    }

    window.setTimeout(() => {
      if (placeSelectionRequestIdRef.current !== requestId) return

      setSelectedPlaceId(nextSelection.nextSelectedPlaceId)

      if (!scrollCard || !nextSelection.nextSelectedPlaceId) return

      cardRefs.current[nextSelection.nextSelectedPlaceId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }, 0)
  }, [board, favoritePlaces, focusMapOnPlace, placeLookup, search])

  useEffect(() => {
    selectPlaceRef.current = selectPlace
  }, [selectPlace])

  useEffect(() => {
    if (mapStatus !== 'ready' || search.searchStatus !== 'success' || search.searchPlaces.length === 0) return

    applyMapViewportPlan(getMapViewportPlan(search.searchPlaces, currentPosition))
  }, [applyMapViewportPlan, currentPosition, mapStatus, search.searchPlaces, search.searchStatus])

  useEffect(() => {
    if (mapStatus !== 'ready' || isPoiSearchActive || categoryPlacesStatus !== 'success' || categoryPlaces.length === 0) return

    applyMapViewportPlan(getMapViewportPlan(categoryPlaces, currentPosition))
  }, [applyMapViewportPlan, categoryPlaces, categoryPlacesStatus, currentPosition, isPoiSearchActive, mapStatus])

  const handleSearchInputChange = (event) => {
    const trimmedValue = event.target.value.trim()

    if (!trimmedValue) {
      handleClearSearch()
      return
    }

    search.handleSearchInputChange(event)

    if (search.activeSearchQuery && trimmedValue !== search.activeSearchQuery) {
      setSelectedPlaceId(null)
      board.resetBoardError()
      favoritePlaces.resetFavoriteError()
    }
  }

  const handleRunSearch = () => {
    setSelectedPlaceId(null)
    board.resetBoardError()
    favoritePlaces.resetFavoriteError()
    setIsSheetOpen(false)
    search.runPoiSearch()
  }

  const handleClearSearch = () => {
    placeSelectionRequestIdRef.current += 1
    search.clearPoiSearch()
    setSelectedPlaceId(null)
    board.resetBoardError()
    favoritePlaces.resetFavoriteError()
    window.queueMicrotask(() => {
      loadPopularPlaces()
    })
  }

  const handleSearchResultSelect = (place) => {
    if (!place?.kakaoPlaceId) return

    setSelectedCategory(null)
    resetCategoryPlaces()
    setPopularPlaces([])
    search.setFocusedSearchPlaceId(place.kakaoPlaceId)
    loadPopularPlaces({ origin: place })

    selectPlace(place.kakaoPlaceId, {
      focusMap: true,
      closeSearchResults: true,
      scrollCard: false,
    })
  }

  const handleCategorySelect = (categoryLabel) => {
    if (isPoiSearchLoading) return
    if (isPoiSearchActive || search.activeSearchQuery || search.searchInput) {
      search.clearPoiSearch()
    }

    const nextState = getCategoryToggleState(selectedCategory, categoryLabel)
    setSelectedCategory(nextState.selectedCategory)
    resetCategoryPlaces(nextState.categoryPlacesStatus)
    setSelectedPlaceId(nextState.selectedPlaceId)
    board.resetBoardError()
    favoritePlaces.resetFavoriteError()
    search.setIsSearchResultsOpen(false)
  }

  const handleOpenKakaoMap = () => {
    if (!selectedPlace?.kakaoMapUrl) return
    window.open(selectedPlace.kakaoMapUrl, '_blank', 'noopener,noreferrer')
  }

  const handleToggleFavorite = (place) => {
    if (!place?.kakaoPlaceId) return

    selectPlace(place.kakaoPlaceId, { focusMap: true })
    favoritePlaces.toggleFavoritePlace(place)
  }

  const bottomUiState = getMapBottomUiState({ hasSelectedPlace: Boolean(selectedPlace) })
  const isFloatingControlsPinnedToSelectedPanel = bottomUiState.selectedPanelControlsPlacement === 'selected-panel-edge'
  const floatingControlsBottom = isFloatingControlsPinnedToSelectedPanel
    ? MAP_SELECTED_PLACE_PANEL_CONTROLS_BOTTOM
    : getFloatingControlsBottom(isSheetOpen)
  const searchPanelNotice = search.searchNotice || `"${search.activeSearchQuery}" 검색 결과`
  const searchResultsPanelState = getSearchResultsPanelState({
    isOpen: search.isSearchResultsOpen,
    searchStatus: search.searchStatus,
    searchNotice: search.searchNotice,
    resultCount: search.searchPlaces.length,
  })
  const popularPlacesPanelNotice = locationNotice || '현재 위치 기준으로 흔적이 많은 공간을 보여드려요.'

  return (
    <main
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
              onClick={retryMap}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D2415] px-4 py-2 text-[12px] font-semibold text-white"
            >
              <RefreshCw size={13} />
              다시 시도
            </button>
          </MapOverlay>
        ) : null}
      </section>

      <section className="absolute left-0 top-0 z-40 w-full px-5 pb-2 pt-3">
        <div className="mb-3 grid grid-cols-[40px_1fr_40px] items-center">
          <span aria-hidden="true" />
          <img src={mainLogo} alt="여기남김" className="w-[95px] justify-self-center object-contain" />
          <NotificationButton className="justify-self-end" />
        </div>

        <SearchPanel
          input={search.searchInput}
          title={searchPanelNotice}
          status={search.searchStatus}
          notice={search.searchNotice}
          error={search.searchError}
          places={search.searchPlaces}
          selectedPlaceId={selectedPlaceId}
          shouldRenderResults={searchResultsPanelState.shouldRender}
          onInputChange={handleSearchInputChange}
          onSubmit={handleRunSearch}
          onClear={handleClearSearch}
          onRetry={() => search.runPoiSearch({ query: search.activeSearchQuery || search.searchInput })}
          onSelectPlace={handleSearchResultSelect}
        />

        <CategoryFilter
          selectedCategory={selectedCategory}
          disabled={isPoiSearchLoading}
          status={categoryPlacesStatus}
          error={categoryPlacesError}
          isEmpty={categoryPlaces.length === 0}
          onSelect={handleCategorySelect}
        />
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
        <SelectedPlaceCard
          place={selectedPlace}
          isOpening={selectedPlace.kakaoPlaceId === board.openingPlaceId}
          isFavorite={isSelectedPlaceFavorite}
          isFavoriteLoading={selectedPlace.kakaoPlaceId === favoritePlaces.favoritePlaceIdInProgress}
          error={board.boardError}
          favoriteError={favoritePlaces.favoriteError}
          onClose={() => {
            setSelectedPlaceId(null)
            board.resetBoardError()
            favoritePlaces.resetFavoriteError()
          }}
          onToggleFavorite={() => handleToggleFavorite(selectedPlace)}
          onOpenBoard={() => board.enterBoard(selectedPlace)}
        />
      ) : null}

      {bottomUiState.showBottomSheet ? (
        <PopularPlacesPanel
          isOpen={isSheetOpen}
          locationStatus={locationStatus}
          notice={popularPlacesPanelNotice}
          boardError={board.boardError}
          places={popularPlaces}
          status={popularPlacesStatus}
          error={popularPlacesError || LOCATION_REQUIRED_MESSAGE}
          selectedPlaceId={selectedPlaceId}
          openingPlaceId={board.openingPlaceId}
          cardRefs={cardRefs}
          onToggleOpen={() => setIsSheetOpen((prev) => !prev)}
          onRetryLocation={requestCurrentLocation}
          onRetryPlaces={loadPopularPlaces}
          onSelectPlace={(place) => selectPlace(place.kakaoPlaceId, { focusMap: true })}
        />
      ) : null}
    </main>
  )
}

export default MapPage
