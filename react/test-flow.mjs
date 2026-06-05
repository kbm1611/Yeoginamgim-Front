import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

// 1. 보드 직접 접근 (auth 없이 테스트용으로 /board/test)
await page.goto('http://localhost:5174/board/test');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'ss1-board.png' });
console.log('=== SS1: 보드 진입 ===');
console.log('URL:', page.url());
console.log('Errors:', errors);

// 2. "흔적 남기기" 버튼 클릭
const btn = page.locator('text=흔적 남기기');
const btnVisible = await btn.isVisible().catch(() => false);
console.log('흔적 남기기 버튼 보임:', btnVisible);

if (btnVisible) {
  await btn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'ss2-editor.png' });
  console.log('=== SS2: 에디터 진입 ===');
  console.log('URL:', page.url());
  console.log('Errors:', errors);

  // 3. 텍스트 입력
  const textBtn = page.locator('text=텍스트').first();
  if (await textBtn.isVisible().catch(() => false)) {
    await textBtn.click();
    await page.waitForTimeout(500);
    // contentEditable 클릭
    const editable = page.locator('[contenteditable="true"]').first();
    if (await editable.isVisible().catch(() => false)) {
      await editable.click();
      await page.keyboard.type('테스트 포스트잇!');
    }
    await page.screenshot({ path: 'ss3-text-input.png' });
    console.log('=== SS3: 텍스트 입력 후 ===');
  }

  // 4. 완료 버튼
  const doneBtn = page.locator('text=완료').first();
  if (await doneBtn.isVisible().catch(() => false)) {
    await doneBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'ss4-back-to-board.png' });
    console.log('=== SS4: 보드 복귀 ===');
    console.log('URL:', page.url());
    console.log('Errors:', errors);
  } else {
    console.log('완료 버튼 없음!');
    const allBtns = await page.locator('button').allTextContents();
    console.log('버튼 목록:', allBtns);
  }
}

console.log('\n=== 최종 에러 목록 ===');
errors.forEach(e => console.log('ERROR:', e));

await browser.close();
