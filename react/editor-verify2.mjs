import { chromium } from 'playwright'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yeoginamgim-screenshots'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[type="password"]', '12341234')
await page.click('button[type="submit"]')
await page.waitForTimeout(2000)

// 포스트잇 에디터 — state 직접 주입
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.evaluate(() => {
  window.__pw_nav = (path, state) => {
    window.history.pushState(state, '', path)
    window.dispatchEvent(new PopStateEvent('popstate', { state }))
  }
})
// React Router navigate via click
// FAB 클릭 → 시트에서 포스트잇 선택
const allBtns = await page.$$('button')
for (const btn of allBtns) {
  const box = await btn.boundingBox()
  if (box && box.x > 280 && box.y > 720 && box.width < 80) {
    await btn.click()
    break
  }
}
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/e01-type-sheet.png` })

// 포스트잇 버튼
const sheetBtns = await page.$$('button')
for (const btn of sheetBtns) {
  const txt = await btn.textContent()
  if (txt?.includes('포스트잇')) {
    await btn.click()
    break
  }
}
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/e02-postit-initial.png` })

// 텍스트 탭
const btns2 = await page.$$('button')
for (const btn of btns2) {
  const txt = await btn.textContent()
  if (txt?.trim() === '텍스트') { await btn.click({ force: true }); break }
}
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/e03-text-overlay.png` })

await page.keyboard.type('오늘 비가 와서')
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e04-typing.png` })

// 완료 버튼 (텍스트 오버레이의 완료)
const btns3 = await page.$$('button')
for (const btn of btns3) {
  const txt = await btn.textContent()
  if (txt?.trim() === '완료') { await btn.click({ force: true }); break }
}
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/e05-text-placed.png` })

// 펜 탭
const btns4 = await page.$$('button')
for (const btn of btns4) {
  const txt = await btn.textContent()
  if (txt?.trim() === '펜') { await btn.click({ force: true }); break }
}
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e06-pen-options.png` })

// 색상 탭
const btns5 = await page.$$('button')
for (const btn of btns5) {
  const txt = await btn.textContent()
  if (txt?.trim() === '색상') { await btn.click({ force: true }); break }
}
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/e07-color-options.png` })

// 폴라로이드 에디터
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const allBtns2 = await page.$$('button')
for (const btn of allBtns2) {
  const box = await btn.boundingBox()
  if (box && box.x > 280 && box.y > 720 && box.width < 80) {
    await btn.click()
    break
  }
}
await page.waitForTimeout(800)
const sheetBtns2 = await page.$$('button')
for (const btn of sheetBtns2) {
  const txt = await btn.textContent()
  if (txt?.includes('폴라로이드')) { await btn.click(); break }
}
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/e08-polaroid-initial.png` })

await browser.close()
console.log('done')
