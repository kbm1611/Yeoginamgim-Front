import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildJoinedBoardRouteState,
  getInviteOwnerDisplayName,
  getJoinedBoardId,
} from './InviteBoardPage.utils.js'

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

test('getInviteOwnerDisplayName prefers board owner nickname from invite info', () => {
  assert.equal(
    getInviteOwnerDisplayName({
      ownerNickname: '민지',
      inviterNickname: '초대한 사람',
    }),
    '민지'
  )
})

test('getInviteOwnerDisplayName falls back to inviter nickname for older invite responses', () => {
  assert.equal(getInviteOwnerDisplayName({ inviterNickname: '보드장' }), '보드장')
})
