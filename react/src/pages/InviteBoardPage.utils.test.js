import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildJoinedBoardRouteState, getJoinedBoardId } from './InviteBoardPage.utils.js'

test('getJoinedBoardId reads custom board ids from invite info fallback', () => {
  assert.equal(
    getJoinedBoardId(
      { userId: 7, nickname: 'guest', role: 'MEMBER' },
      { customBoardId: 33, boardTitle: 'Trip board' }
    ),
    33
  )
})

test('buildJoinedBoardRouteState can navigate after join response without board id', () => {
  assert.deepEqual(
    buildJoinedBoardRouteState(
      { userId: 7, nickname: 'guest', role: 'MEMBER' },
      { customBoardId: 33, boardTitle: 'Trip board' },
      'Fallback name'
    ),
    {
      boardId: 33,
      boardName: 'Trip board',
      boardType: 'CUSTOM',
    }
  )
})
