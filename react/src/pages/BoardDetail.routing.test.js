import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BOARD_TYPE, resolveBoardType } from './BoardDetail.routing.js'

test('resolveBoardType treats customBoardId responses as custom boards without location state', () => {
  assert.equal(resolveBoardType('42', null, { customBoardId: 42 }), BOARD_TYPE.CUSTOM)
})

test('resolveBoardType keeps explicit location state when present', () => {
  assert.equal(resolveBoardType('42', { boardType: BOARD_TYPE.CUSTOM }, { boardId: 42 }), BOARD_TYPE.CUSTOM)
  assert.equal(resolveBoardType('custom-42', { boardType: BOARD_TYPE.PLACE }, { customBoardId: 42 }), BOARD_TYPE.PLACE)
})
