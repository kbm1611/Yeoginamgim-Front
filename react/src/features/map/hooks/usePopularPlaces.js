import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../api/errors'
import { fetchPopularPlaces } from '../../../api/places'
import {
  buildPopularPlaceRequest,
  NEARBY_LIMIT,
  normalizePopularPlaces,
} from '../../../pages/Map.utils'
import { LOCATION_REQUIRED_MESSAGE } from './useCurrentLocation'

export function usePopularPlaces({
  currentPosition,
  locationStatus,
  onUnauthorized,
} = {}) {
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(false)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const loadPopularPlaces = useCallback(async ({ origin = null } = {}) => {
    const lookupOrigin = origin ?? currentPosition
    if (!origin && locationStatus === 'loading') return
    if (!origin && locationStatus !== 'success') {
      setPlaces([])
      setStatus('error')
      setError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const request = buildPopularPlaceRequest({
      latitude: lookupOrigin.latitude,
      longitude: lookupOrigin.longitude,
    })

    if (!request) {
      setPlaces([])
      setStatus('error')
      setError(LOCATION_REQUIRED_MESSAGE)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    if (origin) {
      setPlaces([])
    }
    setStatus('loading')
    setError('')

    try {
      const response = await fetchPopularPlaces(request)
      if (!isMountedRef.current || requestIdRef.current !== requestId) return

      setPlaces(normalizePopularPlaces(response, lookupOrigin, NEARBY_LIMIT))
      setStatus('success')
    } catch (apiError) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return
      if (onUnauthorized?.(apiError)) return

      setPlaces([])
      setStatus('error')
      setError(getApiErrorMessage(apiError, {
        fallback: '실시간 주변 인기 공간을 불러오지 못했어요.',
        statusMessages: {
          403: '인기 공간을 조회할 권한이 없습니다.',
          404: '주변에 보여줄 인기 공간을 찾지 못했어요.',
          500: '실시간 주변 인기 공간을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.',
        },
      }))
    }
  }, [currentPosition, locationStatus, onUnauthorized])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        loadPopularPlaces()
      }
    })
  }, [loadPopularPlaces])

  return {
    popularPlaces: places,
    popularPlacesStatus: status,
    popularPlacesError: error,
    loadPopularPlaces,
    setPopularPlaces: setPlaces,
  }
}
