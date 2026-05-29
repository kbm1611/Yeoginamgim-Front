# 여기남김 UI Rules

## 1. Core UI Principle

여기남김의 UI는:

* 정보보다 분위기
* 기능보다 감정
* 복잡함보다 여백

을 우선한다.

모든 화면은:

* 조용하고
* 따뜻하고
* 편안해야 한다.

---

# 2. Layout Rules

## Mobile First

모든 화면은 모바일 기준으로 설계한다.

기준 Width:

```css
390px
```

---

## Safe Area

상단/하단 safe-area를 고려한다.

특히:

* Bottom Navigation
* Fixed Bottom Sheet
* Floating Button

구현 시 iPhone safe-area 대응 필수.

---

## Default Screen Padding

```css
padding-left: 16px;
padding-right: 16px;
```

---

## Section Gap

섹션 간 간격:

```css
28px
```

---

## Card Gap

카드 간 간격:

```css
16px
```

---

# 3. Background Rules

## Main Background

```css
#F7F1EB
```

배경은 항상 따뜻한 베이지 계열 사용.

---

## Forbidden

다음 사용 금지:

* 강한 gradient
* neon color
* dark cyber style
* glassmorphism
* noisy texture

---

# 4. Card Rules

## Card Style

모든 카드는:

* 부드러운 radius
* 매우 약한 shadow
* 충분한 padding

을 사용한다.

---

## Card Radius

```css
22px
```

---

## Shadow

```css
box-shadow:
0 4px 18px rgba(74, 49, 36, 0.06);
```

강한 shadow 금지.

---

## Card Density

카드를 너무 촘촘하게 배치하지 않는다.

충분한 breathing space 유지.

---

# 5. Typography Rules

## Font

```css
Pretendard
SUIT
Noto Sans KR
sans-serif
```

---

## Text Tone

문장은:

* 짧고
* 담백하고
* 감성적으로

작성한다.

---

## Avoid

금지:

* 과한 마케팅 문구
* SNS 감탄형 말투
* excessive emoji

예:

❌ "완전 최고!!🔥"

⭕ "비 오는 날 생각나는 공간이에요."

---

# 6. Image Rules

## Image Style

이미지는:

* 따뜻한 색감
* 자연광
* 필름 감성
* cozy 분위기

우선.

---

## Avoid

금지:

* 과한 saturation
* neon lighting
* futuristic style
* dark gaming mood

---

## Object Fit

```css
object-fit: cover;
```

---

# 7. Navigation Rules

## Bottom Navigation

항상 fixed bottom 사용.

---

## Navigation Height

```css
76px
```

---

## Bottom Navigation Background

```css
#FFFCF8
```

---

## Bottom Navigation Radius

```css
border-radius: 28px 28px 0 0;
```

---

## Navigation Icons

아이콘 크기:

```css
22px ~ 24px
```

초과 금지.

---

## Active State

active 상태는:

* 연한 베이지 원
* 브라운 포인트

조합 사용.

---

# 8. + Button Rules

## + Button Role

* 버튼은:

"새로운 흔적 시작"

역할이다.

---

## + Button Style

```css
width: 64px;
height: 64px;
border-radius: 50%;
background: #7A4218;
```

---

## Important

* 버튼은 이미지로 구현하지 않는다.

반드시 CSS 원형 버튼으로 구현한다.

---

# 9. Chip Rules

## Category Chip

칩은:

* 작고
* 부드럽고
* 심플하게

구성한다.

---

## Chip Radius

```css
999px
```

---

## Active Chip

```css
background: #7A4218;
color: white;
```

---

# 10. Home Screen Rules

홈은:

* 감성 탐색
* 분위기 발견

역할이다.

---

## Home MUST NOT

홈에서:

* 정보 과다
* 랭킹 경쟁
* 숫자 강조

금지.

---

## Home SHOULD

홈은:

* 감성 카드
* 장소 분위기
* 대표 흔적 문장

중심으로 구성한다.

---

# 11. Popular Section Rules

TOP5는 사용 가능.

하지만:

* 경쟁형 UI 금지
* 과한 순위 강조 금지

---

## Recommended

⭕ "성수동 인기 공간 TOP 5"

❌ "실시간 인기 랭킹"

---

# 12. Recent Trace Rules

최근 흔적은:

* 살아있는 서비스 느낌
* 사람 흔적 흐름

을 보여준다.

---

## Recent Trace SHOULD

* 시간 표시
* 짧은 문장
* 조용한 분위기

유지.

---

# 13. Map Rules

지도는:

* 탐색 중심
* 장소 발견 중심

이다.

---

## Map Interaction

지도 클릭:

```text
장소 선택
→ Bottom Sheet
→ 보드 열기
```

구조 사용.

---

# 14. Button Rules

## Primary Button

```css
background: #7A4218;
color: white;
```

---

## Secondary Button

```css
background: white;
border: 1px solid #E7D9CC;
```

---

## Button Radius

```css
18px
```

---

# 15. Animation Rules

모든 애니메이션은:

* 짧고
* 부드럽고
* 자연스럽게

구현.

---

## Transition

```css
transition: all 0.2s ease;
```

---

## Avoid

금지:

* bounce animation
* flashy motion
* excessive parallax

---

# 16. Forbidden UI

다음 스타일 금지:

* SNS 스타일 좋아요 경쟁
* neon gradient
* cyber UI
* sharp edge UI
* 과한 glassmorphism
* 과한 shadow
* noisy background

---

# 17. Service Mood

여기남김은:

* 장소 리뷰 앱이 아니다.
* 감정 기반 공간 기록 서비스이다.
* 숫자보다 기억을 중요하게 생각한다.
* 정보보다 분위기를 우선한다.


# 18. Ranking UI Rules

TOP5는 사용 가능하지만
과한 경쟁형 UI처럼 보이면 안 된다.

추천 방식:
- 조용한 숫자 강조
- 부드러운 원형 rank badge
- 과한 금/은/동 메달 사용 금지
- 랭킹보다 분위기를 우선

추천:
⭕ 작은 원형 번호 배지
❌ e스포츠 랭킹 스타일

TOP5 카드는:
- 감성 사진 중심
- 공간 분위기 중심
- 대표 문장 중심
- 숫자는 보조 역할