import { ensureKakaoMaps } from './kakaoMaps.js'
import { isSupportedDistrict } from '../utils/pages/HomePage.utils.js'

const DISTRICT_CACHE_KEY = 'yeoginamgim.currentDistrict'
const DISTRICT_CACHE_TTL_MS = 30 * 60 * 1000

export function readCachedDistrict() {
  try {
    const rawValue = window.localStorage.getItem(DISTRICT_CACHE_KEY)
    if (!rawValue) return null

    const cached = JSON.parse(rawValue)
    if (!cached?.district || !cached?.checkedAt || !isSupportedDistrict(cached.district)) {
      window.localStorage.removeItem(DISTRICT_CACHE_KEY)
      return null
    }

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

    if (!isSupportedDistrict(district)) return null

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

      resolve(extractDistrictFromAddressResult(result))
    })
  })
}

export function extractDistrictFromAddressResult(result) {
  if (!Array.isArray(result) || result.length === 0) return null

  return extractSupportedDistrict(result[0].road_address) ?? extractSupportedDistrict(result[0].address) ?? null
}

function extractSupportedDistrict(address) {
  if (!address) return null

  const region2 = String(address.region_2depth_name ?? '').trim()
  const region3 = String(address.region_3depth_name ?? '').trim()
  const combined = [region2, region3].filter(Boolean).join(' ')

  if (isSupportedDistrict(combined)) return combined
  if (isSupportedDistrict(region2)) return region2
  if (isSupportedDistrict(region3)) return region3

  return null
}
