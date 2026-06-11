import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/audit2'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false, slowMo: 80 })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push('[' + page.url().split('/').pop() + '] ' + m.text()) })

const ss = async name => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('📸', name) }
const wait = ms => page.waitForTimeout(ms)

// ── 로그인 ──
console.log('\n=== 로그인 ===')
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await ss('01-login')
await page.fill('input[name="email"]', 'wlehrja5753@gmail.com')
await page.fill('input[name="password"]', '12341234')
await page.click('button[type="submit"]')
await wait(2000)
console.log('로그인 후 URL:', page.url())
await ss('02-home')

// ── 홈 화면 ──
console.log('\n=== 홈 ===')
const homeBody = await page.textContent('body')
console.log('홈 텍스트(앞 300):', homeBody?.slice(0, 300))
await page.evaluate(() => window.scrollTo(0, 400))
await wait(400)
await ss('03-home-scrolled')

// ── 지도 ──
console.log('\n=== 지도 ===')
await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle' })
await wait(2000)
await ss('04-map')

// ── 보드 ──
console.log('\n=== 보드 33 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
await ss('05-board')

// 보드 카드 수
const cards = await page.$$('article')
console.log('카드 수:', cards.length)

// 줌인
const zoomInBtn = await page.$('button[aria-label="확대"]')
if (zoomInBtn) { await zoomInBtn.click(); await wait(300); console.log('줌인 OK') }
else console.log('⚠️ 줌인 버튼 없음')
await ss('06-board-zoomed')

// FAB
console.log('\n=== FAB → 타입 선택 ===')
const fab = await page.$('button[aria-label="흔적 남기기"]')
if (fab) { await fab.click(); await wait(800); console.log('FAB 클릭 OK') }
else console.log('⚠️ FAB 없음')
await ss('07-type-sheet')

// 타입 시트 텍스트 확인
const sheetText = await page.textContent('body')
console.log('시트 내용:', sheetText?.includes('포스트잇') ? '포스트잇 O' : '포스트잇 X', sheetText?.includes('폴라로이드') ? '폴라로이드 O' : '폴라로이드 X')

// ── 포스트잇 에디터 ──
console.log('\n=== 포스트잇 에디터 ===')
const postitBtn = await page.$('button:has-text("포스트잇")')
if (postitBtn) { await postitBtn.click(); await wait(1500); console.log('포스트잇 선택 OK') }
else console.log('⚠️ 포스트잇 버튼 없음')
console.log('에디터 URL:', page.url())
await ss('08-postit-editor-initial')

// textarea 자동 열림 확인
const ta = await page.$('textarea')
console.log('textarea 자동 열림:', ta ? '✅ YES' : '❌ NO')
await ss('09-postit-editor-textarea')

if (ta) {
  await ta.fill('오늘 날씨가 너무 좋아서')
  await page.keyboard.press('Enter')
  await ta.type('여기 왔어요 :)')
  await wait(300)
  await ss('10-postit-multiline')
  console.log('텍스트 입력 OK')
  // 바깥 탭으로 확정
  await page.mouse.click(195, 300)
  await wait(500)
  await ss('11-text-placed')
} else {
  // 텍스트 버튼 눌러보기
  const textBtn = await page.$('button:has-text("텍스트")')
  if (textBtn) {
    await textBtn.click()
    await wait(800)
    await ss('09b-text-overlay')
    const ta2 = await page.$('textarea')
    console.log('텍스트 버튼 후 textarea:', ta2 ? '✅ YES' : '❌ NO')
    if (ta2) {
      await ta2.fill('오늘 날씨가 너무 좋아서')
      await page.keyboard.press('Enter')
      await ta2.type('여기 왔어요 :)')
      await wait(300)
      await ss('10-postit-multiline')
    }
  }
}

// 펜 탭
const penBtn = await page.$('button:has-text("펜")')
if (penBtn) { await penBtn.click({ force: true }); await wait(400); await ss('12-pen-options'); console.log('펜 탭 OK') }

// 색상 탭
const colorBtn = await page.$('button:has-text("색상")')
if (colorBtn) { await colorBtn.click({ force: true }); await wait(300); await ss('13-color-options'); console.log('색상 탭 OK') }

// 완료 버튼
const doneBtn = await page.$('button:has-text("완료")')
console.log('완료 버튼:', doneBtn ? '있음' : '없음')
if (doneBtn) {
  const isDisabled = await doneBtn.getAttribute('disabled')
  console.log('완료 버튼 disabled:', isDisabled)
  await doneBtn.click({ force: true })
  await wait(3000)
  console.log('완료 후 URL:', page.url())
  await ss('14-after-complete')
}

// ── 보드 복귀 확인 ──
console.log('\n=== 보드 복귀 상태 ===')
await wait(1000)
await ss('15-board-after-place')
const bodyAfter = await page.textContent('body')
console.log('저장 중 메시지:', bodyAfter?.includes('저장') ? '있음' : '없음')

// ── 폴라로이드 에디터 ──
console.log('\n=== 폴라로이드 에디터 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
const fab2 = await page.$('button[aria-label="흔적 남기기"]')
if (fab2) { await fab2.click(); await wait(800) }
const polaroidBtn = await page.$('button:has-text("폴라로이드")')
if (polaroidBtn) { await polaroidBtn.click(); await wait(1500) }
console.log('폴라로이드 에디터 URL:', page.url())
await ss('16-polaroid-editor')
// 파일 선택 dialog 뜨는지 확인
const fileInput = await page.$('input[type="file"]')
console.log('파일 input:', fileInput ? '있음' : '없음')

// ── 카드 탭 → 바텀시트 ──
console.log('\n=== 카드 탭 → 바텀시트 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
const cards2 = await page.$$('article')
if (cards2.length > 0) {
  await cards2[0].click()
  await wait(1200)
  await ss('17-bottomsheet')
  const sheetBody = await page.textContent('body')
  console.log('바텀시트 열림:', sheetBody?.includes('좋아') ? '✅ (좋아요 텍스트 있음)' : '❌ 열리지 않았을 수 있음')
  // TraceDetail 이동
  const detailLink = await page.$('a[href*="trace"], button:has-text("상세")')
  if (detailLink) { await detailLink.click(); await wait(1000); await ss('18-trace-detail') }
  else {
    // 바텀시트에서 직접 확인
    await ss('18-bottomsheet-full')
    console.log('TraceDetail 이동 버튼 없음 — 바텀시트 구조 확인 필요')
  }
}

// ── TraceDetail 직접 접근 ──
console.log('\n=== TraceDetail ===')
// 보드에서 첫 카드 traceId 추출 시도
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)
const firstCard = await page.$('article')
if (firstCard) {
  await firstCard.click()
  await wait(1000)
  await ss('19-trace-bottomsheet-detail')
  // 바텀시트 내용 전체 확인
  const sheetContent = await page.textContent('body')
  const lines = sheetContent?.split('\n').filter(l => l.trim()).slice(0, 20)
  console.log('바텀시트 내용:', lines?.join(' | '))
}

// ── 보관함 ──
console.log('\n=== 보관함 ===')
await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' })
await wait(1500)
await ss('20-archive')
const archiveBody = await page.textContent('body')
console.log('보관함 내용:', archiveBody?.slice(0, 200))

// ── 마이페이지 ──
console.log('\n=== 마이페이지 ===')
await page.goto('http://localhost:5173/my', { waitUntil: 'networkidle' })
await wait(1000)
await ss('21-mypage')

// ── 없는 보드 ──
console.log('\n=== 없는 보드 99999 ===')
await page.goto('http://localhost:5173/board/99999', { waitUntil: 'networkidle' })
await wait(2000)
await ss('22-board-404')
const errBody = await page.textContent('body')
console.log('404 화면 텍스트:', errBody?.slice(0, 300))

// ── 콘솔 에러 ──
await browser.close()
console.log('\n=== 콘솔 에러 목록 ===')
if (errs.length === 0) console.log('없음')
errs.forEach(e => console.log(' ', e))
console.log('\n스크린샷:', OUT)
