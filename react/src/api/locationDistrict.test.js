import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractDistrictFromAddressResult, readCachedDistrict } from './locationDistrict.js'

test('extractDistrictFromAddressResult prefers road address district over address district', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_2depth_name: '성동구' },
        address: { region_2depth_name: '강남구' },
      },
    ]),
    '성동구'
  )
})

test('extractDistrictFromAddressResult falls back to address district', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: null,
        address: { region_2depth_name: '마포구' },
      },
    ]),
    '마포구'
  )
})

test('readCachedDistrict rejects cached non-Seoul districts', () => {
  const removedKeys = []
  globalThis.window = {
    localStorage: {
      getItem: () => JSON.stringify({
        district: '부산진구',
        checkedAt: new Date().toISOString(),
      }),
      removeItem: (key) => removedKeys.push(key),
    },
  }

  assert.equal(readCachedDistrict(), null)
  assert.deepEqual(removedKeys, ['yeoginamgim.currentDistrict'])

  delete globalThis.window
})
