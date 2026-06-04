import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildBoardRequestFromPlace, resolveBoardForPlace } from './boards.utils.js'

test('resolveBoardForPlace returns existing board id without backend calls', async () => {
  let didFetch = false
  let didCreate = false

  const board = await resolveBoardForPlace(
    { kakaoPlaceId: '12345', boardId: 27 },
    {
      fetchBoardByKakaoPlaceId: async () => {
        didFetch = true
      },
      createBoard: async () => {
        didCreate = true
      },
    }
  )

  assert.deepEqual(board, { boardId: 27 })
  assert.equal(didFetch, false)
  assert.equal(didCreate, false)
})

test('resolveBoardForPlace creates a board from the place snapshot when lookup returns 404', async () => {
  const place = {
    kakaoPlaceId: '12345',
    placeName: 'Seongsu Cafe',
    latitude: 37.5447,
    longitude: 127.0559,
    phone: '02-000-0000',
    address: 'Seoul Seongsu',
    kakaoMapUrl: 'https://place.map.kakao.com/12345',
    groupName: '카페',
  }
  let createPayload = null
  const notFoundError = new Error('not found')
  notFoundError.status = 404

  const board = await resolveBoardForPlace(place, {
    fetchBoardByKakaoPlaceId: async () => {
      throw notFoundError
    },
    createBoard: async (payload) => {
      createPayload = payload
      return { boardId: 31 }
    },
  })

  assert.deepEqual(createPayload, buildBoardRequestFromPlace(place))
  assert.deepEqual(board, { boardId: 31 })
})

test('resolveBoardForPlace preserves non-404 lookup failures', async () => {
  let didCreate = false
  const serverError = new Error('server failed')
  serverError.status = 500

  await assert.rejects(
    () =>
      resolveBoardForPlace(
        { kakaoPlaceId: '12345', placeName: 'Seongsu Cafe' },
        {
          fetchBoardByKakaoPlaceId: async () => {
            throw serverError
          },
          createBoard: async () => {
            didCreate = true
          },
        }
      ),
    serverError
  )
  assert.equal(didCreate, false)
})
