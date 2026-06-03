import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Loader2, RefreshCw, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchOrCreateBoardForPlace } from '../api/boards'
import { fetchPopularPlaces } from '../api/places'

const fallbackImages = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80',
]

const categoryLabels = {
  cafe: '카페',
  food: '맛집',
  shop: '편집샵',
  park: '공원',
  culture: '문화',
}

function toTopPlace(place, index) {
  const kakaoPlaceId =
    place.kakaoPlaceId === null || place.kakaoPlaceId === undefined ? '' : String(place.kakaoPlaceId).trim()
  const placeName = place.placeName ?? '이름 없는 공간'
  const address = place.address ?? ''
  const groupName = place.groupName ?? ''

  return {
    id: kakaoPlaceId || `${index}`,
    kakaoPlaceId,
    boardId: place.boardId ?? null,
    placeName,
    latitude: place.latitude,
    longitude: place.longitude,
    phone: place.phone ?? '',
    address,
    kakaoMapUrl: place.kakaoMapUrl ?? '',
    groupName,
    rank: place.rank ?? index + 1,
    name: placeName,
    category: categoryLabels[groupName] ?? groupName ?? '공간',
    quote: address || '사람들이 오래 기억한 공간이에요.',
    traces: place.traceCount ?? 0,
    image: fallbackImages[index % fallbackImages.length],
  }
}

function TopPlacesSection({ districtInfo, locationStatus = 'idle', onRefreshDistrict }) {
  const navigate = useNavigate()
  const isMountedRef = useRef(false)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [openingPlaceId, setOpeningPlaceId] = useState(null)
  const [boardError, setBoardError] = useState('')
  const district = districtInfo?.district

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (locationStatus === 'idle' || locationStatus === 'loading') {
      return undefined
    }

    let ignored = false

    async function loadPopularPlaces() {
      setStatus('loading')
      setErrorMessage('')
      setBoardError('')

      try {
        const popularPlaces = await fetchPopularPlaces({ district, limit: 5 })
        if (ignored) return

        setPlaces(popularPlaces.map(toTopPlace))
        setStatus('ready')
      } catch {
        if (ignored) return

        setPlaces([])
        setErrorMessage('인기 공간을 불러오지 못했습니다.')
        setStatus('error')
      }
    }

    loadPopularPlaces()

    return () => {
      ignored = true
    }
  }, [district, locationStatus])

  const handleShowMore = () => {
    navigate('/map')
  }

  const handleOpenPlace = async (place) => {
    if (!place?.kakaoPlaceId) {
      setBoardError('공간 정보를 확인할 수 없어 보드로 이동하지 못했습니다.')
      return
    }

    setBoardError('')

    if (hasBoardId(place.boardId)) {
      navigate(`/board/${place.boardId}`)
      return
    }

    setOpeningPlaceId(place.id)

    try {
      const board = await fetchOrCreateBoardForPlace(place)
      if (!board?.boardId) {
        throw new Error('Board response does not include boardId.')
      }

      navigate(`/board/${board.boardId}`)
    } catch {
      if (isMountedRef.current) {
        setBoardError('보드로 이동하지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      if (isMountedRef.current) {
        setOpeningPlaceId(null)
      }
    }
  }

  const title = district ? `${district} 인기 공간 TOP 5` : '인기 공간 TOP 5'
  const description = district
    ? `${district}에서 사람들이 오래 기억한 공간들이에요.`
    : '사람들이 오래 기억한 공간들이에요.'

  return (
    <section className="pt-4">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[30px] font-bold tracking-[-0.015em] text-[#2B1810]">{title}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefreshDistrict}
            disabled={locationStatus === 'loading'}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#7D6E62] disabled:opacity-45"
            aria-label="현재 위치 새로고침"
            title="현재 위치 새로고침"
          >
            <RefreshCw size={15} className={locationStatus === 'loading' ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleShowMore}
            className="flex items-center text-[13px] font-medium text-[#7D6E62]"
          >
            더보기
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <p className="mb-3 px-5 text-[14px] font-normal text-[#8E8177]">{description}</p>

      {boardError ? (
        <div className="mx-5 mb-3 rounded-[12px] bg-[#FFF7F1] px-4 py-3 text-[12px] font-medium text-[#A74831]">
          {boardError}
        </div>
      ) : null}

      {status === 'loading' && (
        <div className="mx-5 mb-3 rounded-[12px] bg-white px-4 py-6 text-center text-[13px] text-[#7D6E62] shadow-[0_5px_14px_rgba(0,0,0,0.05)]">
          인기 공간을 불러오는 중입니다.
        </div>
      )}

      {status === 'error' && (
        <div className="mx-5 mb-3 rounded-[12px] bg-white px-4 py-6 text-center text-[13px] text-[#7D6E62] shadow-[0_5px_14px_rgba(0,0,0,0.05)]">
          {errorMessage}
        </div>
      )}

      {status === 'ready' && places.length === 0 && (
        <div className="mx-5 mb-3 rounded-[12px] bg-white px-4 py-6 text-center text-[13px] text-[#7D6E62] shadow-[0_5px_14px_rgba(0,0,0,0.05)]">
          {district ? `${district}의 인기 공간이 아직 없습니다.` : '인기 공간이 아직 없습니다.'}
        </div>
      )}

      {status === 'ready' && places.length > 0 && (
        <div className="scrollbar-hide flex gap-2.5 overflow-x-scroll px-5 pb-3">
          {places.map((place) => {
            const isOpening = openingPlaceId === place.id

            return (
              <article
                key={place.id}
                className="w-[122px] shrink-0 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.08)] transition active:scale-[0.99]"
              >
                <button
                  type="button"
                  onClick={() => handleOpenPlace(place)}
                  disabled={openingPlaceId !== null}
                  aria-busy={isOpening}
                  aria-label={`${place.name} 보드 열기`}
                  className="block h-full w-full text-left disabled:cursor-wait disabled:opacity-80"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#3E2A1E] text-[10px] font-bold text-white">
                      {place.rank}
                    </span>
                  </div>

                  <div className="bg-white px-2.5 pb-2.5 pt-2">
                    <h3 className="truncate text-[13px] font-medium leading-tight text-[#2F2118]">{place.name}</h3>
                    <span className="mt-1 inline-block rounded-[8px] bg-[#F3EEE7] px-1.5 py-0.5 text-[10px] text-[#7E6E62]">
                      {place.category}
                    </span>
                    <p className="mt-1.5 line-clamp-2 text-[11px] font-normal leading-[1.35] text-[#66564A]">
                      "{place.quote}"
                    </p>
                    <p className="mt-1.5 flex min-h-[16px] items-center gap-0.5 text-[11px] font-normal text-[#8A7A6D]">
                      {isOpening ? (
                        <>
                          <Loader2 size={11} strokeWidth={1.8} className="animate-spin" />
                          <span>보드로 이동 중</span>
                        </>
                      ) : (
                        <>
                          <UserRound size={11} strokeWidth={1.7} />
                          <span>{place.traces}개의 흔적</span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function hasBoardId(boardId) {
  return boardId !== null && boardId !== undefined && String(boardId).trim() !== ''
}

export default TopPlacesSection
