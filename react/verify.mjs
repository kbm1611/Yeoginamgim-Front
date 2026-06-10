import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const OUT = 'C:/Users/Kim/AppData/Local/Temp/yeoginamgim-screenshots'
mkdirSync(OUT, { recursive: true })

const errors = []
const findings = []

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
})
const page = await ctx.newPage()

page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`)
})
page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`))

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`📸 ${name}`)
}

async function wait(ms) {
  await page.waitForTimeout(ms)
}

// ── 1. 로그인 ──
console.log('\n=== 1. 로그인 ===')
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await shot('01-login')
await page.fill('input[type="email"], input[placeholder*="이메일"]', 'wlehrja5753@gmail.com')
await page.fill('input[type="password"], input[placeholder*="비밀번호"]', '12341234')
await shot('02-login-filled')
await page.click('button[type="submit"], button:has-text("로그인")')
await wait(2000)
await shot('03-after-login')
console.log('현재 URL:', page.url())

// ── 2. 홈 화면 ──
console.log('\n=== 2. 홈 화면 ===')
await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' })
await wait(1500)
await shot('04-home')
const homeText = await page.textContent('body')
findings.push(`홈 화면 텍스트 일부: ${homeText?.slice(0, 200)}`)

// ── 3. 지도 ──
console.log('\n=== 3. 지도/공간 찾기 ===')
await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle' })
await wait(2000)
await shot('05-map')

// 검색 시도
const searchInput = await page.$('input[type="search"], input[placeholder*="검색"], input[placeholder*="장소"]')
if (searchInput) {
  await searchInput.click()
  await searchInput.type('카페')
  await wait(1000)
  await shot('06-map-search')
  findings.push('지도 검색 입력 가능')
} else {
  findings.push('⚠️ 지도 검색 입력창 없음')
}

// ── 4. 보드 화면 ──
console.log('\n=== 4. 보드 화면 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
await shot('07-board')

// FAB 확인
const fab = await page.$('button:has([data-lucide="pencil-line"]), button.rounded-full')
if (fab) {
  findings.push('FAB 버튼 존재')
} else {
  findings.push('⚠️ FAB 버튼 못 찾음')
}

// 포스트잇 카드 탭
const cards = await page.$$('article')
findings.push(`보드 카드 수: ${cards.length}개`)
if (cards.length > 0) {
  await cards[0].click()
  await wait(1000)
  await shot('08-board-card-tap')
  // 바텀시트 열렸는지
  const sheet = await page.$('.rounded-t-3xl, [class*="bottom"]')
  if (sheet) {
    findings.push('카드 탭 → 바텀시트 열림')
    await shot('09-bottom-sheet')
    // 닫기
    await page.keyboard.press('Escape')
    await page.click('body', { position: { x: 195, y: 100 } })
    await wait(500)
  } else {
    findings.push('⚠️ 카드 탭 후 바텀시트 안 열림')
  }
}

// 줌 컨트롤
const zoomIn = await page.$('button:has([data-lucide="plus"])')
if (zoomIn) {
  await zoomIn.click()
  await wait(300)
  findings.push('줌인 버튼 동작')
}

// ── 5. 포스트잇 에디터 ──
console.log('\n=== 5. 포스트잇 에디터 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)

// FAB 클릭 → 타입 선택 시트
const allButtons = await page.$$('button')
let fabBtn = null
for (const btn of allButtons) {
  const box = await btn.boundingBox()
  if (box && box.x > 300 && box.y > 700) { fabBtn = btn; break }
}
if (fabBtn) {
  await fabBtn.click()
  await wait(800)
  await shot('10-type-select-sheet')

  // 포스트잇 선택
  const postitBtn = await page.$('button:has-text("포스트잇")')
  if (postitBtn) {
    await postitBtn.click()
    await wait(1000)
    await shot('11-postit-editor')

    // 텍스트 탭 클릭
    const textBtn = await page.$('button:has-text("텍스트")')
    if (textBtn) {
      await textBtn.click()
      await wait(500)
      await shot('12-postit-text-overlay')

      // 텍스트 입력
      await page.keyboard.type('여기남김 테스트')
      await wait(300)
      await shot('13-postit-text-typing')

      // 완료 버튼
      const doneBtn = await page.$('button:has-text("완료")')
      if (doneBtn) {
        await doneBtn.click()
        await wait(500)
        await shot('14-postit-text-done')
      }
    } else {
      findings.push('⚠️ 텍스트 툴 버튼 못 찾음')
    }

    // 펜 탭
    const penBtn = await page.$('button:has-text("펜")')
    if (penBtn) {
      await penBtn.click()
      await wait(300)
      await shot('15-postit-pen-options')
    }

    // 색상 탭
    const colorBtn = await page.$('button:has-text("색상")')
    if (colorBtn) {
      await colorBtn.click()
      await wait(300)
      await shot('16-postit-color-options')
      // 색상 변경
      const colorCircles = await page.$$('[style*="background-color"]')
      if (colorCircles.length > 1) {
        await colorCircles[1].click()
        await wait(300)
        await shot('17-postit-color-changed')
      }
    }

    // 상단 완료 버튼
    const topDone = await page.$('header ~ * button:has-text("완료"), button:has-text("완료")')
    if (topDone) {
      await topDone.click()
      await wait(2000)
      await shot('18-postit-completed')
      findings.push(`완료 후 URL: ${page.url()}`)
    }
  } else {
    findings.push('⚠️ 포스트잇 버튼 못 찾음')
    await page.keyboard.press('Escape')
  }
} else {
  findings.push('⚠️ FAB 버튼 못 찾음 (우하단)')
}

// ── 6. 폴라로이드 에디터 ──
console.log('\n=== 6. 폴라로이드 에디터 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(1500)

const allBtns2 = await page.$$('button')
let fabBtn2 = null
for (const btn of allBtns2) {
  const box = await btn.boundingBox()
  if (box && box.x > 300 && box.y > 700) { fabBtn2 = btn; break }
}
if (fabBtn2) {
  await fabBtn2.click()
  await wait(800)
  const polaroidBtn = await page.$('button:has-text("폴라로이드")')
  if (polaroidBtn) {
    await polaroidBtn.click()
    await wait(1500)
    await shot('19-polaroid-editor')
    findings.push('폴라로이드 에디터 진입 성공')

    // 사진 추가 버튼 확인
    const photoBtn = await page.$('button:has-text("사진 추가")')
    if (photoBtn) findings.push('사진 추가 버튼 존재')

    // 하단 메모 탭
    const memoArea = await page.$('button:has-text("한 줄 메모")')
    if (memoArea) {
      await memoArea.click()
      await wait(300)
      await page.keyboard.type('성수동 카페에서')
      await wait(300)
      await shot('20-polaroid-memo')
    }

    await page.keyboard.press('Escape')
    await wait(300)
    await shot('21-polaroid-editor-final')

    // 뒤로가기
    const backBtn = await page.$('button:has([data-lucide="x"])')
    if (backBtn) await backBtn.click()
    await wait(800)
  }
}

// ── 7. 흔적 상세 ──
console.log('\n=== 7. 흔적 상세 ===')
await page.goto('http://localhost:5173/board/33', { waitUntil: 'networkidle' })
await wait(2000)
const cards2 = await page.$$('article')
if (cards2.length > 0) {
  await cards2[0].click()
  await wait(1000)
  await shot('22-trace-bottomsheet')

  // TraceDetail 이동 버튼
  const detailBtn = await page.$('button:has-text("상세"), a:has-text("상세")')
  if (detailBtn) {
    await detailBtn.click()
    await wait(1000)
    await shot('23-trace-detail')
  }
}

// ── 8. 마이페이지 ──
console.log('\n=== 8. 마이페이지 ===')
await page.goto('http://localhost:5173/mypage', { waitUntil: 'networkidle' })
await wait(1500)
await shot('24-mypage')

// ── 빈 상태 테스트 ──
console.log('\n=== 9. 빈 보드 상태 ===')
await page.goto('http://localhost:5173/board/99999', { waitUntil: 'networkidle' })
await wait(2000)
await shot('25-empty-board')

// ── 최종 ──
await browser.close()

console.log('\n\n=== 콘솔 에러 목록 ===')
errors.forEach(e => console.log(e))

console.log('\n=== 파인딩 ===')
findings.forEach(f => console.log(f))

console.log('\n스크린샷 저장 위치:', OUT)
