import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Loader2, RefreshCw, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchOrCreateBoardForPlace } from '../api/boards'
import { fetchPopularPlaces } from '../api/places'
import { ALL_DISTRICTS_LABEL, buildHomePlaceParams } from '../pages/HomePage.utils'

const fallbackImages = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80',
]

const categoryLabels = {
  CE7: '카페',
  FD6: '음식점 / 맛집',
  CS2: '편의점',
  PARK: '공원 / 산책로',
  CULTURE: '문화시설 / 전시 / 팝업',
  SHOPPING: '쇼핑 / 소품샵 / 편집샵',
  AT4: '관광명소 / 포토스팟',
  EDU: '학교 / 학원',
  MT1: '마트',
  AD5: '숙박 / 호텔',
  CT1: '문화시설 / 전시 / 팝업',
  SC4: '학교 / 학원',
  AC5: '학교 / 학원',
  cafe: '카페',
  food: '음식점 / 맛집',
  culture: '문화시설 / 전시 / 팝업',
  park: '공원 / 산책로',
  shopping: '쇼핑 / 소품샵 / 편집샵',
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
    quote: address || '사람들이 기억을 남긴 공간이에요.',
    traces: place.traceCount ?? 0,
    image: fallbackImages[index % fallbackImages.length],
  }
}

function TopPlacesSection({ period, district, locationStatus = 'idle', onRefreshDistrict }) {
  const navigate = useNavigate()
  const isMountedRef = useRef(false)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [openingPlaceId, setOpeningPlaceId] = useState(null)
  const [boardError, setBoardError] = useState('')
  const districtLabel = district || ALL_DISTRICTS_LABEL

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
        const popularPlaces = await fetchPopularPlaces(buildHomePlaceParams({ period, district: districtLabel }))
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
  }, [districtLabel, locationStatus, period])

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

  const title = `${districtLabel} 인기 공간 TOP 5`
  const description =
    districtLabel === ALL_DISTRICTS_LABEL
      ? '사람들이 오늘 많이 남긴 공간들이에요.'
      : `${districtLabel}에서 오늘 많이 기록된 공간들이에요.`

  return (
    <section className="pt-4">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[24px] font-bold tracking-[-0.015em] text-[#2B1810]">{title}</h2>
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
          <button type="button" onClick={handleShowMore} className="flex items-center text-[13px] font-medium text-[#7D6E62]">
            지도보기
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

      {status === 'loading' && <StatusCard message="인기 공간을 불러오는 중입니다." />}
      {status === 'error' && <StatusCard message={errorMessage} />}
      {status === 'ready' && places.length === 0 && <StatusCard message={`${districtLabel}의 인기 공간이 아직 없습니다.`} />}

      {status === 'ready' && places.length > 0 && (
        <div className="space-y-2 px-5 pb-3">
          {places.map((place) => {
            const isOpening = openingPlaceId === place.id

            return (
              <article key={place.id} className="overflow-hidden rounded-[16px] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={() => handleOpenPlace(place)}
                  disabled={openingPlaceId !== null}
                  aria-busy={isOpening}
                  aria-label={`${place.name} 보드 열기`}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:cursor-wait disabled:opacity-80"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2EAFE] text-[15px] font-bold text-[#7B55F6]">
                    {place.rank}
                  </span>
                  <img src={place.image} alt={place.name} className="h-16 w-20 shrink-0 rounded-[12px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold text-[#2F2118]">{place.name}</span>
                    <span className="mt-1 block truncate text-[12px] text-[#7E6E62]">{place.quote}</span>
                  </span>
                  <span className="flex min-h-[42px] w-[88px] shrink-0 items-center justify-center rounded-[12px] bg-[#F2EAFE] px-2 text-center text-[12px] font-bold text-[#7B55F6]">
                    {isOpening ? (
                      <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
                    ) : (
                      <>
                        <UserRound size={13} strokeWidth={1.7} />
                        <span className="ml-1">{place.traces}</span>
                      </>
                    )}
                  </span>
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StatusCard({ message }) {
  return (
    <div className="mx-5 mb-3 rounded-[12px] bg-white px-4 py-6 text-center text-[13px] text-[#7D6E62] shadow-[0_5px_14px_rgba(0,0,0,0.05)]">
      {message}
    </div>
  )
}

function hasBoardId(boardId) {
  return boardId !== null && boardId !== undefined && String(boardId).trim() !== ''
}

export default TopPlacesSection
