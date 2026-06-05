import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

// 토큰 심기
await page.goto('http://localhost:5175/splash');
await page.evaluate(() => {
  localStorage.setItem('yeoginamgim.authToken', 'test-token-dummy');
});

const errors = [];
const logs = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));

// 1. 에디터 직접 접근
console.log('\n=== STEP 1: 에디터 직접 접근 ===');
await page.goto('http://localhost:5175/board/test/postit');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'ss1-editor.png' });
console.log('URL:', page.url());

// 에디터 탭 확인
const postitTab = page.locator('text=포스트잇').first();
const photoTab = page.locator('text=포토카드').first();
const saveBtn = page.locator('text=남기기').last();
console.log('포스트잇 탭 보임:', await postitTab.isVisible().catch(() => false));
console.log('포토카드 탭 보임:', await photoTab.isVisible().catch(() => false));
console.log('남기기 버튼 보임:', await saveBtn.isVisible().catch(() => false));

// 2. 포스트잇 미리보기 크기 확인
console.log('\n=== STEP 2: 포스트잇 프리뷰 크기 ===');
const previewSize = await page.evaluate(() => {
  const el = document.querySelector('[style*="overflow: hidden"]');
  return el ? { w: el.offsetWidth, h: el.offsetHeight, style: el.getAttribute('style') } : null;
});
console.log('프리뷰:', previewSize);

// 3. 텍스트 툴 → 입력
console.log('\n=== STEP 3: 텍스트 입력 ===');
const textTool = page.locator('text=텍스트').first();
if (await textTool.isVisible().catch(() => false)) {
  await textTool.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'ss2-text-tool.png' });
  
  const editable = page.locator('[contenteditable="true"]').first();
  const editableVisible = await editable.isVisible().catch(() => false);
  console.log('contentEditable 보임:', editableVisible);
  if (editableVisible) {
    await editable.click();
    await page.keyboard.type('안녕하세요!');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'ss3-typed.png' });
  }
}

// 4. 남기기
console.log('\n=== STEP 4: 남기기 클릭 ===');
if (await saveBtn.isVisible().catch(() => false)) {
  await saveBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'ss4-after-save.png' });
  console.log('URL after save:', page.url());
}

// 5. 보드에서 캡처 이미지 확인
console.log('\n=== STEP 5: 보드 캡처 이미지 확인 ===');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'ss5-board.png' });
const capturedImgs = await page.$$('img[src^="data:image"]');
console.log('data: 이미지 수:', capturedImgs.length);

const allImgs = await page.$$eval('img', els => els.map(e => e.src.slice(0, 50)));
console.log('모든 img src:', allImgs);

console.log('\n=== 콘솔 로그 (주요) ===');
logs.filter(l => !l.includes('400') && !l.includes('favicon')).forEach(l => console.log(l));
console.log('\n=== 페이지 에러 ===');
errors.forEach(e => console.log(e));

await browser.close();
