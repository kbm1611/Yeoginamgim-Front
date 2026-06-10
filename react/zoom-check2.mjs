import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/zoom-check2'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
const page = await ctx.newPage()
const ss = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('📸', n) }
const wait = ms => page.waitForTimeout(ms)

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2500)

await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)

// 기본 상태
await ss('01-default')

// 줌 버튼 상태 확인
const zoomIn = await page.$('button[aria-label="확대"]')
const zoomOut = await page.$('button[aria-label="축소"]')
console.log('줌인 버튼:', !!zoomIn)
console.log('줌아웃 버튼:', !!zoomOut)

// 현재 scale 값
const getScale = () => page.evaluate(() => {
  const el = document.querySelector('[style*="scale"]') 
  const allDivs = document.querySelectorAll('div[style]')
  for (const d of allDivs) {
    const t = d.style.transform
    if (t && t.includes('scale')) return t
  }
  return null
})

console.log('초기 transform:', await getScale())

// 줌인 1번
await zoomIn?.click(); await wait(600)
await ss('02-zoom-in-1')
console.log('줌인1 transform:', await getScale())

// 줌인 2번
await zoomIn?.click(); await wait(600)
await ss('03-zoom-in-2')
console.log('줌인2 transform:', await getScale())

// 줌인 3번
await zoomIn?.click(); await wait(600)
await ss('04-zoom-in-3')
console.log('줌인3 transform:', await getScale())

// 줌아웃 1번
await zoomOut?.click(); await wait(600)
await ss('05-zoom-out-1')

// 줌아웃 2번
await zoomOut?.click(); await wait(600)
await ss('06-zoom-out-2')

// 줌아웃 3번
await zoomOut?.click(); await wait(600)
await ss('07-zoom-out-3')

// 줌아웃 4번
await zoomOut?.click(); await wait(600)
await ss('08-zoom-out-4')
console.log('줌아웃4 transform:', await getScale())

// 리셋 버튼
const resetBtn = await page.$('button[aria-label="초기화"], button[aria-label="리셋"]')
console.log('리셋 버튼:', !!resetBtn)

await browser.close()
console.log('Done:', OUT)
