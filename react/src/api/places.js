import { apiClient } from './client'

// 구별 인기장소 조회
export async function fetchPopularPlaces({ district, limit = 5 } = {}) {
  return apiClient.get('/api/places/popular', { district, limit })
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
