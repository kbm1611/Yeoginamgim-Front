import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/postit-check'
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

// 줌아웃 2번
const zoomOut = await page.$('button[aria-label="축소"]')
if (zoomOut) { await zoomOut.click(); await wait(300); await zoomOut.click(); await wait(300) }
await ss('01-board-zoomout')

// 줌인 원래대로
const zoomIn = await page.$('button[aria-label="확대"]')
if (zoomIn) { await zoomIn.click(); await wait(300); await zoomIn.click(); await wait(300) }
await ss('02-board-normal')

// 카드 클립
const cards = await page.$$('article')
console.log('카드 수:', cards.length)

// 첫번째 카드 클로즈업
if (cards[0]) {
  const box = await cards[0].boundingBox()
  console.log('card[0] box:', box)
  await ss('03-card0-full')
}

// 두번째 카드
if (cards[1]) {
  const box = await cards[1].boundingBox()
  console.log('card[1] box:', box)
  await ss('04-card1-full')
}

// 포스트잇 에디터 — 텍스트 입력 후 완료 전 상태
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
await page.$eval('button[aria-label="흔적 남기기"]', b => b.click())
await wait(700)
await page.$eval('button:has-text("포스트잇")', b => b.click())
await wait(1500)
await ss('05-editor-open')

const ta = await page.$('textarea')
if (ta) {
  await ta.fill('여기 진짜\n너무 좋다 🫶')
  await wait(400)
  await ss('06-editor-text')
}

// 색상 바꿔보기 — 핑크
await page.mouse.click(195, 750) // 배경 탭으로 confirm
await wait(400)
await ss('07-text-placed')

await browser.close()
console.log('Done:', OUT)
