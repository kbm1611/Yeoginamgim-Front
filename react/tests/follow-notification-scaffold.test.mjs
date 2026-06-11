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

  assert.match(notificationsApi, /apiClient\.get\('\/api\/notifications'\)/)
  assert.match(notificationsApi, /apiClient\.get\('\/api\/notifications\/unread-count'\)/)
  assert.match(notificationsApi, /apiClient\.patch\(`\/api\/notifications\/\$\{pathSegment\(notificationId\)\}\/read`\)/)
  assert.match(notificationsApi, /apiClient\.patch\('\/api\/notifications\/read-all'\)/)

  assert.match(notificationPage, /fetchNotifications/)
  assert.match(notificationPage, /markNotificationAsRead/)
  assert.match(notificationPage, /markAllNotificationsAsRead/)
  assert.match(notificationPage, /traceId/)
  assert.match(app, /path="\/notifications"/)
  assert.match(bottomNavigation, /path: '\/notifications'/)
})

test('follow API and list page scaffold match backend follow endpoints', () => {
  const followsApi = read('src/api/follows.js')
  const followListPage = read('src/pages/FollowListPage.jsx')
  const app = read('src/App.jsx')

  assert.match(followsApi, /apiClient\.post\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/follow`\)/)
  assert.match(followsApi, /apiClient\.delete\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/follow`\)/)
  assert.match(followsApi, /apiClient\.get\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/followers`\)/)
  assert.match(followsApi, /apiClient\.get\(`\/api\/users\/\$\{pathSegment\(userId\)\}\/followings`\)/)

  assert.match(followListPage, /fetchFollowers/)
  assert.match(followListPage, /fetchFollowings/)
  assert.match(followListPage, /useParams/)
  assert.match(app, /path="\/users\/:userId\/followers"/)
  assert.match(app, /path="\/users\/:userId\/followings"/)
})
