import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/splash');
await page.evaluate(() => localStorage.setItem('yeoginamgim.authToken', 'test'));
await page.goto('http://localhost:5173/board/17/postit');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'c:/tmp/editor-postit.png' });

// 포토카드 탭
await page.locator('text=포토카드').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'c:/tmp/editor-photo.png' });

await browser.close();
