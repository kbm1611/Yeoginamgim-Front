import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MAP_CENTER } from '../../../utils/pages/Map.utils'

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000,
  timeout: 8000,
}

export const LOCATION_REQUIRED_MESSAGE = '현재 위치를 확인해야 주변 장소를 보여줄 수 있어요.'

export function useCurrentLocation() {
  const isMountedRef = useRef(false)
  const [status, setStatus] = useState('loading')
  const [notice, setNotice] = useState('')
  const [position, setPosition] = useState(DEFAULT_MAP_CENTER)

  const requestCurrentLocation = useCallback(async () => {
    setStatus('loading')
    setNotice('')

    try {
      const currentPosition = await getCurrentPosition()
      if (!isMountedRef.current) return

      setPosition({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        label: '현재 위치',
      })
      setStatus('success')
    } catch {
      if (!isMountedRef.current) return

      setPosition({
        latitude: null,
        longitude: null,
        label: '현재 위치 필요',
      })
      setStatus('error')
      setNotice(LOCATION_REQUIRED_MESSAGE)
    }
  }, [])

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

  return {
    currentPosition: position,
    locationStatus: status,
    locationNotice: notice,
    requestCurrentLocation,
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
