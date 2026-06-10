import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yc-audit3'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const ss = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('📸', n) }
const wait = ms => page.waitForTimeout(ms)

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2500)

await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' })
await wait(1500)
await ss('01-archive')

await page.goto('http://localhost:5173/my', { waitUntil: 'networkidle' })
await wait(1000)
await ss('02-mypage')

await page.goto('http://localhost:5173/onboarding', { waitUntil: 'networkidle' })
await wait(800)
await ss('03-onboarding-1')

// 온보딩 다음 페이지들
for (let i = 0; i < 3; i++) {
  const btns = await page.$$('button')
  for (const b of btns) {
    const t = await b.textContent()
    if (t?.includes('다음') || t?.includes('시작')) { await b.click(); break }
  }
  await wait(600)
  await ss(`0${4+i}-onboarding-${2+i}`)
}

// 홈
await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' })
await wait(1500)
await ss('07-home')

// 보드 흔적 완료 후
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
await ss('08-board')

await browser.close()
console.log('Done:', OUT)
