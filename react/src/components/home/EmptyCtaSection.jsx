import ctaMap from '../../assets/images/home/cta-map.svg'

function EmptyCtaSection() {
  return (
    <section className="empty-cta">
      <div className="empty-left">
        <img src={ctaMap} alt="" aria-hidden="true" />
        <div>
          <h3>아직 남긴 장소가 없어요</h3>
          <p>
            좋아하는 장소를 남기고
            <br />
            나만의 지도를 만들어보세요.
          </p>
        </div>
      </div>
      <button type="button" className="cta-btn">
        <span>+</span> 장소 남기기
      </button>
    </section>
  )
}

export default EmptyCtaSection
