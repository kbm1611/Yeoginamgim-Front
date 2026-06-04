export const DEFAULT_HOME_PERIOD = 'today'

export const HOME_PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'year', label: '년간' },
]

export const ALL_DISTRICTS_LABEL = '전체'

export const SEOUL_DISTRICTS = [
  '강남구',
  '강동구',
  '강북구',
  '강서구',
  '관악구',
  '광진구',
  '구로구',
  '금천구',
  '노원구',
  '도봉구',
  '동대문구',
  '동작구',
  '마포구',
  '서대문구',
  '서초구',
  '성동구',
  '성북구',
  '송파구',
  '양천구',
  '영등포구',
  '용산구',
  '은평구',
  '종로구',
  '중구',
  '중랑구',
]

export function normalizeHomeDistrict(districtInfo) {
  const district = String(districtInfo?.district ?? '').trim()
  return SEOUL_DISTRICTS.includes(district) ? district : ALL_DISTRICTS_LABEL
}

export function filterSeoulDistricts(query) {
  const normalizedQuery = String(query ?? '').trim()
  if (!normalizedQuery) return SEOUL_DISTRICTS

  return SEOUL_DISTRICTS.filter((district) => district.includes(normalizedQuery))
}

export function buildHomePlaceParams({ period = DEFAULT_HOME_PERIOD, district, limit = 5 } = {}) {
  return buildHomeScopedParams({ period, district, limit })
}

export function buildHomeTraceParams({ period = DEFAULT_HOME_PERIOD, district, limit = 5 } = {}) {
  return buildHomeScopedParams({ period, district, limit })
}

function buildHomeScopedParams({ period, district, limit }) {
  const params = { period, limit }
  if (district && district !== ALL_DISTRICTS_LABEL) {
    params.district = district
  }
  return params
}
