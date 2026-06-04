# 여긴남김 프론트엔드 README

Codex가 프론트엔드 작업의 뼈대를 빠르게 잡기 위한 구조 가이드입니다. 구현 판단은 항상 현재 소스 코드를 우선합니다.

## 한눈에 보기

- 앱 위치: `Yeoginamgim-Front/react`
- 런타임/빌드: npm, Vite 8
- 주요 기술: React 19, React Router DOM 7, Tailwind CSS 4, Framer Motion
- 아이콘/보조 UI: Lucide React, React Icons, react-zoom-pan-pinch
- 진입점: `src/main.jsx`
- 라우트 정의: `src/App.jsx`
- 전역 스타일: `src/index.css`
- 백엔드 기본 URL: `VITE_API_BASE_URL`이 없으면 `http://localhost:8080`

## 실행과 검증

```powershell
cd Yeoginamgim-Front\react
npm ci
npm run dev
```

```powershell
cd Yeoginamgim-Front\react
npm run lint
npm run build
```

## 환경 변수

- `VITE_API_BASE_URL`: 백엔드 API base URL
- `VITE_KAKAO_JAVASCRIPT_KEY`: Kakao Maps JavaScript SDK key

환경 변수와 API key는 `.env` 계열 로컬 파일에 두고 README나 소스에 실제 값을 적지 않습니다.

## 소스 구조

```text
react/src/
├─ App.jsx             # 라우트, 인증 보호, 페이지 연결
├─ main.jsx            # React 앱 마운트
├─ index.css           # Tailwind, 전역 스타일, 앱 공통 스타일
├─ api/                # 백엔드/외부 API 통신 helper
├─ assets/             # 이미지, 로고, 아이콘, 보드/홈 화면 리소스
├─ components/         # 재사용 UI 컴포넌트
├─ components/board/   # 보드 캔버스, 포스트잇, 폴라로이드, FAB
├─ components/cards/   # 홈 카드형 UI
├─ css/                # 페이지별 보조 CSS
├─ layouts/            # 공통 레이아웃
└─ pages/              # 라우트 단위 화면과 화면별 util/test
```

## 라우트 구조

`src/App.jsx` 기준 현재 라우트입니다.

```text
/                  -> /splash로 redirect
/splash            -> SplashPage
/onboarding        -> OnboardingPage
/login             -> LoginPage
/signup            -> SignupPage
/oauth/callback    -> OAuthCallbackPage

인증 필요, MainLayout 사용:
/home              -> HomePage
/map               -> Map
/archive           -> ArchivePage
/my                -> MyPage

일반 접근:
/place/:id         -> PlaceDetail
/board/:id         -> BoardDetail

인증 필요:
/board/:id/postit  -> PostItEditor
```

인증 보호는 `RequireAuth`가 `getAuthToken()`을 확인하는 방식입니다. 토큰은 `src/api/client.js`의 `yeoginamgim.authToken` localStorage key를 사용합니다.

## API helper 구조

API 호출은 `src/api` 아래에 모읍니다. 새 백엔드 연동을 추가할 때는 페이지에서 직접 `fetch`를 흩뿌리지 말고 이 계층에 helper를 추가합니다.

```text
api/client.js            # 공통 request, ApiError, token 처리, JSON/FormData 분기
api/auth.js              # 로그인, 로그아웃, OAuth URL/redirect
api/users.js             # 회원가입, 내 정보, 수정, 탈퇴
api/places.js            # 인기/주변/검색 장소
api/boards.js            # 보드 조회/생성, route id 해석
api/boards.utils.js      # 보드 요청/응답 정규화와 resolver
api/traces.js            # 최근 흔적, 보드 흔적, 영역 흔적, CRUD, 이미지, 좋아요
api/reports.js           # 흔적 신고
api/archive.js           # 내 흔적, 아카이브, 받은 좋아요, 즐겨찾기 장소
api/kakaoMaps.js         # Kakao Maps SDK 로딩과 상태 확인
api/locationDistrict.js  # 현재 위치 기반 행정구역 캐시/해석
```

## 페이지 구조

- `SplashPage.jsx`, `OnboardingPage.jsx`: 초기 진입 흐름
- `LoginPage.jsx`, `SignupPage.jsx`, `OAuthCallbackPage.jsx`: 인증 화면
- `HomePage.jsx`: 인기 장소와 최근 흔적
- `Map.jsx`: 지도/장소 탐색
- `PlaceDetail.jsx`: 장소 상세와 보드 연결
- `BoardDetail.jsx`: 장소 보드, 흔적 배치와 탐색
- `PostItEditor.jsx`: 흔적 작성
- `ArchivePage.jsx`: 내 흔적/아카이브
- `MyPage.jsx`: 내 정보 화면

화면별 순수 로직은 `*.utils.js`로 분리되어 있고, 일부는 `*.utils.test.js`로 테스트가 붙어 있습니다.

## UI 컴포넌트 지도

- `layouts/MainLayout.jsx`: 인증 영역의 공통 레이아웃과 하단 내비게이션
- `components/BottomNavigation.jsx`: 홈/지도/추가/아카이브/마이 이동
- `components/HomeFilters.jsx`: 홈 필터
- `components/TopPlacesSection.jsx`: 인기 장소 섹션
- `components/RecentTracesSection.jsx`: 최근 흔적 섹션
- `components/cards/TopPlaceCard.jsx`: 인기 장소 카드
- `components/cards/RecentTraceItem.jsx`: 최근 흔적 아이템
- `components/board/BoardCanvas.jsx`: 보드 확대/축소/드래그 캔버스
- `components/board/PostItCard.jsx`, `PostIt.jsx`: 포스트잇 표시
- `components/board/Polaroid.jsx`: 폴라로이드 표시
- `components/board/PlacementOverlay.jsx`: 배치 보조 UI
- `components/board/FloatingAddButton.jsx`: 보드 액션 버튼

## 테스트와 검증 메모

현재 프론트에는 Vitest 같은 별도 test script가 설정되어 있지 않습니다. 대신 `*.test.js` 파일이 일부 존재하므로 테스트 실행 스크립트를 추가할 때는 `package.json`과 기존 테스트 파일의 실행 환경을 함께 정리해야 합니다.

검증 가능한 기본 명령은 `npm run lint`, `npm run build`입니다.

## 작업 원칙

- 실제 백엔드 연동은 `src/api` helper를 통해 추가합니다.
- 비동기 데이터 화면에는 loading, empty, error 상태를 함께 고려합니다.
- 인증이 필요한 화면은 `RequireAuth` 또는 기존 인증 흐름과 맞춰 연결합니다.
- 모바일 우선의 조용하고 따뜻한 디자인 방향을 유지합니다.
- 임시 `console.log`, 임시 mock 흐름, 사용하지 않는 asset import는 handoff 전에 제거합니다.

