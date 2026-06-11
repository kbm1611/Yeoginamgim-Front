import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

// 인증 없이 에디터 직접 접근 — localStorage에 토큰 심기
await page.goto('http://localhost:3999');
await page.evaluate(() => {
  localStorage.setItem('accessToken', 'test');
});

await page.goto('http://localhost:3999/board/1/postit');
await page.waitForTimeout(3000);

await page.screenshot({ path: 'verify-1-init.png', fullPage: false });
console.log('URL after load:', page.url());

// 포토카드 탭 클릭
try {
  await page.locator('button', { hasText: '포토카드' }).first().click({ timeout: 5000 });
  await page.waitForTimeout(500);
  console.log('Clicked 포토카드 tab');
} catch(e) {
  console.log('Could not click 포토카드:', e.message);
}
await page.screenshot({ path: 'verify-2-polaroid.png' });

// 펜 버튼 클릭
try {
  await page.locator('button', { hasText: '펜' }).first().click({ timeout: 5000 });
  await page.waitForTimeout(300);
  console.log('Clicked 펜 button');
} catch(e) {
  console.log('Could not click 펜:', e.message);
}
await page.screenshot({ path: 'verify-3-pen-mode.png' });

// 카드 위에서 마우스 드래그 (펜 그리기)
const card = page.locator('[style*="aspect-ratio"]').first();
const box = await card.boundingBox();
console.log('Card box:', JSON.stringify(box));

if (box) {
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.35;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(50);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(cx + i * 4, cy + i * 3, { steps: 1 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
  console.log('Drew stroke at', cx, cy);
}

await page.screenshot({ path: 'verify-4-after-draw.png' });

// SVG path 개수 확인
const pathCount = await page.locator('svg path').count();
console.log('SVG path count:', pathCount);

// crosshair 커서 확인
const hasCrosshair = await page.evaluate(() =>
  !!document.querySelector('[style*="crosshair"]')
);
console.log('Has crosshair cursor:', hasCrosshair);

await browser.close();
console.log('DONE');
