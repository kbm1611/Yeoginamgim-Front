import { useCallback, useEffect, useRef, useState } from 'react'
import { addFavoritePlace, fetchFavoritePlaces, removeFavoritePlace } from '../../../api/archive'
import { buildBoardRequestFromPlace } from '../../../api/boards'
import { getApiErrorMessage } from '../../../api/errors'

export function useFavoritePlaces({ onUnauthorized } = {}) {
  const isMountedRef = useRef(false)
  const [favoritePlaceIds, setFavoritePlaceIds] = useState(() => new Set())
  const [favoritePlaceIdInProgress, setFavoritePlaceIdInProgress] = useState(null)
  const [favoriteError, setFavoriteError] = useState('')

  const loadFavoritePlaces = useCallback(async () => {
    try {
      const response = await fetchFavoritePlaces()
      if (!isMountedRef.current) return

      const ids = new Set(
        (Array.isArray(response?.places) ? response.places : [])
          .map((place) => place?.kakaoPlaceId)
          .filter(Boolean)
      )
      setFavoritePlaceIds(ids)
      setFavoriteError('')
    } catch (apiError) {
      if (onUnauthorized?.(apiError)) return

      if (isMountedRef.current) {
        setFavoriteError(getApiErrorMessage(apiError, {
          fallback: '즐겨찾기 정보를 불러오지 못했어요.',
          statusMessages: {
            403: '즐겨찾기 정보를 볼 권한이 없습니다.',
            404: '즐겨찾기 정보를 찾지 못했어요.',
            500: '즐겨찾기 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.',
          },
        }))
      }
    }
  }, [onUnauthorized])

  const toggleFavoritePlace = useCallback(async (place) => {
    if (!place?.kakaoPlaceId) return

    const kakaoPlaceId = place.kakaoPlaceId
    const isFavorite = favoritePlaceIds.has(kakaoPlaceId)

    setFavoriteError('')
    setFavoritePlaceIdInProgress(kakaoPlaceId)

    try {
      if (isFavorite) {
        await removeFavoritePlace(kakaoPlaceId)
        setFavoritePlaceIds((previousIds) => {
          const nextIds = new Set(previousIds)
          nextIds.delete(kakaoPlaceId)
          return nextIds
        })
        return
      }

      await addFavoritePlace(kakaoPlaceId, buildBoardRequestFromPlace(place))
      setFavoritePlaceIds((previousIds) => {
        const nextIds = new Set(previousIds)
        nextIds.add(kakaoPlaceId)
        return nextIds
      })
    } catch (apiError) {
      if (onUnauthorized?.(apiError)) return

      if (isMountedRef.current) {
        setFavoriteError(getApiErrorMessage(apiError, {
          fallback: isFavorite ? '즐겨찾기를 해제하지 못했어요.' : '즐겨찾기에 저장하지 못했어요.',
          statusMessages: {
            403: '즐겨찾기를 변경할 권한이 없습니다.',
            404: '즐겨찾기할 장소를 찾지 못했어요.',
            409: '즐겨찾기 상태가 이미 변경되었습니다. 다시 확인해 주세요.',
            500: isFavorite ? '즐겨찾기를 해제하지 못했어요.' : '즐겨찾기에 저장하지 못했어요.',
          },
        }))
      }
    } finally {
      if (isMountedRef.current) {
        setFavoritePlaceIdInProgress(null)
      }
    }
  }, [favoritePlaceIds, onUnauthorized])

  const resetFavoriteError = useCallback(() => {
    setFavoriteError('')
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    window.queueMicrotask(() => {
      if (isMountedRef.current) {
        loadFavoritePlaces()
      }
    })

    return () => {
      isMountedRef.current = false
    }
  }, [loadFavoritePlaces])

  return {
    favoritePlaceIds,
    favoritePlaceIdInProgress,
    favoriteError,
    loadFavoritePlaces,
    toggleFavoritePlace,
    resetFavoriteError,
  }
}
