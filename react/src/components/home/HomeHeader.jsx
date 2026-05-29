import logo from '../../assets/images/logo/logo-home.svg'

function HomeHeader() {
  return (
    <header className="home-header">
      <div className="brand-lockup">
        <img src={logo} alt="여기남김" className="brand-logo-image" />
      </div>
    </header>
  )
}

export default HomeHeader
