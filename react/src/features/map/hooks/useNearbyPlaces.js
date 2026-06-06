import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../api/errors'
import { fetchNearbyPlaces } from '../../../api/places'
import {
  buildNearbyPlaceRequests,
  NEARBY_LIMIT,
  normalizePlaces,
} from '../../../pages/Map.utils'
import { LOCATION_REQUIRED_MESSAGE } from './useCurrentLocation'

export function useNearbyPlaces({
  currentPosition,
  locationStatus,
  selectedCategory,
  isSearchActive = false,
  onUnauthorized,
} = {}) {
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(false)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const reset = useCallback((nextStatus = 'idle') => {
    requestIdRef.current += 1
    setPlaces([])
    setStatus(nextStatus)
    setError('')
  }, [])

  const loadPlaces = useCallback(async () => {
    if (isSearchActive) return

    if (!selectedCategory) {
      setPlaces([])
      setStatus('idle')
      setError('')
      return
    }

    if (locationStatus === 'loading') return

    if (locationStatus !== 'success') {
      setPlaces([])
      setStatus('error')
      setError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const requests = buildNearbyPlaceRequests({
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
      selectedCategory,
    })

    if (requests.length === 0) {
      setPlaces([])
      setStatus('error')
      setError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus('loading')
    setError('')

    try {
      const responses = await Promise.all(
        requests.map(async (request) => ({
          requestCategory: request.category,
          places: await fetchNearbyPlaces(request),
        }))
      )
      if (!isMountedRef.current || requestIdRef.current !== requestId) return

      setPlaces(normalizePlaces(responses, currentPosition, NEARBY_LIMIT))
      setStatus('success')
    } catch (apiError) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return
      if (onUnauthorized?.(apiError)) return

      setPlaces([])
      setStatus('error')
      setError(getApiErrorMessage(apiError, {
        fallback: '주변 장소를 불러오지 못했어요.',
        statusMessages: {
          403: '주변 장소를 조회할 권한이 없습니다.',
          404: '주변에 보여줄 장소를 찾지 못했어요.',
          500: '주변 장소를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.',
        },
      }))
    }
  }, [currentPosition, isSearchActive, locationStatus, onUnauthorized, selectedCategory])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        loadPlaces()
      }
    })
  }, [loadPlaces])

  return {
    categoryPlaces: places,
    categoryPlacesStatus: status,
    categoryPlacesError: error,
    loadCategoryPlaces: loadPlaces,
    resetCategoryPlaces: reset,
  }
}
