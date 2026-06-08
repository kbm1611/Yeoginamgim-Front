import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

test('auth pages and API helpers are wired to backend auth, user, and OAuth endpoints', () => {
  const authApi = read('src/api/auth.js')
  const usersApi = read('src/api/users.js')
  const loginPage = read('src/pages/LoginPage.jsx')
  const signupPage = read('src/pages/SignupPage.jsx')
  const oauthCallbackPage = read('src/pages/OAuthCallbackPage.jsx')

  assert.match(authApi, /apiClient\.post\('\/api\/auth\/login'/)
  assert.match(authApi, /buildApiUrl\('\/api\/auth\/oauth\/kakao'\)/)
  assert.match(authApi, /buildApiUrl\('\/api\/auth\/oauth\/google'\)/)
  assert.match(authApi, /apiClient\.post\('\/api\/auth\/email\/send'/)
  assert.match(authApi, /apiClient\.post\('\/api\/auth\/email\/verify'/)
  assert.match(usersApi, /apiClient\.formData\('\/api\/user\/signup'/)
  assert.match(usersApi, /apiClient\.get\('\/api\/user\/myinfo'\)/)

  assert.match(loginPage, /await login\(\{[\s\S]*email: form\.email\.trim\(\),[\s\S]*password: form\.password/)
  assert.match(loginPage, /onClick=\{redirectToKakaoOAuth\}/)
  assert.match(loginPage, /onClick=\{redirectToGoogleOAuth\}/)
  assert.match(signupPage, /await signupUser\(signupData\)/)
  assert.match(oauthCallbackPage, /setAuthToken\(token\)/)
  assert.match(oauthCallbackPage, /navigate\('\/home', \{ replace: true \}\)/)
})

test('map discovery flow uses real place lookup APIs and board entry helpers', () => {
  const placesApi = read('src/api/places.js')
  const boardsApi = read('src/api/boards.js')
  const mapPage = read('src/pages/Map.jsx')
  const nearbyHook = read('src/features/map/hooks/useNearbyPlaces.js')
  const popularHook = read('src/features/map/hooks/usePopularPlaces.js')
  const searchHook = read('src/features/map/hooks/usePlaceSearch.js')
  const enterBoardHook = read('src/features/map/hooks/useEnterBoard.js')
  const selectedPlaceCard = read('src/features/map/components/SelectedPlaceCard.jsx')

  assert.match(placesApi, /apiClient\.get\('\/api\/places\/nearby'/)
  assert.match(placesApi, /apiClient\.get\('\/api\/places\/search'/)
  assert.match(placesApi, /apiClient\.get\('\/api\/places\/popular'/)
  assert.match(boardsApi, /apiClient\.get\(`\/api\/places\/\$\{pathSegment\(kakaoPlaceId\)\}\/board`\)/)
  assert.match(boardsApi, /apiClient\.post\('\/api\/boards'/)

  assert.match(mapPage, /useCurrentLocation\(/)
  assert.match(mapPage, /useNearbyPlaces\(/)
  assert.match(mapPage, /usePopularPlaces\(/)
  assert.match(nearbyHook, /await fetchNearbyPlaces\(request\)/)
  assert.match(popularHook, /await fetchPopularPlaces\(request\)/)
  assert.match(searchHook, /await fetchPoiPlaces\(request\)/)
  assert.match(enterBoardHook, /fetchOrCreateBoardForPlace\(place\)/)
  assert.match(selectedPlaceCard, /place\.placeName/)
  assert.match(selectedPlaceCard, /place\.groupName/)
  assert.match(selectedPlaceCard, /traceCountLabel/)
  assert.match(selectedPlaceCard, /onClick=\{onOpenBoard\}/)
})

test('home preview flow is API-backed for popular places and recent traces, but liked-trace preview is not wired yet', () => {
  const homePage = read('src/pages/HomePage.jsx')
  const topPlacesSection = read('src/components/TopPlacesSection.jsx')
  const recentTracesSection = read('src/components/RecentTracesSection.jsx')
  const archiveApi = read('src/api/archive.js')

  assert.match(homePage, /<TopPlacesSection/)
  assert.match(homePage, /<RecentTracesSection/)
  assert.match(topPlacesSection, /await fetchPopularPlaces\(buildHomePlaceParams/)
  assert.match(topPlacesSection, /fetchOrCreateBoardForPlace\(place\)/)
  assert.match(recentTracesSection, /await fetchRecentTraces\(buildHomeTraceParams/)
  assert.match(archiveApi, /fetchReceivedLikeTraces/)
  assert.match(archiveApi, /\/api\/me\/received-likes/)

  assert.doesNotMatch(homePage, /fetchReceivedLikeTraces|received-likes|likeCount/)
  assert.doesNotMatch(topPlacesSection + recentTracesSection, /fetchReceivedLikeTraces|received-likes/)
})
