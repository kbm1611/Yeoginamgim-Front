import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractDistrictFromAddressResult, readCachedDistrict } from './locationDistrict.js'

test('extractDistrictFromAddressResult extracts Seoul districts from region 2 depth', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_1depth_name: '서울', region_2depth_name: '성동구' },
        address: { region_1depth_name: '서울', region_2depth_name: '강남구' },
      },
    ]),
    '성동구'
  )
})

test('extractDistrictFromAddressResult extracts direct city districts from region 2 depth', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_1depth_name: '경기', region_2depth_name: '수원시 장안구' },
        address: { region_1depth_name: '경기', region_2depth_name: '수원시' },
      },
    ]),
    '수원시 장안구'
  )
})

test('extractDistrictFromAddressResult combines city and district depth when needed', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_1depth_name: '경기', region_2depth_name: '성남시', region_3depth_name: '분당구' },
        address: { region_1depth_name: '경기', region_2depth_name: '성남시', region_3depth_name: '분당구' },
      },
    ]),
    '성남시 분당구'
  )
})

test('extractDistrictFromAddressResult supports nationwide districts', () => {
  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_1depth_name: '부산', region_2depth_name: '부산진구' },
        address: { region_1depth_name: '부산', region_2depth_name: '동구' },
      },
    ]),
    '부산진구'
  )

  assert.equal(
    extractDistrictFromAddressResult([
      {
        road_address: { region_1depth_name: '제주특별자치도', region_2depth_name: '제주시' },
        address: { region_1depth_name: '제주특별자치도', region_2depth_name: '서귀포시' },
      },
    ]),
    '제주시'
  )
})

test('readCachedDistrict rejects cached unsupported districts', () => {
  const removedKeys = []
  globalThis.window = {
    localStorage: {
      getItem: () => JSON.stringify({
        district: '없는구',
        checkedAt: new Date().toISOString(),
      }),
      removeItem: (key) => removedKeys.push(key),
    },
  }

  assert.equal(readCachedDistrict(), null)
  assert.deepEqual(removedKeys, ['yeoginamgim.currentDistrict'])

  delete globalThis.window
})

test('readCachedDistrict accepts cached supported nationwide districts', () => {
  globalThis.window = {
    localStorage: {
      getItem: () => JSON.stringify({
        district: '부산진구',
        checkedAt: new Date().toISOString(),
      }),
      removeItem: () => {},
    },
  }

  assert.equal(readCachedDistrict().district, '부산진구')

  delete globalThis.window
})
