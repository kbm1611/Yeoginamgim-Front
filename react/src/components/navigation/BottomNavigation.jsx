import iconHome from '../../assets/icons/nav/home.svg'
import iconMap from '../../assets/icons/nav/map.svg'
import iconAdd from '../../assets/icons/nav/add.svg'
import iconArchive from '../../assets/icons/nav/archive.svg'
import iconMy from '../../assets/icons/nav/my.svg'

function BottomNavigation() {
  return (
    <nav className="bottom-nav">
      <button type="button" className="nav-item is-active">
        <span className="active-chip">
          <img src={iconHome} alt="" className="nav-img" aria-hidden="true" />
        </span>
        <span>홈</span>
      </button>
      <button type="button" className="nav-item">
        <img src={iconMap} alt="" className="nav-img" aria-hidden="true" />
        <span>지도</span>
      </button>
      <button type="button" className="plus-item" aria-label="장소 남기기">
        <span className="plus-circle">
          <img src={iconAdd} alt="" className="plus-img" aria-hidden="true" />
        </span>
      </button>
      <button type="button" className="nav-item">
        <img src={iconArchive} alt="" className="nav-img" aria-hidden="true" />
        <span>보관함</span>
      </button>
      <button type="button" className="nav-item">
        <img src={iconMy} alt="" className="nav-img" aria-hidden="true" />
        <span>마이</span>
      </button>
    </nav>
  )
}

export default BottomNavigation
