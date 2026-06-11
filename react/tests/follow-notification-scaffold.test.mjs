import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (path) => readFileSync(join(root, path), 'utf8')

test('notification API and page scaffold match backend notification endpoints', () => {
  const notificationsApi = read('src/api/notifications.js')
  const notificationPage = read('src/pages/NotificationPage.jsx')
  const app = read('src/App.jsx')
  const bottomNavigation = read('src/components/BottomNavigation.jsx')
  const notificationButton = read('src/components/NotificationButton.jsx')
  const homePage = read('src/pages/HomePage.jsx')
  const mapPage = read('src/pages/Map.jsx')
  const archivePage = read('src/pages/ArchivePage.jsx')
  const myPage = read('src/pages/MyPage.jsx')

  assert.match(notificationsApi, /apiClient\.get\('\/api\/notifications'\)/)
  assert.match(notificationsApi, /apiClient\.get\('\/api\/notifications\/unread-count'\)/)
  assert.match(notificationsApi, /apiClient\.patch\(`\/api\/notifications\/\$\{pathSegment\(notificationId\)\}\/read`\)/)
  assert.match(notificationsApi, /apiClient\.patch\('\/api\/notifications\/read-all'\)/)

  assert.match(notificationPage, /fetchNotifications/)
  assert.match(notificationPage, /markNotificationAsRead/)
  assert.match(notificationPage, /markAllNotificationsAsRead/)
  assert.match(notificationPage, /traceId/)
  assert.match(notificationPage, /boardId/)
  assert.match(notificationPage, /navigate\(`\/board\/\$\{notification\.boardId\}\/trace\/\$\{notification\.traceId\}`\)/)
  assert.match(app, /path="\/notifications"/)
  assert.match(notificationButton, /fetchUnreadNotificationCount/)
  assert.match(notificationButton, /navigate\('\/notifications'\)/)
  assert.doesNotMatch(bottomNavigation, /path: '\/notifications'|key: 'notifications'|fetchUnreadNotificationCount/)
  assert.match(bottomNavigation, /grid-cols-5/)
  assert.match(homePage, /<NotificationButton/)
  assert.match(mapPage, /<NotificationButton/)
  assert.match(archivePage, /<NotificationButton/)
  assert.match(myPage, /<NotificationButton/)
})

test('follow API and list page scaffold match backend follow endpoints', () => {
  const followsApi = read('src/api/follows.js')
  const followListPage = read('src/pages/FollowListPage.jsx')
  const app = read('src/App.jsx')

  assert.match(followsApi, /apiClient\.post\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/follow`\)/)
  assert.match(followsApi, /apiClient\.delete\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/follow`\)/)
  assert.match(followsApi, /apiClient\.get\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/follow-status`\)/)
  assert.match(followsApi, /apiClient\.get\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/followers`\)/)
  assert.match(followsApi, /apiClient\.get\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/followings`\)/)

  assert.match(followListPage, /fetchFollowers/)
  assert.match(followListPage, /fetchFollowings/)
  assert.match(followListPage, /useParams/)
  assert.match(app, /path="\/users\/:userId\/followers"/)
  assert.match(app, /path="\/users\/:userId\/followings"/)
})
