import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/splash');
await page.evaluate(() => localStorage.setItem('yeoginamgim.authToken', 'test'));
await page.goto('http://localhost:5173/board/17');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'c:/tmp/board.png' });

// 포스트잇 클릭 시도
await page.mouse.click(195, 400);
await page.waitForTimeout(1000);
await page.screenshot({ path: 'c:/tmp/bottomsheet.png' });

await browser.close();
