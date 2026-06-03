# 여기남김 — 프론트엔드

> 공간에 남겨진 사람들의 흔적을 구경하고 남기는 감성 공간 방명록 서비스

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | React 19 |
| 빌드 도구 | Vite |
| 스타일 | Tailwind CSS v4 |
| 라우팅 | React Router DOM v7 |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 줌/팬 | react-zoom-pan-pinch |
| 폰트 | Pretendard, Nanum Pen Script, Gaegu |

---

## 실행 방법

```bash
cd react
npm install
npm run dev
```

---

## 폴더 구조

```
react/src/
│
├── App.jsx                        # 라우터 설정, 페이지 연결
├── main.jsx                       # 앱 진입점
├── index.css                      # 전역 스타일 (폰트, .app-device 등)
│
├── pages/                         # 화면 단위 컴포넌트 (라우트 1개 = 파일 1개)
│   ├── SplashPage.jsx             # 스플래시 화면
│   ├── OnboardingPage.jsx         # 온보딩
│   ├── LoginPage.jsx              # 로그인
│   ├── SignupPage.jsx             # 회원가입
│   ├── HomePage.jsx               # 홈 (인기 공간, 최근 흔적)
│   ├── Map.jsx                    # 지도
│   ├── PlaceDetail.jsx            # 장소 상세
│   ├── BoardDetail.jsx            # 보드 화면 (포스트잇/폴라로이드 캔버스)
│   └── PostItEditor.jsx           # 흔적 작성 에디터
│
├── layouts/
│   └── MainLayout.jsx             # 홈/지도 공통 레이아웃 (로고 헤더 + 하단 네비)
│
├── components/                    # 재사용 컴포넌트
│   │
│   ├── BottomNavigation.jsx       # 하단 탭 네비게이션
│   ├── HomeFilters.jsx            # 홈 지역 선택 + 카테고리 칩
│   ├── TopPlacesSection.jsx       # 인기 공간 TOP 5 섹션
│   ├── RecentTracesSection.jsx    # 최근 흔적 리스트 섹션
│   │
│   ├── board/                     # 보드 관련 컴포넌트
│   │   ├── BoardCanvas.jsx        # 줌/팬 캔버스 + 흔적 렌더링
│   │   ├── PostItCard.jsx         # 포스트잇 카드
│   │   ├── PostIt.jsx             # (미사용 예정)
│   │   ├── Polaroid.jsx           # (미사용 예정)
│   │   └── FloatingAddButton.jsx  # (미사용 예정)
│   │
│   └── cards/                     # 카드형 UI 컴포넌트
│       ├── TopPlaceCard.jsx       # 인기 장소 카드
│       └── RecentTraceItem.jsx    # 최근 흔적 아이템
│
├── assets/                        # 정적 리소스
│   ├── image.png                  # 보드 배경 이미지 (크림색 손그림)
│   ├── images/
│   │   ├── home/                  # 홈 화면용 이미지
│   │   │   ├── top/               # 인기 공간 사진 (top-1~5.jpg)
│   │   │   ├── recent/            # 최근 흔적 사진 (recent-1~4.jpg)
│   │   │   └── avatars/           # 프로필 이미지 (avatar-1~4.jpg)
│   │   ├── postits/               # 포스트잇 텍스처
│   │   │   ├── yellow.png
│   │   │   ├── pink-torn.png
│   │   │   ├── green.png
│   │   │   └── grid-cream.png
│   │   └── tapes/
│   │       └── tape-basic.png     # 마스킹 테이프 이미지
│   ├── logo/                      # 로고 파일
│   └── onboarding/                # 온보딩 이미지
│
├── css/                           # 페이지별 CSS (Tailwind로 커버 안 되는 것)
│   ├── splash.css
│   ├── login.css
│   └── onboarding.css
│
└── api/                           # 백엔드 API 통신 헬퍼
    ├── client.js                  # 공통 fetch 래퍼, 토큰 처리
    ├── auth.js                    # 로그인/OAuth/로그아웃
    ├── users.js                   # 회원가입, 내 정보 조회/수정
    ├── places.js                  # 주변/인기 장소 조회
    ├── boards.js                  # 보드 조회/생성
    ├── traces.js                  # 흔적 목록/작성/수정/삭제/좋아요
    ├── reports.js                 # 흔적 신고
    ├── archive.js                 # 내 흔적/아카이브
    └── locationDistrict.js        # 현재 위치 기반 구/동 확인
```

---

## 라우트 구조

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | redirect → `/splash` | |
| `/splash` | SplashPage | 앱 시작 |
| `/onboarding` | OnboardingPage | 온보딩 |
| `/login` | LoginPage | 로그인 |
| `/signup` | SignupPage | 회원가입 |
| `/home` | HomePage | 홈 |
| `/map` | Map | 지도 |
| `/place/:id` | PlaceDetail | 장소 상세 |
| `/board/:id` | BoardDetail | 보드 (공간 방명록) |
| `/board/:id/postit` | PostItEditor | 흔적 작성 |

---

## 보드 화면 구조

```
BoardDetail (pages/)
├── image.png — 고정 배경 (항상 전체화면)
├── BoardCanvas (components/board/)
│   ├── react-zoom-pan-pinch — 핀치줌/드래그
│   ├── PolaroidCard — 폴라로이드
│   └── PostItCard — 포스트잇 (텍스처 이미지 적용)
├── 플로팅 헤더 — 인기순/최신순 탭 + 필터
└── FAB 버튼 — 돋보기 / + (흔적 추가)
```

### 데이터 흐름

```
PostItEditor → `/api/boards/{boardId}/traces`로 흔적 작성
BoardDetail → `/api/boards/{boardId}/traces`로 흔적 목록 조회
이미지 업로드 → `/api/traces/images`
```

---

## 주요 설계 결정

- **보드 배경은 캔버스 밖** — 줌/팬해도 배경이 항상 전체화면 유지
- **행렬 기반 배치** — 2컬럼 + 시드 기반 지터(위치/회전) 로 자연스러운 배치
- **API 연동** — `src/api` 헬퍼를 통해 백엔드와 통신하고 JWT는 localStorage에 저장
- **app-device** — PC에서도 모바일 앱처럼 보이도록 중앙 고정 컨테이너
