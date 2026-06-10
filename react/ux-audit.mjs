import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/ux-audit'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const ss = async n => { await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: false }); console.log('📸', n) }
const wait = ms => page.waitForTimeout(ms)

// 로그인
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await ss('01-login')
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2500)
await ss('02-home')

// 홈 스크롤
await page.evaluate(() => window.scrollTo(0, 300))
await wait(500)
await ss('03-home-scrolled')
await page.evaluate(() => window.scrollTo(0, 0))

// 지도
await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle' })
await wait(2000)
await ss('04-map')

// 보드
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
await ss('05-board')

// 줌인
const zoomIn = await page.$('button[aria-label="확대"]')
if (zoomIn) { await zoomIn.click(); await wait(300); await zoomIn.click(); await wait(300) }
await ss('06-board-zoomed')

// 카드 바텀시트
const cards = await page.$$('article')
console.log('카드 수:', cards.length)
if (cards.length > 0) {
  await cards[0].click()
  await wait(1200)
  await ss('07-bottomsheet')
  // 상세 보기
  const detailBtn = await page.$('button:has-text("흔적 상세 보기")')
  if (detailBtn) {
    await detailBtn.click()
    await wait(1500)
    await ss('08-trace-detail')
    await page.goBack()
    await wait(1000)
  }
}

// 포스트잇 에디터
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
await page.$eval('button[aria-label="흔적 남기기"]', b => b.click())
await wait(700)
await page.$eval('button:has-text("포스트잇")', b => b.click())
await wait(1500)
await ss('09-postit-editor')
const ta = await page.$('textarea')
if (ta) {
  await ta.fill('오늘 여기 왔다가\n너무 좋아서 기록해둠 ☕')
  await wait(400)
  await ss('10-postit-typing')
}
// 색상 탭
const colorBtn = await page.$('button:has-text("색상")')
if (colorBtn) { await colorBtn.click({ force: true }); await wait(400); await ss('11-color-tab') }
// 뒤로
await page.goBack()
await wait(1000)

// 폴라로이드 에디터
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
await page.$eval('button[aria-label="흔적 남기기"]', b => b.click())
await wait(700)
await page.$eval('button:has-text("폴라로이드")', b => b.click())
await wait(1500)
await ss('12-polaroid-editor')
await page.goBack()
await wait(800)

// 마이페이지
await page.goto('http://localhost:5173/my', { waitUntil: 'networkidle' })
await wait(1500)
await ss('13-mypage')

// 보관함
await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' })
await wait(1500)
await ss('14-archive')

// 보관함 스크롤
await page.evaluate(() => window.scrollTo(0, 400))
await wait(400)
await ss('15-archive-scrolled')

await browser.close()
console.log('Done:', OUT)
