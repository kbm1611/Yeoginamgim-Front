import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'

const tracesSource = fs.readFileSync(
  path.resolve('src/api/traces.js'),
  'utf8',
)

function loadTraceExports(apiClient = {}) {
  const module = new vm.SourceTextModule(
    tracesSource,
    { context: vm.createContext({ FormData }) },
  )

  const clientModule = new vm.SyntheticModule(
    ['apiClient', 'pathSegment'],
    function initializeClientModule() {
      this.setExport('apiClient', apiClient)
      this.setExport('pathSegment', (value) => encodeURIComponent(String(value)))
    },
    { context: module.context },
  )

  return module.link(async (specifier) => {
    if (specifier === './client') return clientModule
    throw new Error(`Unexpected import: ${specifier}`)
  })
    .then(() => module.evaluate())
    .then(() => module.namespace)
}

test('uploadTraceImage rejects files larger than 10MB before sending a request', async () => {
  let uploadCalled = false
  const { uploadTraceImage } = await loadTraceExports({
    upload: async () => {
      uploadCalled = true
      return { imageUrl: '/upload/board/trace.png' }
    },
  })

  const elevenMegabyteImage = new File(
    [new Uint8Array(11 * 1024 * 1024)],
    'large.png',
    { type: 'image/png' },
  )

  assert.throws(
    () => uploadTraceImage(elevenMegabyteImage),
    /10MB 이하의 이미지만 업로드할 수 있습니다/,
  )
  assert.equal(uploadCalled, false)
})

test('uploadTraceImage sends images up to 10MB', async () => {
  let uploadedFile = null
  const { uploadTraceImage } = await loadTraceExports({
    upload: async (_path, formData) => {
      uploadedFile = formData.get('file')
      return { imageUrl: '/upload/board/trace.png' }
    },
  })

  const tenMegabyteImage = new File(
    [new Uint8Array(10 * 1024 * 1024)],
    'limit.png',
    { type: 'image/png' },
  )

  const response = await uploadTraceImage(tenMegabyteImage)

  assert.equal(uploadedFile, tenMegabyteImage)
  assert.deepEqual(response, { imageUrl: '/upload/board/trace.png' })
})
