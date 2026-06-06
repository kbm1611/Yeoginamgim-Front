import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  MapPin,
  MoreHorizontal,
  Share,
  User,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchBoardDetailForRouteId } from '../api/boards'
import { API_BASE_URL, clearAuthToken } from '../api/client'
import { getApiErrorMessage, handleUnauthorizedApiError } from '../api/errors'
import { fetchBoardTraces } from '../api/traces'
import {
  buildPlaceDetailFromBoardDetail,
  buildRecentTraceCards,
  getPlaceDetailRows,
  getTraceCountText,
  resolveBoardNavigationId,
} from './PlaceDetail.utils'

// ??? Components ???????????????????????????????????????????????????????????????

function HeroPlaceholder() {
  return (
    <div className="flex h-[220px] w-full items-center justify-center bg-[#EFE4D7] px-5">
      <div className="flex flex-col items-center text-center text-[#8A6F58]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/75">
          <MapPin size={24} strokeWidth={1.8} />
        </div>
        <p className="mt-3 text-[14px] font-semibold">대표 이미지 없음</p>
        <p className="mt-1 text-[12px] font-medium text-[#9A8573]">
          장소 사진은 아직 제공되지 않습니다.
        </p>
      </div>
    </div>
  )
}

function PlaceInfoCard({ place, traceStatus }) {
  const detailRows = getPlaceDetailRows(place)
  const traceCountText = getTraceCountText(place.stats?.traces, traceStatus)

  return (
    <section className="mx-5 mt-5 rounded-[16px] border border-[#EBE1D6] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(60,42,30,0.07)]">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="min-w-0 truncate text-[24px] font-bold leading-tight text-[#3B2A1E]">{place.name}</h1>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#7A5A2E]">
            <ClipboardList size={11} strokeWidth={1.8} />
            흔적 {traceCountText}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-[#8B7A6B]">
          <MapPin size={13} className="shrink-0 text-[#B0957C]" />
          <span className="min-w-0 truncate">{place.address || '주소 정보 없음'}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F5F0EA] px-2.5 py-1 text-[12px] font-medium text-[#6B5344]">
            {place.category || '카테고리 없음'}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-[#F0E7DC] pt-3">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-[12px]">
            <dt className="shrink-0 font-medium text-[#9A8573]">{row.label}</dt>
            <dd className="min-w-0 break-words text-right font-semibold text-[#4A3728]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {traceStatus === 'error' ? (
        <p className="mt-3 rounded-[8px] bg-[#FFF7F2] px-3 py-2 text-[12px] font-medium text-[#A85C3B]">
          흔적 수를 불러오지 못해 장소 정보만 표시하고 있습니다.
        </p>
      ) : null}
    </section>
  )
}

function PlaceMetadataEmptyState() {
  return (
    <section className="mx-5 mt-4 rounded-[14px] border border-dashed border-[#E3D6C8] bg-[#FFFDF9] px-4 py-4">
      <h2 className="text-[14px] font-bold text-[#4A3728]">추가 장소 정보 없음</h2>
      <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#8B7A6B]">
        대표 이미지, 소개글, 분위기 태그는 아직 제공되지 않습니다.
      </p>
    </section>
  )
}

function RecentTraceCard({ trace }) {
  const imageUrl = resolveTraceImageUrl(trace.image)

  if (trace.type === 'photo' && imageUrl) {
    return (
      <article className="w-[148px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(60,42,30,0.10)]">
        <img src={imageUrl} alt="" className="h-[120px] w-full object-cover" />
        <div className="px-2.5 py-2">
          <p className="truncate text-[12px] font-medium text-[#3B2A1E]">{trace.text}</p>
          <p className="mt-0.5 text-[11px] text-[#8B7A6B]">{trace.user}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8B7A6B]">
            <span>{trace.time}</span>
            <span className="flex items-center gap-0.5">
              <Heart size={10} strokeWidth={1.5} />
              {trace.likes}
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="w-[148px] shrink-0 overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(60,42,30,0.10)]"
      style={{ backgroundColor: trace.noteBg }}
    >
      <div className="min-h-[120px] px-3 pb-2 pt-3">
        {trace.date && (
          <p className="mb-2 text-[11px] text-[#8B7A6B]">{trace.date}</p>
        )}
        <p
          className="whitespace-pre-line text-[14px] leading-[1.7] text-[#3B2A1E]"
          style={{ fontFamily: "'Nanum Pen Script', cursive" }}
        >
          {trace.text}
        </p>
      </div>
      <div className="px-3 pb-2">
        <p className="text-[11px] text-[#8B7A6B]">{trace.user}</p>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#8B7A6B]">
          <span>{trace.time}</span>
          <span className="flex items-center gap-0.5">
            <Heart size={10} strokeWidth={1.5} />
            {trace.likes}
          </span>
        </div>
      </div>
    </article>
  )
}

function RecentTraceStatusCard({ message }) {
  return (
    <div className="mx-5 rounded-[14px] border border-[#EFE5DA] bg-white px-4 py-5 text-center text-[13px] font-medium text-[#7D6E62] shadow-[0_2px_8px_rgba(60,42,30,0.05)]">
      {message}
    </div>
  )
}

function RecentTraceList({ traces, status, errorMessage, onMore }) {
  const hasTraces = status === 'ready' && traces.length > 0

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-[16px] font-bold text-[#3B2A1E]">최근 흔적</h2>
        {hasTraces ? (
          <button
            type="button"
            onClick={onMore}
            className="flex items-center gap-0.5 text-[13px] font-medium text-[#6B5A4C]"
          >
            더보기
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        ) : null}
      </div>
      {status === 'loading' ? <RecentTraceStatusCard message="최근 흔적을 불러오는 중입니다." /> : null}
      {status === 'error' ? (
        <RecentTraceStatusCard message={errorMessage || '최근 흔적을 불러오지 못했습니다.'} />
      ) : null}
      {status === 'ready' && traces.length === 0 ? (
        <RecentTraceStatusCard message="아직 남겨진 흔적이 없습니다." />
      ) : null}
      {hasTraces ? (
        <div
          className="flex gap-3 overflow-x-auto px-5 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {traces.map((trace) => (
            <RecentTraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function resolveTraceImageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (/^[a-zA-Z]:[\\/]/.test(path)) return ''
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`

  return path
}

function PlaceDetailState({ title, message, children }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-5 py-10">
      <div className="w-full rounded-[18px] border border-[#EBE1D6] bg-white px-5 py-6 text-center shadow-[0_2px_10px_rgba(60,42,30,0.08)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F0EA] text-[#7A5A2E]">
          <MapPin size={22} strokeWidth={1.8} />
        </div>
        <h1 className="mt-4 text-[18px] font-bold text-[#3B2A1E]">{title}</h1>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#8B7A6B]">{message}</p>
        {children ? <div className="mt-5 flex gap-2">{children}</div> : null}
      </div>
    </div>
  )
}

function StateButton({ children, variant = 'primary', onClick }) {
  const className =
    variant === 'secondary'
      ? 'flex-1 rounded-full border border-[#D8CDBF] bg-white px-4 py-3 text-[13px] font-bold text-[#5C4A3B]'
      : 'flex-1 rounded-full bg-[#3A2418] px-4 py-3 text-[13px] font-bold text-white'

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

function BottomCTA({ onClick }) {
  return (
    <div className="px-5 pb-1 pt-3">
      <button
        type="button"
        onClick={onClick}
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#3A2418] text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(58,36,24,0.35)] active:opacity-80"
      >
        <span>흔적 보드 보기</span>
      </button>
    </div>
  )
}

const NAV_ITEMS = [
  { key: 'home', label: '홈', icon: Home, path: '/home' },
  { key: 'space', label: '공간', icon: MapPin, path: '/map' },
  { key: 'trace', label: '내 흔적', icon: Bookmark, path: null },
  { key: 'my', label: '마이', icon: User, path: null },
]

function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="border-t border-[#E8DDD1] bg-[#FBF6EE] px-2 pb-7 pt-2.5">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          // place ?곸꽭 ?붾㈃?대?濡?"怨듦컙" ????긽 ?쒖꽦??
          const active = item.key === 'space'
          return (
            <li key={item.key} className="flex justify-center">
              <button
                type="button"
                onClick={() => item.path && navigate(item.path)}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.5}
                  className={active ? 'text-[#3A2418]' : 'text-[#9B8A7B]'}
                />
                <span
                  className={`text-[11px] font-medium ${active ? 'text-[#3A2418]' : 'text-[#9B8A7B]'}`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ??? Main ?????????????????????????????????????????????????????????????????????

function PlaceDetailScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [boardDetail, setBoardDetail] = useState(null)
  const [boardDetailStatus, setBoardDetailStatus] = useState(id ? 'loading' : 'error')
  const [boardDetailError, setBoardDetailError] = useState('')
  const [boardDetailRetryKey, setBoardDetailRetryKey] = useState(0)
  const [recentTraces, setRecentTraces] = useState([])
  const [recentTracesStatus, setRecentTracesStatus] = useState('idle')
  const [recentTracesError, setRecentTracesError] = useState('')
  const place = boardDetailStatus === 'ready' ? buildPlaceDetailFromBoardDetail(boardDetail) : null
  const boardNavigationId = resolveBoardNavigationId(id, boardDetail)

  useEffect(() => {
    let ignore = false

    async function loadBoardDetail() {
      if (!id) {
        if (!ignore) {
          setBoardDetail(null)
          setBoardDetailStatus('error')
        }
        return
      }

      setBoardDetail(null)
      setBoardDetailStatus('loading')
      setBoardDetailError('')

      try {
        const detail = await fetchBoardDetailForRouteId(id)
        if (!ignore) {
          setBoardDetail(detail)
          setBoardDetailStatus('ready')
        }
      } catch (error) {
        if (!ignore) {
          if (handleUnauthorizedApiError(error, {
            clearToken: clearAuthToken,
            navigate,
            location: { pathname: `/places/${id}` },
            redirect: true,
          })) return

          setBoardDetail(null)
          setBoardDetailError(getApiErrorMessage(error, {
            fallback: '장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            statusMessages: {
              403: '이 장소 보드에 접근할 권한이 없습니다.',
              404: '장소 정보를 찾을 수 없습니다.',
              409: '장소 보드 상태가 변경되었습니다. 다시 시도해주세요.',
              500: '장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            },
          }))
          setBoardDetailStatus('error')
        }
      }
    }

    loadBoardDetail()

    return () => {
      ignore = true
    }
  }, [boardDetailRetryKey, id, navigate])

  useEffect(() => {
    const boardId = boardDetail?.boardId
    let ignore = false

    async function loadRecentTraces() {
      if (boardDetailStatus !== 'ready' || !boardId) {
        if (!ignore) {
          setRecentTraces([])
          setRecentTracesError('')
          setRecentTracesStatus(boardDetailStatus === 'ready' ? 'ready' : 'idle')
        }
        return
      }

      setRecentTraces([])
      setRecentTracesError('')
      setRecentTracesStatus('loading')

      try {
        const data = await fetchBoardTraces(boardId, { sort: 'latest', limit: 2 })
        if (ignore) return

        setRecentTraces(buildRecentTraceCards(data))
        setRecentTracesStatus('ready')
      } catch (error) {
        if (ignore) return

        setRecentTraces([])
        setRecentTracesError(getApiErrorMessage(error, {
          fallback: '최근 흔적을 불러오지 못했습니다.',
          statusMessages: {
            403: '최근 흔적을 볼 권한이 없습니다.',
            404: '최근 흔적을 찾을 수 없습니다.',
            500: '최근 흔적을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          },
        }))
        setRecentTracesStatus('error')
      }
    }

    loadRecentTraces()

    return () => {
      ignore = true
    }
  }, [boardDetail?.boardId, boardDetailStatus])

  const renderContent = () => {
    if (boardDetailStatus === 'loading') {
      return (
        <PlaceDetailState
          title="장소 정보를 불러오는 중입니다"
          message="실제 장소 상세 정보를 확인하고 있습니다."
        />
      )
    }

    if (boardDetailStatus === 'error') {
      return (
        <PlaceDetailState
          title="장소 정보를 불러오지 못했습니다"
          message={boardDetailError || '임시 장소 정보로 대체하지 않고, 실제 응답을 다시 확인해야 합니다.'}
        >
          <StateButton variant="secondary" onClick={() => navigate(-1)}>뒤로가기</StateButton>
          {id ? <StateButton onClick={() => setBoardDetailRetryKey((value) => value + 1)}>다시 시도</StateButton> : null}
        </PlaceDetailState>
      )
    }

    if (!place) {
      return (
        <PlaceDetailState
          title="표시할 장소 정보가 없습니다"
          message="보드 응답에 장소 이름이 없어 상세 화면을 구성할 수 없습니다."
        >
          <StateButton variant="secondary" onClick={() => navigate(-1)}>뒤로가기</StateButton>
          <StateButton onClick={() => navigate(`/board/${boardNavigationId}`)}>보드로 이동</StateButton>
        </PlaceDetailState>
      )
    }

    return (
      <>
        <HeroPlaceholder />

        <div className="-mt-6 rounded-t-[28px] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.10)]">
          <PlaceInfoCard place={place} traceStatus={boardDetailStatus} />
          <PlaceMetadataEmptyState />
          <RecentTraceList
            traces={recentTraces}
            status={recentTracesStatus}
            errorMessage={recentTracesError}
            onMore={() => navigate(`/board/${boardNavigationId}`)}
          />
          <div className="h-36" />
        </div>
      </>
    )
  }

  return (
    <motion.div
      className="app-device flex flex-col overflow-hidden bg-[#FBF6EE]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ?? Status bar ?곸뿭 (?ㅻ줈/怨듭쑀/?붾낫湲? ?? */}
      <div className="flex items-center justify-between bg-[#FBF6EE] px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="flex h-9 w-9 items-center justify-center"
        >
          <ChevronLeft size={26} strokeWidth={1.8} className="text-[#3B2A1E]" />
        </button>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="공유" className="flex h-9 w-9 items-center justify-center">
            <Share size={20} strokeWidth={1.8} className="text-[#3B2A1E]" />
          </button>
          <button type="button" aria-label="더보기" className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal size={22} strokeWidth={1.8} className="text-[#3B2A1E]" />
          </button>
        </div>
      </div>

      {/* ?? ?ㅽ겕濡?蹂몃Ц ?? */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {renderContent()}
      </div>

      {/* ?? ?섎떒 怨좎젙 ?곸뿭 ?? */}
      <div className="shrink-0 bg-[#FBF6EE] shadow-[0_-6px_20px_rgba(58,36,24,0.08)]">
        <BottomCTA onClick={() => navigate(`/board/${boardNavigationId}`)} />
        <BottomNav />
      </div>
    </motion.div>
  )
}

export default PlaceDetailScreen
