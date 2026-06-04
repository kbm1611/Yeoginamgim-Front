import { apiClient } from './client'

// 사용자 위치 기준 주변 인기장소 조회
export async function fetchPopularPlaces({ latitude, longitude, radius, district, period, limit = 5 } = {}) {
  return apiClient.get('/api/places/popular', {
    latitude,
    longitude,
    radius,
    district,
    period,
    limit,
  })
}

// 근처 장소 조회
export async function fetchNearbyPlaces({ latitude, longitude, radius, category, query, page, limit } = {}) {
  return apiClient.get('/api/places/nearby', {
    latitude,
    longitude,
    radius,
    category,
    query,
    page,
    limit,
  })
}

// 키워드 기반 POI 검색
export async function fetchPoiPlaces({ query, latitude, longitude, radius, page, limit } = {}) {
  return apiClient.get('/api/places/search', {
    query,
    latitude,
    longitude,
    radius,
    page,
    limit,
  })
}
