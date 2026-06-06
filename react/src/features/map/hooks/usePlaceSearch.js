import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../api/errors'
import { fetchPoiPlaces } from '../../../api/places'
import {
  buildPoiSearchRequests,
  NEARBY_LIMIT,
  normalizeSearchPlaces,
} from '../../../pages/Map.utils'

export function usePlaceSearch({
  currentPosition,
  locationStatus,
  onUnauthorized,
} = {}) {
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(false)
  const [input, setInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [focusedPlaceId, setFocusedPlaceId] = useState(null)
  const [isResultsOpen, setIsResultsOpen] = useState(false)

  const clearSearch = useCallback(() => {
    requestIdRef.current += 1
    setInput('')
    setActiveQuery('')
    setPlaces([])
    setStatus('idle')
    setError('')
    setNotice('')
    setIsResultsOpen(false)
    setFocusedPlaceId(null)
  }, [])

  const handleInputChange = useCallback((event) => {
    const nextValue = event.target.value
    const trimmedValue = nextValue.trim()

    if (!trimmedValue) {
      clearSearch()
      return
    }

    setInput(nextValue)
    setNotice('')

    if (activeQuery && trimmedValue !== activeQuery) {
      requestIdRef.current += 1
      setActiveQuery('')
      setPlaces([])
      setStatus('idle')
      setError('')
      setIsResultsOpen(false)
      setFocusedPlaceId(null)
    }
  }, [activeQuery, clearSearch])

  const runSearch = useCallback(async ({ query = input } = {}) => {
    const trimmedQuery = String(query ?? '').trim()
    if (!trimmedQuery) {
      requestIdRef.current += 1
      setActiveQuery('')
      setPlaces([])
      setStatus('idle')
      setNotice('검색어를 입력해 주세요.')
      setError('')
      setFocusedPlaceId(null)
      setIsResultsOpen(true)
      return false
    }

    setActiveQuery(trimmedQuery)
    setInput(trimmedQuery)
    setPlaces([])
    setFocusedPlaceId(null)
    setIsResultsOpen(true)

    const searchOrigin = locationStatus === 'success' ? currentPosition : null
    const requests = buildPoiSearchRequests({
      query: trimmedQuery,
      latitude: searchOrigin?.latitude,
      longitude: searchOrigin?.longitude,
    })

    if (requests.length === 0) {
      setPlaces([])
      setStatus('error')
      setError('검색어를 입력한 뒤 다시 검색해 주세요.')
      setNotice('')
      return false
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus('loading')
    setError('')
    setNotice('')

    try {
      const response = await Promise.all(requests.map(async (request) => ({
        requestCategory: request.category,
        places: await fetchPoiPlaces(request),
      })))
      if (!isMountedRef.current || requestIdRef.current !== requestId) return false

      setPlaces(normalizeSearchPlaces(response, searchOrigin, trimmedQuery, NEARBY_LIMIT))
      setStatus('success')
      return true
    } catch (apiError) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return false
      if (onUnauthorized?.(apiError)) return false

      setPlaces([])
      setStatus('error')
      setError(getApiErrorMessage(apiError, {
        fallback: '장소 검색을 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
        statusMessages: {
          403: '장소 검색 권한이 없습니다.',
          404: '검색 결과를 찾지 못했어요.',
          500: '장소 검색을 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
        },
      }))
      return false
    }
  }, [currentPosition, input, locationStatus, onUnauthorized])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    searchInput: input,
    activeSearchQuery: activeQuery,
    searchPlaces: places,
    searchStatus: status,
    searchError: error,
    searchNotice: notice,
    focusedSearchPlaceId: focusedPlaceId,
    isSearchResultsOpen: isResultsOpen,
    setFocusedSearchPlaceId: setFocusedPlaceId,
    setIsSearchResultsOpen: setIsResultsOpen,
    setSearchPlaces: setPlaces,
    runPoiSearch: runSearch,
    clearPoiSearch: clearSearch,
    handleSearchInputChange: handleInputChange,
  }
}
