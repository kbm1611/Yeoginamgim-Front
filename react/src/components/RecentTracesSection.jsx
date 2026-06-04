import { useEffect, useState } from 'react'
import { ChevronRight, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchRecentTraces } from '../api/traces'
import { ALL_DISTRICTS_LABEL, buildHomeTraceParams } from '../pages/HomePage.utils'

function RecentTracesSection({ period, district }) {
  const navigate = useNavigate()
  const [traces, setTraces] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const districtLabel = district || ALL_DISTRICTS_LABEL

  useEffect(() => {
    let ignored = false

    async function loadRecentTraces() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const recentTraces = await fetchRecentTraces(buildHomeTraceParams({ period, district: districtLabel }))
        if (ignored) return

        setTraces(Array.isArray(recentTraces) ? recentTraces : [])
        setStatus('ready')
      } catch {
        if (ignored) return

        setTraces([])
        setErrorMessage('최근 흔적을 불러오지 못했습니다.')
        setStatus('error')
      }
    }

    loadRecentTraces()

    return () => {
      ignored = true
    }
  }, [districtLabel, period])

  const handleTraceClick = (trace) => {
    if (trace?.boardId) {
      navigate(`/board/${trace.boardId}`)
    }
  }

  return (
    <section className="pb-6 pt-4">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[22px] font-bold tracking-[-0.015em] text-[#2B1810]">
          {districtLabel}에서 최근 남겨진 흔적
        </h2>
        <button type="button" className="flex items-center text-[13px] font-medium text-[#7D6E62]">
          더보기
          <ChevronRight size={15} />
        </button>
      </div>
      <p className="mb-3 px-5 text-[14px] font-normal text-[#8E8177]">방금 이 공간에 새로운 흔적이 남겨졌어요.</p>

      {status === 'loading' && <StatusCard message="최근 흔적을 불러오는 중입니다." />}
      {status === 'error' && <StatusCard message={errorMessage} />}
      {status === 'ready' && traces.length === 0 && <StatusCard message="아직 남겨진 흔적이 없습니다." />}

      {status === 'ready' && traces.length > 0 && (
        <div className="mx-4 rounded-[16px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          {traces.map((trace, index) => (
            <article
              key={trace.traceId ?? `${trace.boardId}-${index}`}
              className={`flex items-center gap-3 px-3 py-2.5 ${index !== traces.length - 1 ? 'border-b border-[#F1ECE4]' : ''}`}
            >
              <button type="button" onClick={() => handleTraceClick(trace)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <TraceThumbnail trace={trace} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-[#2F2118]">
                    {trace.placeName || '장소 보드'}
                  </span>
                  <span className="mt-1 block truncate text-[13px] font-normal text-[#5E5146]">
                    "{trace.previewText || '남겨진 흔적'}"
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-[#8E8177]">{formatRelativeTime(trace.createdAt)}</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function TraceThumbnail({ trace }) {
  if (trace.imageUrl) {
    return <img src={resolveMediaUrl(trace.imageUrl)} alt={trace.placeName || '흔적'} className="h-14 w-14 rounded-[10px] object-cover" />
  }

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-[#F2EAFE] text-[#7B55F6]">
      {trace.previewText === '이미지 흔적' ? <ImageIcon size={20} /> : <MessageCircle size={20} />}
    </span>
  )
}

function StatusCard({ message }) {
  return (
    <div className="mx-5 mb-3 rounded-[12px] bg-white px-4 py-6 text-center text-[13px] text-[#7D6E62] shadow-[0_5px_14px_rgba(0,0,0,0.05)]">
      {message}
    </div>
  )
}

function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (/^[a-zA-Z]:[\\/]/.test(path)) return ''
  return path
}

function formatRelativeTime(value) {
  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) return ''

  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000))
  if (diffMinutes < 1) return '방금'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  return `${Math.floor(diffHours / 24)}일 전`
}

export default RecentTracesSection
