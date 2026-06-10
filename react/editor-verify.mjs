import { chromium } from 'playwright'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yeoginamgim-screenshots'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

// 로그인
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[type="password"]', '12341234')
await page.click('button[type="submit"]')
await page.waitForTimeout(2000)

// 보드 → 에디터 진입 (state로 직접)
await page.goto('http://localhost:5173/board/33/postit', {
  waitUntil: 'networkidle',
})
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/e01-postit-initial.png` })

// 텍스트 탭 클릭
const btns = await page.$$('button')
for (const btn of btns) {
  const txt = await btn.textContent()
  if (txt?.includes('텍스트')) { await btn.click(); break }
}
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/e02-text-overlay.png` })

// 타이핑
await page.keyboard.type('오늘 비가 와서 더 좋았던 카페')
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e03-typing.png` })

// 완료
for (const btn of await page.$$('button')) {
  const txt = await btn.textContent()
  if (txt?.trim() === '완료') { await btn.click(); break }
}
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/e04-text-placed.png` })

// 펜 탭
for (const btn of await page.$$('button')) {
  const txt = await btn.textContent()
  if (txt?.includes('펜')) { await btn.click(); break }
}
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e05-pen-options.png` })

// 색상 탭
for (const btn of await page.$$('button')) {
  const txt = await btn.textContent()
  if (txt?.includes('색상')) { await btn.click(); break }
}
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e06-color-options.png` })

// 폴라로이드 에디터
await page.goto('http://localhost:5173/board/33/postit', { waitUntil: 'networkidle' })
// state 없이 접근하면 postit으로 진입되므로 직접 navigate state 주입
await page.evaluate(() => {
  window.history.replaceState({ initialTab: 'polaroid' }, '')
})
await page.goto('http://localhost:5173/board/33/postit', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/e07-polaroid-initial.png` })

await browser.close()
console.log('done')
