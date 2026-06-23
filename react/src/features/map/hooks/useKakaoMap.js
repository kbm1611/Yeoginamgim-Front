import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureKakaoMaps } from '../../../api/kakaoMaps'
import {
  DEFAULT_MAP_CENTER,
  MAP_CURRENT_LOCATION_LEVEL,
  MAP_SELECTED_PLACE_LEVEL,
  PLACE_MARKER_ICON_PATHS,
  getCurrentLocationViewPlan,
  getCurrentPositionMarkerTitle,
  getPlaceCategoryMeta,
} from '../../../utils/pages/Map.utils'

export function useKakaoMap({
  mapElementRef,
  currentPosition,
  locationStatus,
  markerPlaces,
  selectedPlaceId,
  onSelectPlace,
} = {}) {
  const kakaoRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const currentLocationOverlayRef = useRef(null)
  const selectedPlaceIdRef = useRef(null)
  const [mapStatus, setMapStatus] = useState('loading')
  const [mapError, setMapError] = useState('')
  const [mapRetryKey, setMapRetryKey] = useState(0)

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

  const retryMap = useCallback(() => {
    setMapStatus('loading')
    setMapError('')
    setMapRetryKey((value) => value + 1)
  }, [])

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
  }, [clearCurrentLocationOverlay, clearMarkers, mapElementRef, mapRetryKey])

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
        onSelectPlace?.(place.kakaoPlaceId, { focusMap: true, closeSearchResults: true })
      }

      markerElement.addEventListener('click', handler)
      markersRef.current.push({ marker, element: markerElement, handler, placeId: place.kakaoPlaceId })
    })

    return clearMarkers
  }, [clearMarkers, mapStatus, markerPlaces, onSelectPlace])

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

  return {
    mapStatus,
    mapError,
    retryMap,
    applyMapViewportPlan,
    focusMapOnPlace,
  }
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

function getMapErrorMessage(error) {
  const message = String(error?.message ?? '')
  if (message.includes('VITE_KAKAO_JAVASCRIPT_KEY')) {
    return 'Kakao JavaScript Key가 설정되지 않았어요.'
  }

  if (message.includes('timed out') || message.includes('did not initialize')) {
    return 'Kakao Map을 초기화하지 못했어요. JavaScript Key와 등록 도메인을 확인해 주세요.'
  }

  return 'Kakao Map SDK를 불러오지 못했어요.'
}
