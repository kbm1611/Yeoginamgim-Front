import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/zoom-check'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
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
await ss('01-default')

// 줌인 3번
const zoomIn = await page.$('button[aria-label="확대"]')
for (let i = 0; i < 3; i++) { await zoomIn?.click(); await wait(400) }
await ss('02-zoom-in-3x')

// 줌인 추가 3번 (최대)
for (let i = 0; i < 3; i++) { await zoomIn?.click(); await wait(400) }
await ss('03-zoom-in-max')

// 줌아웃 3번
const zoomOut = await page.$('button[aria-label="축소"]')
for (let i = 0; i < 3; i++) { await zoomOut?.click(); await wait(400) }
await ss('04-zoom-out-3x')

// 줌아웃 최대
for (let i = 0; i < 6; i++) { await zoomOut?.click(); await wait(400) }
await ss('05-zoom-out-max')

// 줌 현재 값 출력
const scaleInfo = await page.evaluate(() => {
  const canvas = document.querySelector('[data-board-canvas]') 
    ?? document.querySelector('.overflow-hidden > div > div')
  return canvas ? getComputedStyle(canvas).transform : 'not found'
})
console.log('transform:', scaleInfo)

// 디폴트로 복귀
for (let i = 0; i < 10; i++) { await zoomIn?.click(); await wait(200) }
await wait(500)
await ss('06-back-to-normal')

// 핀치줌 시뮬레이션 (터치 이벤트)
// 카드 위에서 직접 클로즈업
const cards = await page.$$('article')
if (cards[0]) {
  const box = await cards[0].boundingBox()
  console.log('card box:', JSON.stringify(box))
  // 카드 중심으로 스크롤
  await page.evaluate((b) => {
    window.scrollTo(b.x + b.width/2 - 195, b.y + b.height/2 - 422)
  }, box)
  await wait(300)
  await ss('07-card-closeup')
}

// 이미지 렌더링 품질 확인 — 여러 줌 레벨에서 캡처된 포스트잇
for (let i = 0; i < 4; i++) { await zoomOut?.click(); await wait(300) }
await ss('08-mid-zoom-cards')

await browser.close()
console.log('Done:', OUT)
