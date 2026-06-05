import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
const logs = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => {
  const t = m.text();
  logs.push(`[${m.type()}] ${t}`);
});

// 네트워크 요청 감시
page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('/api/')) {
    console.log(`API ${res.status()} ${res.request().method()} ${url.replace('http://localhost:8080','')}`);
    if (res.status() >= 400) {
      try {
        const body = await res.text();
        console.log('  응답:', body.slice(0, 200));
      } catch {}
    }
  }
});

// 로그인 페이지로 이동해서 실제 로그인 유도
console.log('=== 로그인 페이지로 이동 ===');
await page.goto('http://localhost:5173/login');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'c:/tmp/login.png' });

// 로그인 버튼 클릭 (이메일)
const emailBtn = page.locator('text=이메일로 로그인').first();
if (await emailBtn.isVisible().catch(() => false)) {
  await emailBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'c:/tmp/login2.png' });
}

// 이메일/비번 입력 시도
const emailInput = page.locator('input[type="email"], input[placeholder*="이메일"]').first();
const pwInput = page.locator('input[type="password"]').first();
if (await emailInput.isVisible().catch(() => false)) {
  await emailInput.fill('wlehrja5753@gmail.com');
  await pwInput.fill('test1234');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'c:/tmp/login3.png' });
  
  const submitBtn = page.locator('button[type="submit"], button:has-text("로그인")').last();
  await submitBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'c:/tmp/login4.png' });
  console.log('로그인 후 URL:', page.url());
}

// 현재 토큰 확인
const token = await page.evaluate(() => localStorage.getItem('yeoginamgim.authToken'));
console.log('토큰 존재:', !!token, token?.slice(0, 30));

await browser.close();
