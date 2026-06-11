import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yc-audit'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
const page = await ctx.newPage()
const ss = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('📸', n) }
const wait = ms => page.waitForTimeout(ms)

// 콘솔 에러 수집
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

// ── 1. 첫 진입 (비로그인) ──
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await wait(1500)
await ss('01-first-entry')
console.log('첫 진입 URL:', page.url())

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await wait(1000)
await ss('02-login')

// 로그인
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await ss('03-login-filled')
await page.click('button[type="submit"]')
await wait(2500)
console.log('로그인 후 URL:', page.url())
await ss('04-after-login')

// ── 2. 홈 — 첫 10초 경험 ──
await ss('05-home')
const homeText = await page.textContent('body')
console.log('홈 첫 텍스트:', homeText?.slice(0, 400))

// 홈 스크롤
await page.evaluate(() => window.scrollTo(0, 500))
await wait(400)
await ss('06-home-scroll')
await page.evaluate(() => window.scrollTo(0, 0))

// ── 3. 지도 탐색 ──
await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle' })
await wait(2500)
await ss('07-map')
// 검색창
const searchInput = await page.$('input[placeholder*="검색"], input[placeholder*="장소"]')
console.log('지도 검색창:', !!searchInput)
if (searchInput) {
  await searchInput.click()
  await wait(300)
  await ss('08-map-search-focus')
  await searchInput.type('카페')
  await wait(1000)
  await ss('09-map-search-cafe')
}

// ── 4. 보드 진입 ──
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
await ss('10-board')

// 카드 개수/종류 확인
const cards = await page.$$('article')
console.log('보드 카드 수:', cards.length)

// 줌아웃으로 전체 보기
const zoomOut = await page.$('button[aria-label="축소"]')
await zoomOut?.click(); await wait(300)
await zoomOut?.click(); await wait(300)
await ss('11-board-overview')

// 카드 탭
if (cards[0]) {
  await cards[0].click()
  await wait(1200)
  await ss('12-bottomsheet')
  const sheetText = await page.textContent('body')
  console.log('바텀시트 버튼들:', sheetText?.match(/(흔적 상세|좋아요|수정|삭제|신고)/g))
}

// 상세 이동
const detailBtn = await page.$('button:has-text("흔적 상세 보기")')
if (detailBtn) {
  await detailBtn.click()
  await wait(1500)
  await ss('13-trace-detail')
  await page.goBack(); await wait(1000)
}

// ── 5. 흔적 작성 플로우 ──
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)

// FAB
const fab = await page.$('button[aria-label="흔적 남기기"]')
await fab?.click(); await wait(700)
await ss('14-type-select')

// 포스트잇
const postitBtn = await page.$('button:has-text("포스트잇")')
await postitBtn?.click(); await wait(1500)
await ss('15-postit-editor')

const ta = await page.$('textarea')
if (ta) {
  await ta.fill('이 공간 너무 좋다\n또 오고 싶어 ☕')
  await wait(300)
  await ss('16-postit-typed')
  // 배경 탭
  await page.mouse.click(195, 600)
  await wait(400)
  await ss('17-text-placed')
}

// 펜 탭
const penBtn = await page.$('button:has-text("펜")')
if (penBtn) { await penBtn.click({ force: true }); await wait(300); await ss('18-pen-tab') }

// 색상 탭
const colorBtn = await page.$('button:has-text("색상")')
if (colorBtn) { await colorBtn.click({ force: true }); await wait(300); await ss('19-color-tab') }

// 완료
const doneBtn = await page.$('button:has-text("완료")')
const isDisabled = await doneBtn?.getAttribute('disabled')
console.log('완료버튼 disabled:', isDisabled)
await doneBtn?.click({ force: true })
await wait(3000)
console.log('완료 후 URL:', page.url())
await ss('20-after-complete')

// ── 6. 보관함 ──
await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' })
await wait(1500)
await ss('21-archive')

// 흔적 탭
const traceItems = await page.$$('section button')
console.log('보관함 흔적 수:', traceItems.length)
if (traceItems[0]) {
  await traceItems[0].click()
  await wait(1500)
  await ss('22-archive-trace-detail')
  await page.goBack(); await wait(800)
}

// ── 7. 마이페이지 ──
await page.goto('http://localhost:5173/my', { waitUntil: 'networkidle' })
await wait(1000)
await ss('23-mypage')

// ── 8. 온보딩 확인 ──
await page.goto('http://localhost:5173/onboarding', { waitUntil: 'networkidle' })
await wait(1000)
await ss('24-onboarding')

await browser.close()

console.log('\n=== 콘솔 에러 ===')
errors.forEach(e => console.log(' ', e))
console.log('Done:', OUT)
