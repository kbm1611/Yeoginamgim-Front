import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  STATS_PARTIAL_FAILURE_MESSAGE,
  getVisibleProfileImageUrl,
  loadMyPageData,
  normalizeMyPageData,
} from './MyPage.utils.js'

test('normalizeMyPageData builds profile and stats from API responses', () => {
  const result = normalizeMyPageData({
    user: {
      userId: 7,
      email: 'user@example.com',
      nickname: '여김이',
      profileImageUrl: '/upload/profile/me.png',
      birthDate: '990101',
      provider: 'LOCAL',
    },
    myTracesResponse: {
      traces: [
        {
          traceId: 3,
          boardId: 9,
          createdAt: '2026-06-01T10:00:00',
          likeCount: 2,
          elements: [{ contentType: 'TEXT', textContent: '좋았던 자리' }],
        },
        {
          traceId: 2,
          boardId: 8,
          createdAt: '2026-05-28T10:00:00',
          likeCount: 1,
          elements: [{ contentType: 'IMAGE', imageUrl: '/upload/trace/a.png' }],
        },
      ],
    },
    archiveBoardsResponse: {
      boards: [{ boardId: 9 }, { boardId: 8 }],
    },
  })

  assert.deepEqual(result.profile, {
    userId: 7,
    email: 'user@example.com',
    nickname: '여김이',
    profileImageUrl: '/upload/profile/me.png',
    birthDate: '990101',
    provider: 'LOCAL',
    initial: '여',
  })
  assert.deepEqual(result.stats, {
    traceCount: 2,
    archiveBoardCount: 2,
    receivedLikeCount: 3,
    isPartial: false,
    message: '',
  })
})

test('normalizeMyPageData handles empty API responses without invented values', () => {
  const result = normalizeMyPageData({
    user: { email: 'empty@example.com' },
    myTracesResponse: null,
    archiveBoardsResponse: null,
  })

  assert.deepEqual(result.profile, {
    userId: null,
    email: 'empty@example.com',
    nickname: 'empty',
    profileImageUrl: '',
    birthDate: '',
    provider: 'LOCAL',
    initial: 'E',
  })
  assert.deepEqual(result.stats, {
    traceCount: 0,
    archiveBoardCount: 0,
    receivedLikeCount: 0,
    isPartial: false,
    message: '',
  })
})

test('loadMyPageData keeps profile ready when a non-auth stats API fails', async () => {
  const result = await loadMyPageData({
    fetchMyInfo: async () => ({ email: 'user@example.com', nickname: 'user' }),
    fetchMyTraces: async () => {
      const error = new Error('server failed')
      error.status = 500
      throw error
    },
    fetchArchiveBoards: async () => ({ boards: [{ boardId: 1 }] }),
  })

  assert.equal(result.profile.email, 'user@example.com')
  assert.deepEqual(result.stats, {
    traceCount: 0,
    archiveBoardCount: 1,
    receivedLikeCount: 0,
    isPartial: true,
    message: STATS_PARTIAL_FAILURE_MESSAGE,
  })
})

test('loadMyPageData propagates myinfo failures so the page can show its main error state', async () => {
  const myInfoError = new Error('myinfo failed')
  myInfoError.status = 500

  await assert.rejects(
    () => loadMyPageData({
      fetchMyInfo: async () => {
        throw myInfoError
      },
      fetchMyTraces: async () => ({ traces: [] }),
      fetchArchiveBoards: async () => ({ boards: [] }),
    }),
    myInfoError,
  )
})

test('loadMyPageData propagates stats API 401 errors so auth redirect still runs', async () => {
  const unauthorizedError = new Error('unauthorized')
  unauthorizedError.status = 401

  await assert.rejects(
    () => loadMyPageData({
      fetchMyInfo: async () => ({ email: 'user@example.com', nickname: 'user' }),
      fetchMyTraces: async () => ({ traces: [] }),
      fetchArchiveBoards: async () => {
        throw unauthorizedError
      },
    }),
    unauthorizedError,
  )
})

test('getVisibleProfileImageUrl returns empty when the current profile image failed to load', () => {
  const result = getVisibleProfileImageUrl(
    'https://lh3.googleusercontent.com/a/profile=s96-c',
    true,
    'http://localhost:8080',
  )

  assert.equal(result, '')
})

test('getVisibleProfileImageUrl resolves local upload paths against the API base URL', () => {
  const result = getVisibleProfileImageUrl(
    '/upload/profile/me.png',
    false,
    'http://localhost:8080',
  )

  assert.equal(result, 'http://localhost:8080/upload/profile/me.png')
})
