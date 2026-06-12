# 여기남김 Design System

## 1. Brand Direction

여기남김은 단순 장소 정보 앱이 아니라
사람들의 감정과 흔적을 기록하는 공간 기반 서비스이다.

핵심 방향:

* 조용한 감성
* 따뜻한 분위기
* 사람 중심 기록
* 장소의 분위기와 기억 전달
* 정보 과잉보다 여백과 감정 우선

지향하는 느낌:

* cozy
* warm
* emotional
* minimal
* soft
* quiet

피해야 하는 느낌:

* 과한 SNS 스타일
* 네온/사이버 감성
* 복잡한 정보 UI
* 강한 그림자
* 과한 그라데이션
* 유리(glassmorphism) 스타일

---

## 2. Color System

## Primary Colors

```css
--color-primary-brown: #4A3124;
--color-accent-brown: #7A4218;
```

## Background Colors

```css
--color-background: #F7F1EB;
--color-card: #FFFCF8;
```

## Border Colors

```css
--color-border: #E7D9CC;
```

## Text Colors

```css
--color-text-primary: #3B2A21;
--color-text-secondary: #7A685D;
--color-text-light: #B7A79A;
```

## Tag / Chip Colors

```css
--color-chip-bg: #F2E7DB;
--color-chip-active: #7A4218;
--color-chip-text: #4A3124;
```

---

## 3. Typography

## Font Family

```css
font-family:
'Pretendard',
'SUIT',
'Noto Sans KR',
sans-serif;
```

---

## Heading

### H1

```css
font-size: 32px;
font-weight: 700;
line-height: 140%;
```

### H2

```css
font-size: 26px;
font-weight: 700;
line-height: 140%;
```

### Section Title

```css
font-size: 22px;
font-weight: 700;
line-height: 140%;
```

---

## Body

### Default Body

```css
font-size: 16px;
font-weight: 500;
line-height: 160%;
```

### Small Text

```css
font-size: 14px;
font-weight: 500;
line-height: 150%;
```

### Caption

```css
font-size: 12px;
font-weight: 500;
line-height: 140%;
```

---

## 4. Radius System

## Card Radius

```css
border-radius: 22px;
```

## Button Radius

```css
border-radius: 18px;
```

## Chip Radius

```css
border-radius: 999px;
```

## Bottom Navigation Radius

```css
border-radius: 28px 28px 0 0;
```

---

## 5. Shadow System

모든 그림자는 매우 부드럽게 사용한다.

```css
box-shadow:
0 4px 18px rgba(74, 49, 36, 0.06);
```

강한 그림자 사용 금지.

---

## 6. Layout Rules

## Screen Width

모바일 기준:

```css
width: 390px;
```

---

## Default Padding

```css
padding-left: 16px;
padding-right: 16px;
```

---

## Section Gap

```css
gap: 28px;
```

---

## Card Gap

```css
gap: 16px;
```

---

## 7. Navigation Rules

## Bottom Navigation

* 항상 fixed bottom
* 중앙 + 버튼 강조
* 아이콘 크기 최대 24px
* active 상태는 연한 베이지 배경 원 사용

---

## + Button

* 버튼은 새로운 행동의 시작 역할이다.

가능한 액션:

* 흔적 남기기
* 함께 기억하기

- 버튼은 CSS 원형 버튼으로 구현한다.

```css
width: 64px;
height: 64px;
border-radius: 50%;
background: #7A4218;
```

---

## 8. Card Rules

## Place Card

구성:

* 장소 이미지
* 장소명
* 카테고리
* 주소
* 대표 흔적 문구
* 흔적 개수

좋아요 수는 사용하지 않는다.

---

## Representative Message

문장은 감정을 전달해야 한다.

좋은 예시:

* "혼자 있고 싶을 때 자주 와요."
* "비 오는 날 생각나는 공간이에요."
* "햇살이 따뜻해서 오래 머물게 돼요."

피해야 하는 예시:

* "좋은 카페입니다."
* "맛있어요."
* "추천합니다."

---

## 9. Home Screen Rules

홈은 정보 플랫폼처럼 보이면 안 된다.

핵심 목표:

* 사람들이 기억하는 공간 발견
* 분위기 탐색
* 감정 전달

홈 구성:

1. 지역 선택
2. 카테고리 칩
3. 인기 공간 TOP 5
4. 최근 남겨진 흔적
5. Bottom Navigation

---

## 10. Map Screen Rules

지도는 탐색 중심이다.

지도 역할:

* 주변 공간 발견
* 보드 진입
* 장소 분위기 확인

지도에서 장소 클릭 시:

1. 장소 정보 Bottom Sheet 표시
2. 보드 열기 버튼
3. 보드 진입

---

## 11. Interaction Rules

## Animation

모든 애니메이션은 짧고 부드럽게.

```css
transition: all 0.2s ease;
```

과한 bounce 금지.

---

## Scroll

* 자연스럽고 부드럽게
* 과한 스크롤 효과 금지

---

## 12. UI Rules

* Glassmorphism 금지
* 네온 컬러 금지
* 과한 gradient 금지
* 아이콘은 단순하게
* 여백을 충분히 사용
* 카드 밀집 금지
* 정보 과다 금지

---

## 13. Service Tone

여기남김은:

* 장소 리뷰 서비스가 아니다.
* 조용한 공간 기록 서비스에 가깝다.
* 사람의 흔적과 분위기를 기록한다.
* 숫자보다 감정을 우선한다.
* 경쟁보다 기억을 중요하게 생각한다.
