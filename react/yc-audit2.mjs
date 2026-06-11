import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yc-audit2'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const ss = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('📸', n) }
const wait = ms => page.waitForTimeout(ms)

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2500)

// 보관함
await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' })
await wait(1500)
await ss('01-archive')

// 흔적 탭
const items = await page.$$('section button')
if (items[0]) {
  await items[0].click()
  await wait(1500)
  await ss('02-archive-trace-detail')
  await page.goBack(); await wait(800)
}

// 마이페이지
await page.goto('http://localhost:5173/my', { waitUntil: 'networkidle' })
await wait(1000)
await ss('03-mypage')

// 온보딩
await page.goto('http://localhost:5173/onboarding', { waitUntil: 'networkidle' })
await wait(800)
await ss('04-onboarding-1')
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const next = btns.find(b => b.textContent.includes('다음') || b.textContent.includes('Next'))
  next?.click()
})
await wait(600)
await ss('05-onboarding-2')
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const next = btns.find(b => b.textContent.includes('다음') || b.textContent.includes('Next'))
  next?.click()
})
await wait(600)
await ss('06-onboarding-3')

// 흔적 타입 선택 시트
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
const fab = await page.$('button[aria-label="흔적 남기기"]')
await fab?.click(); await wait(700)
await ss('07-type-select')

// 포스트잇 저장 완료 후 보드
await page.$eval('button:has-text("포스트잇")', b => b.click())
await wait(1500)
const ta = await page.$('textarea')
if (ta) {
  await ta.fill('이 공간 너무 좋다\n또 오고 싶어 ☕')
  await wait(300)
  await page.mouse.click(195, 600)
  await wait(400)
}
const doneBtn = await page.$('button:has-text("완료")')
await doneBtn?.click({ force: true })
await wait(3000)
await ss('08-board-after-save')

await browser.close()
console.log('Done:', OUT)
