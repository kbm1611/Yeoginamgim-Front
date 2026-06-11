import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/audit3'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const ss = n => page.screenshot({ path: `${OUT}/${n}.png` })
const wait = ms => page.waitForTimeout(ms)

// 로그인
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2000)

// 보드 → FAB → 포스트잇
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
await page.$eval('button[aria-label="흔적 남기기"]', b => b.click())
await wait(700)
await page.$eval('button:has-text("포스트잇")', b => b.click())
await wait(1500)
await ss('01-editor-initial')

// textarea 확인
const ta = await page.$('textarea')
console.log('textarea 있음:', !!ta)
if (!ta) { await browser.close(); process.exit(1) }

// 텍스트 입력
await ta.fill('오늘 날씨 좋다')
await wait(300)
await ss('02-text-typed')

// 배경 탭 (카드 영역 바깥 — 화면 좌측 상단)
await page.mouse.click(195, 560)
await wait(500)
await ss('03-after-bg-tap')

// textObjects 상태 확인 — 완료 버튼 disabled 여부
const doneBtn = await page.$('button:has-text("완료")')
const disabled = await doneBtn?.getAttribute('disabled')
console.log('완료버튼 disabled:', disabled === null ? '❌ null(활성화)' : `"${disabled}"`)

// 완료 클릭
await doneBtn?.click({ force: true })
await wait(3000)
console.log('완료 후 URL:', page.url())
await ss('04-after-complete')

await browser.close()
console.log('Done')
