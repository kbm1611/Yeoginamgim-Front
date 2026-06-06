import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchOrCreateBoardForPlace } from '../../../api/boards'
import { getApiErrorMessage } from '../../../api/errors'

export function useEnterBoard({
  navigate,
  onUnauthorized,
  onFocusPlace,
} = {}) {
  const isMountedRef = useRef(true)
  const [openingPlaceId, setOpeningPlaceId] = useState(null)
  const [boardError, setBoardError] = useState('')

  const enterBoard = useCallback(async (place) => {
    if (!place?.kakaoPlaceId) return

    setBoardError('')
    setOpeningPlaceId(place.kakaoPlaceId)
    onFocusPlace?.(place)

    try {
      if (place.boardId) {
        navigate?.(`/board/${place.boardId}`)
        return
      }

      const board = await fetchOrCreateBoardForPlace(place)
      if (!board?.boardId) {
        throw new Error('Board response does not include boardId.')
      }

      navigate?.(`/board/${board.boardId}`)
    } catch (apiError) {
      if (onUnauthorized?.(apiError)) return

      if (isMountedRef.current) {
        setBoardError(getApiErrorMessage(apiError, {
          fallback: '보드에 들어가지 못했습니다. 다시 시도해 주세요.',
          statusMessages: {
            403: '이 보드에 접근할 권한이 없습니다.',
            404: '장소 보드를 찾지 못했어요.',
            409: '보드 상태가 변경되었습니다. 다시 시도해 주세요.',
            500: '보드에 들어가지 못했습니다. 다시 시도해 주세요.',
          },
        }))
      }
    } finally {
      if (isMountedRef.current) {
        setOpeningPlaceId(null)
      }
    }
  }, [navigate, onFocusPlace, onUnauthorized])

  const resetBoardError = useCallback(() => {
    setBoardError('')
  }, [])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    openingPlaceId,
    boardError,
    enterBoard,
    resetBoardError,
    setBoardError,
  }
}
