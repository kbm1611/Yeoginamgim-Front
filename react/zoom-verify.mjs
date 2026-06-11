import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/zoom-verify'
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

const zoomIn = await page.$('button[aria-label="확대"]')
const zoomOut = await page.$('button[aria-label="축소"]')

await zoomIn?.click(); await wait(500)
await ss('02-zoom-in-1')

await zoomIn?.click(); await wait(500)
await ss('03-zoom-in-2')

await zoomIn?.click(); await wait(500)
await ss('04-zoom-in-3')

// 줌아웃으로 돌아오기
await zoomOut?.click(); await wait(400)
await zoomOut?.click(); await wait(400)
await zoomOut?.click(); await wait(400)
await ss('05-zoom-back-default')

await zoomOut?.click(); await wait(400)
await ss('06-zoom-out-1')

await zoomOut?.click(); await wait(400)
await ss('07-zoom-out-2')

await browser.close()
console.log('Done:', OUT)
