import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isLoadedKakaoMaps } from './kakaoMaps.js'

test('isLoadedKakaoMaps returns true when Kakao map constructors are ready', () => {
  assert.equal(
    isLoadedKakaoMaps({
      maps: {
        Map: function Map() {},
        LatLng: function LatLng() {},
        Marker: function Marker() {},
      },
    }),
    true
  )
})

test('isLoadedKakaoMaps returns false while SDK script exists but maps are not initialized', () => {
  assert.equal(isLoadedKakaoMaps({ maps: { load: function load() {} } }), false)
  assert.equal(isLoadedKakaoMaps(null), false)
})
