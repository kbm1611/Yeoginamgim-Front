import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const targets = [
  {
    inputPath: path.join(projectRoot, 'src/assets/editor/postit-yellow.png'),
    outputPath: path.join(projectRoot, 'src/assets/editor/postit-yellow-trimmed.png'),
  },
  {
    inputPath: path.join(projectRoot, 'src/assets/editor/polaroid-frame.png'),
    outputPath: path.join(projectRoot, 'src/assets/editor/polaroid-frame-trimmed.png'),
    trimMode: 'warm-paper',
  },
]
const alphaThreshold = 8
const padding = 12

async function trimPng(page, { inputPath, outputPath, trimMode = 'alpha' }) {
  const source = await fs.readFile(inputPath)
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`

  const result = await page.evaluate(async ({ dataUrl, alphaThreshold, padding, trimMode }) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUrl
    })

    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = image.naturalWidth
    sourceCanvas.height = image.naturalHeight

    const sourceContext = sourceCanvas.getContext('2d')
    sourceContext.drawImage(image, 0, 0)

    const { data, width, height } = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    const isContentPixel = (red, green, blue, alpha) => {
      if (alpha < alphaThreshold) return false

      if (trimMode === 'warm-paper') {
        const isNearWhiteBackground = red > 244 && green > 244 && blue > 244
        const isWarmPaperTone = red - blue > 3
        return !isNearWhiteBackground && isWarmPaperTone
      }

      return true
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4
        if (isContentPixel(data[index], data[index + 1], data[index + 2], data[index + 3])) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      throw new Error('No non-transparent pixels found.')
    }

    const cropX = Math.max(0, minX - padding)
    const cropY = Math.max(0, minY - padding)
    const cropRight = Math.min(width - 1, maxX + padding)
    const cropBottom = Math.min(height - 1, maxY + padding)
    const cropWidth = cropRight - cropX + 1
    const cropHeight = cropBottom - cropY + 1

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = cropWidth
    outputCanvas.height = cropHeight
    const outputContext = outputCanvas.getContext('2d')
    outputContext.drawImage(
      sourceCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    )

    if (trimMode === 'warm-paper') {
      const outputImage = outputContext.getImageData(0, 0, cropWidth, cropHeight)
      for (let y = 0; y < cropHeight; y += 1) {
        for (let x = 0; x < cropWidth; x += 1) {
          const index = (y * cropWidth + x) * 4
          const red = outputImage.data[index]
          const green = outputImage.data[index + 1]
          const blue = outputImage.data[index + 2]
          const alpha = outputImage.data[index + 3]

          if (!isContentPixel(red, green, blue, alpha)) {
            outputImage.data[index + 3] = 0
          }
        }
      }
      outputContext.putImageData(outputImage, 0, 0)
    }

    return {
      dataUrl: outputCanvas.toDataURL('image/png'),
      original: { width, height },
      bounds: { minX, minY, maxX, maxY },
      crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight, padding },
    }
  }, { dataUrl, alphaThreshold, padding, trimMode })

  await fs.writeFile(outputPath, Buffer.from(result.dataUrl.split(',')[1], 'base64'))
  return {
    input: path.relative(projectRoot, inputPath),
    output: path.relative(projectRoot, outputPath),
    original: result.original,
    bounds: result.bounds,
    crop: result.crop,
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    const results = []

    for (const target of targets) {
      results.push(await trimPng(page, target))
    }

    console.log(JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
