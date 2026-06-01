const categories = ['전체', '카페', '맛집', '편집샵', '공원', '문화', '기타']

function RegionAndChips() {
  return (
    <section className="home-filters">
      <div className="region-bar">
        <button type="button" className="region-button region-left">
          <svg className="filter-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21S5 14.8 5 8.9C5 5.1 8.1 2 12 2s7 3.1 7 6.9C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <circle cx="12" cy="8.9" r="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          </svg>
          <span>성수동</span>
          <svg className="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 9.5L12 14.5L17 9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="region-divider" aria-hidden="true" />

        <button type="button" className="region-button region-right">
          <span>인기순</span>
          <svg className="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 9.5L12 14.5L17 9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="chip-row">
        {categories.map((category, index) => (
          <button key={category} type="button" className={`chip ${index === 0 ? 'is-active' : ''}`}>
            {category}
          </button>
        ))}
      </div>
    </section>
  )
}

export default RegionAndChips
