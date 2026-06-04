import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeMyPageData } from './MyPage.utils.js'

test('normalizeMyPageData builds profile and stats from API responses', () => {
  const result = normalizeMyPageData({
    user: {
      email: 'user@example.com',
      nickname: '여김이',
      profileImageUrl: '/upload/profile/me.png',
      birthDate: '990101',
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
    initial: 'E',
  })
  assert.deepEqual(result.stats, {
    traceCount: 0,
    archiveBoardCount: 0,
    receivedLikeCount: 0,
  })
})
