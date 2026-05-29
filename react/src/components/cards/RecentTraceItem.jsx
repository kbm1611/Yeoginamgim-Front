function RecentTraceItem({ trace }) {
  return (
    <article className="recent-item">
      <img src={trace.image} alt={trace.place} className="recent-thumb" />

      <div className="recent-content">
        <div className="recent-title-row">
          <h4>{trace.place}</h4>
          <span className="tag">{trace.category}</span>
        </div>
        <p className="recent-message">“{trace.message}”</p>
      </div>

      <div className="recent-side">
        <span>{trace.time}</span>
        <img src={trace.avatar} alt="작성자" className="recent-avatar" />
      </div>
    </article>
  )
}

export default RecentTraceItem
