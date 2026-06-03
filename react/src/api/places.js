import { apiClient } from './client'

export async function fetchPopularPlaces({ district, limit = 5 } = {}) {
  return apiClient.get('/api/places/popular', { district, limit })
}

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
