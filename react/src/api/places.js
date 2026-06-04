import { apiClient } from './client'

// Popular places near the current location
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

// Nearby places
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

// Keyword-based POI search
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
