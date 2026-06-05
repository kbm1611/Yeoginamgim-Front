import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getVisibleProfileImageUrl, normalizeMyPageData } from './MyPage.utils.js'

test('normalizeMyPageData builds profile and stats from API responses', () => {
  const result = normalizeMyPageData({
    user: {
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
  })
})

test('normalizeMyPageData handles empty API responses without invented values', () => {
  const result = normalizeMyPageData({
    user: { email: 'empty@example.com' },
    myTracesResponse: null,
    archiveBoardsResponse: null,
  })

  assert.deepEqual(result.profile, {
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
  })
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
