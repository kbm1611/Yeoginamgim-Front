const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function buildApiUrl(path, params = {}) {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}

export async function fetchPopularPlaces({ district, limit = 5 } = {}) {
  const url = buildApiUrl('/api/places/popular', { district, limit })
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch popular places: ${response.status}`)
  }

  return response.json()
}
