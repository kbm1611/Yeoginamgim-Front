import RecentTraceItem from '../cards/RecentTraceItem'

function RecentTraceSection({ traces }) {
  return (
    <section className="home-section recent-section">
      <div className="section-head">
        <div>
          <h2>
            <svg className="section-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7V12L15.5 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            최근 남겨진 흔적
          </h2>
          <p>방금 이 공간에 새로운 흔적이 남겨졌어요.</p>
        </div>
        <button type="button" className="more-btn">
          더보기 <span>›</span>
        </button>
      </div>

      <div className="recent-list">
        {traces.map((trace) => (
          <RecentTraceItem key={trace.id} trace={trace} />
        ))}
      </div>
    </section>
  )
}

export default RecentTraceSection
