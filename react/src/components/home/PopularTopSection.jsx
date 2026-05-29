import TopPlaceCard from '../cards/TopPlaceCard'

function PopularTopSection({ places }) {
  return (
    <section className="home-section">
      <div className="section-head">
        <div>
          <h2>성수동 인기 공간 TOP 5</h2>
          <p>사람들이 오래 기억한 공간들이에요.</p>
        </div>
        <button type="button" className="more-btn">
          더보기 <span>›</span>
        </button>
      </div>

      <div className="top-scroll">
        {places.map((place) => (
          <TopPlaceCard key={place.rank} place={place} />
        ))}
      </div>
    </section>
  )
}

export default PopularTopSection
