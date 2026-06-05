import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) });

await page.goto('http://localhost:5173/splash');
await page.evaluate(() => localStorage.setItem('yeoginamgim.authToken', 'test'));
await page.goto('http://localhost:5173/board/17');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'c:/tmp/board-check.png' });
console.log('errors:', errors);
await browser.close();
