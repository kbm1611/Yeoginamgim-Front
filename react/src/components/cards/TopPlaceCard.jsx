function TopPlaceCard({ place }) {
  return (
    <article className="top-card">
      <div className="top-image-wrap">
        <img src={place.image} alt={place.name} className="top-image" />
        <span className="rank-badge">{place.rank}</span>
      </div>

      <div className="top-content">
        <h3>{place.name}</h3>
        <span className="tag">{place.category}</span>
        <p className="quote">"{place.message}"</p>
        <p className="count">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="7.4" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5 20c.7-4 3.4-6 7-6s6.3 2 7 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {place.traces}개의 흔적
        </p>
      </div>
    </article>
  )
}

export default TopPlaceCard
