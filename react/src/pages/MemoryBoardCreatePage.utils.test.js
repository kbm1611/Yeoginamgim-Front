import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createVerifiedCustomBoard, getCreatedBoardId } from './MemoryBoardCreatePage.utils.js'

test('getCreatedBoardId reads custom board id from create response', () => {
  assert.equal(getCreatedBoardId({ customBoardId: 42 }), 42)
})

test('createVerifiedCustomBoard verifies created board before returning route state', async () => {
  const routeState = await createVerifiedCustomBoard(
    {
      createCustomBoard: async () => ({ customBoardId: 42, boardTitle: 'Draft name' }),
      getCustomBoard: async (boardId) => ({ customBoardId: boardId, boardTitle: 'Verified name' }),
    },
    { boardTitle: 'Draft name' },
    { fallbackName: 'Fallback', coverImage: 'blob:image', description: 'Memo' }
  )

  assert.deepEqual(routeState, {
    boardId: 42,
    boardName: 'Verified name',
    boardType: 'CUSTOM',
    coverImage: 'blob:image',
    description: 'Memo',
  })
})

test('createVerifiedCustomBoard rejects when created board cannot be verified', async () => {
  await assert.rejects(
    () =>
      createVerifiedCustomBoard(
        {
          createCustomBoard: async () => ({ customBoardId: 42 }),
          getCustomBoard: async () => {
            throw new TypeError('Failed to fetch')
          },
        },
        { boardTitle: 'Draft name' },
        { fallbackName: 'Fallback' }
      ),
    /created custom board could not be verified/i
  )
})
