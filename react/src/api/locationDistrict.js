const DISTRICT_CACHE_KEY = 'yeoginamgim.currentDistrict'
const DISTRICT_CACHE_TTL_MS = 30 * 60 * 1000
const KAKAO_SCRIPT_ID = 'kakao-map-sdk'

let kakaoScriptPromise = null

export function readCachedDistrict() {
  try {
    const rawValue = window.localStorage.getItem(DISTRICT_CACHE_KEY)
    if (!rawValue) return null

    const cached = JSON.parse(rawValue)
    if (!cached?.district || !cached?.checkedAt) return null

    const checkedAt = new Date(cached.checkedAt).getTime()
    if (Number.isNaN(checkedAt) || Date.now() - checkedAt > DISTRICT_CACHE_TTL_MS) {
      window.localStorage.removeItem(DISTRICT_CACHE_KEY)
      return null
    }

    return cached
  } catch {
    window.localStorage.removeItem(DISTRICT_CACHE_KEY)
    return null
  }
}

export async function resolveCurrentDistrict({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readCachedDistrict()
    if (cached) return cached
  }

  try {
    const position = await getCurrentPosition()
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    const district = await reverseGeocodeDistrict(latitude, longitude)

    if (!district) return null

    const resolvedDistrict = {
      district,
      latitude,
      longitude,
      checkedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(DISTRICT_CACHE_KEY, JSON.stringify(resolvedDistrict))
    return resolvedDistrict
  } catch {
    return null
  }
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 8000,
    })
  })
}

async function reverseGeocodeDistrict(latitude, longitude) {
  const kakao = await ensureKakaoMaps()

  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.coord2Address(longitude, latitude, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result?.length) {
        resolve(null)
        return
      }

      const firstResult = result[0]
      resolve(
        firstResult.road_address?.region_2depth_name
          ?? firstResult.address?.region_2depth_name
          ?? null
      )
    })
  })
}

function ensureKakaoMaps() {
  if (window.kakao?.maps?.services?.Geocoder) {
    return Promise.resolve(window.kakao)
  }

  const kakaoJavaScriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
  if (!kakaoJavaScriptKey) {
    return Promise.reject(new Error('Kakao JavaScript key is not configured.'))
  }

  if (!kakaoScriptPromise) {
    kakaoScriptPromise = new Promise((resolve, reject) => {
      const finishLoading = () => {
        window.kakao.maps.load(() => resolve(window.kakao))
      }

      const existingScript = document.getElementById(KAKAO_SCRIPT_ID)
      if (existingScript) {
        if (window.kakao?.maps) {
          finishLoading()
          return
        }
        existingScript.addEventListener('load', finishLoading, { once: true })
        existingScript.addEventListener('error', reject, { once: true })
        return
      }

      const script = document.createElement('script')
      script.id = KAKAO_SCRIPT_ID
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoJavaScriptKey)}&libraries=services&autoload=false`
      script.addEventListener('load', finishLoading, { once: true })
      script.addEventListener('error', reject, { once: true })
      document.head.appendChild(script)
    })
  }

  return kakaoScriptPromise
}
