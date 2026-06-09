# 여긴남김 프론트엔드 1차 기능 문서

`YEOGINAMGIM-FRONT`는 **여긴남김** 서비스의 React 프론트엔드입니다.

여긴남김은 사용자가 실제 장소를 찾고, 그 장소의 보드에 짧은 기억과 감정을 흔적으로 남기는 공간 기반 기록 서비스입니다. 이 문서는 사람이 프로젝트의 1차 기능 범위와 화면 구조를 빠르게 이해할 수 있도록 현재 프론트 코드와 백엔드 API 표면을 기준으로 정리했습니다.

---

## 서비스 한 줄 설명

장소를 검색하거나 지도에서 발견한 뒤, 장소별 보드에 포스트잇과 사진처럼 흔적을 남기고 다시 꺼내 보는 서비스입니다.

---

## 1차 기능 범위

### 1. 진입과 인증

- 스플래시 화면
- 온보딩 화면
- 일반 로그인
- 회원가입
- Kakao/Google OAuth 로그인 진입
- OAuth 로그인 후 프론트 콜백 처리
- 로그인 토큰 기반 인증 화면 보호
- 로그아웃

### 2. 홈

- 현재 지역 또는 선택 지역 기준 콘텐츠 표시
- 인기 장소 TOP 5 조회
- 최근 남겨진 흔적 조회
- 카테고리/필터 UI
- 장소 상세 또는 보드로 이동하는 진입점 제공

### 3. 지도와 장소 탐색

- Kakao Maps JavaScript SDK 로딩
- 현재 위치 기반 지도 화면
- 주변 장소 조회
- 검색어 기반 장소 조회
- 장소 선택 후 상세 화면으로 이동
- 장소 기반 보드 조회 또는 생성 흐름과 연결

### 4. 장소 상세

- 장소명, 카테고리, 주소, 대표 이미지 등 장소 정보 표시
- Kakao place id를 기준으로 백엔드 보드 조회
- 보드가 없으면 생성할 수 있는 흐름 제공
- 즐겨찾기 장소 API와 연결 가능한 구조 유지

### 5. 공간 보드

- 장소별 보드 화면
- 보드 배경 위에 흔적 표시
- 포스트잇/폴라로이드 형태의 흔적 카드 표시
- 확대, 축소, 드래그 기반 보드 탐색
- 영역 기반 흔적 조회 API와 연결 가능한 구조
- 흔적 작성 화면으로 이동

### 6. 흔적 작성

- 보드 위 위치에 흔적 작성
- 텍스트 흔적 작성
- 이미지 업로드
- 포스트잇/스타일 정보 저장
- 작성 완료 후 보드로 복귀하는 흐름

### 7. 보관함과 마이페이지

- 내가 남긴 흔적 조회
- 달력 또는 보드 기준 아카이브 조회
- 좋아요 받은 흔적 조회
- 내 정보 조회
- 내 정보 수정 또는 탈퇴 API와 연결 가능한 구조

---

## 기술 스택

`react/package.json` 기준입니다.

### 주요 라이브러리

- React 19
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- Framer Motion
- Lucide React
- React Icons
- react-zoom-pan-pinch

### 개발 도구

- npm
- ESLint
- Vite React Plugin
- Tailwind CSS Vite Plugin

---

## 실행 방법

```powershell
cd Yeoginamgim-Front\react
npm ci
npm run dev
```

빌드 확인:

```powershell
cd Yeoginamgim-Front\react
npm run build
```

Lint 확인:

```powershell
cd Yeoginamgim-Front\react
npm run lint
```

---

## 환경 변수

로컬 개발 환경에서는 `Yeoginamgim-Front/react/.env` 파일을 사용합니다.

```env
VITE_API_BASE_URL=https://d2a908jq2crel3.cloudfront.net
VITE_KAKAO_JAVASCRIPT_KEY=<Kakao JavaScript key>
```

- `VITE_API_BASE_URL`이 없으면 `src/api/client.js`에서 `https://d2a908jq2crel3.cloudfront.net`을 기본값으로 사용합니다.
- `VITE_KAKAO_JAVASCRIPT_KEY`는 Kakao Maps JavaScript SDK 로딩에 사용합니다.
- 프론트 `.env`에는 브라우저에 노출되어도 되는 값만 둡니다.
- OAuth client secret, JWT secret, DB password, Kakao REST API key는 프론트에 두지 않습니다.

LAN 기기 테스트와 Kakao Developers 설정은 `docs/ENVIRONMENT.md`를 참고합니다.

---

## 프로젝트 구조

```text
react/
├─ docs/
│  ├─ README_1차기능.md
│  ├─ ENVIRONMENT.md
│  ├─ design-system.md
│  └─ ui-rules.md
├─ public/
├─ src/
│  ├─ api/
│  ├─ assets/
│  ├─ components/
│  │  ├─ board/
│  │  └─ cards/
│  ├─ css/
│  ├─ layouts/
│  ├─ pages/
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
└─ vite.config.js
```

`node_modules`와 `.env`는 로컬 개발 환경에서 생성되는 파일/폴더이며 GitHub에 올리지 않습니다.

---

## 폴더 역할

### `src/api`

백엔드 API와 외부 SDK를 다루는 helper를 모아둡니다. 페이지에서 직접 `fetch`를 호출하지 않고 이 계층을 통해 요청합니다.

```text
client.js            # 공통 request, ApiError, token 처리, JSON/FormData 분기
auth.js              # 로그인, 로그아웃, OAuth URL/redirect
users.js             # 회원가입, 내 정보, 수정, 탈퇴
places.js            # 인기/주변/검색 장소
boards.js            # 보드 조회/생성, route id 해석
boards.utils.js      # 보드 요청/응답 정규화
traces.js            # 최근 흔적, 보드 흔적, 영역 흔적, CRUD, 이미지, 좋아요
reports.js           # 흔적 신고
archive.js           # 내 흔적, 아카이브, 받은 좋아요, 즐겨찾기 장소
kakaoMaps.js         # Kakao Maps SDK 로딩
locationDistrict.js  # 현재 위치 기반 행정구역 캐시/해석
```

### `src/pages`

라우팅 기준이 되는 화면 컴포넌트를 둡니다.

- `SplashPage.jsx`: 스플래시
- `OnboardingPage.jsx`: 온보딩
- `LoginPage.jsx`: 로그인
- `SignupPage.jsx`: 회원가입
- `OAuthCallbackPage.jsx`: OAuth 로그인 콜백
- `HomePage.jsx`: 홈
- `Map.jsx`: 지도
- `PlaceDetail.jsx`: 장소 상세
- `BoardDetail.jsx`: 공간 보드
- `PostItEditor.jsx`: 흔적 작성
- `ArchivePage.jsx`: 보관함
- `MyPage.jsx`: 마이페이지

화면별 순수 로직은 `*.utils.js`로 분리하고, 일부 로직은 `*.utils.test.js`로 테스트합니다.

### `src/components`

여러 화면에서 재사용하는 UI 컴포넌트를 둡니다.

- `BottomNavigation.jsx`: 하단 내비게이션
- `HomeFilters.jsx`: 홈 필터
- `TopPlacesSection.jsx`: 인기 장소 섹션
- `RecentTracesSection.jsx`: 최근 흔적 섹션
- `components/cards`: 카드형 UI
- `components/board`: 보드 캔버스, 포스트잇, 폴라로이드, 배치 UI, FAB

### `src/layouts`

공통 레이아웃을 둡니다. 현재는 인증 후 주요 화면에서 사용하는 `MainLayout.jsx`가 있습니다.

### `src/assets`

이미지, 로고, 아이콘, 포스트잇 텍스처, 보드 배경 등 정적 리소스를 둡니다.

### `src/css`

스플래시, 로그인, 회원가입, 온보딩처럼 페이지별 보조 CSS를 둡니다. 전역 기준은 `src/index.css`에서 관리합니다.

---

## 라우트 구조

`src/App.jsx` 기준입니다.

| 경로 | 컴포넌트 | 인증 | 설명 |
|---|---|---:|---|
| `/` | `/splash`로 이동 | 아니오 | 시작 경로 |
| `/splash` | `SplashPage` | 아니오 | 스플래시 |
| `/onboarding` | `OnboardingPage` | 아니오 | 온보딩 |
| `/login` | `LoginPage` | 아니오 | 로그인 |
| `/signup` | `SignupPage` | 아니오 | 회원가입 |
| `/oauth/callback` | `OAuthCallbackPage` | 아니오 | OAuth 로그인 결과 처리 |
| `/home` | `HomePage` | 예 | 홈 |
| `/map` | `Map` | 예 | 지도 |
| `/archive` | `ArchivePage` | 예 | 보관함 |
| `/my` | `MyPage` | 예 | 마이페이지 |
| `/place/:id` | `PlaceDetail` | 아니오 | 장소 상세 |
| `/board/:id` | `BoardDetail` | 아니오 | 공간 보드 |
| `/board/:id/postit` | `PostItEditor` | 예 | 흔적 작성 |

인증이 필요한 화면은 `RequireAuth`가 `getAuthToken()`을 확인합니다. 토큰이 없으면 `/login`으로 이동합니다.

---

## 주요 사용자 흐름

### 일반 로그인 흐름

```text
LoginPage
→ POST /api/auth/login
→ access token 저장
→ /home 이동
```

### OAuth 로그인 흐름

```text
LoginPage
→ Kakao/Google OAuth 시작 URL로 이동
→ 백엔드 OAuth callback 처리
→ 프론트 /oauth/callback 이동
→ token 저장
→ /home 이동
```

### 장소에서 보드로 이동하는 흐름

```text
Map 또는 Home
→ PlaceDetail
→ GET /api/places/{kakaoPlaceId}/board
→ 보드가 없으면 POST /api/boards
→ /board/:id 이동
```

### 흔적 작성 흐름

```text
BoardDetail
→ /board/:id/postit
→ 이미지가 있으면 POST /api/traces/images
→ POST /api/boards/{boardId}/traces
→ BoardDetail로 복귀
```

---

## 백엔드 API 연동 표면

프론트가 사용하는 주요 백엔드 API입니다.

### User

```text
POST   /api/user/signup
GET    /api/user/myinfo
PATCH  /api/user/update
DELETE /api/user/me
```

### Auth

```text
POST /api/auth/login
GET  /api/auth/oauth/kakao
GET  /api/auth/oauth/kakao/callback
GET  /api/auth/oauth/google
GET  /api/auth/oauth/google/callback
GET  /api/auth/logout
```

### Place

```text
GET /api/places/nearby
GET /api/places/search
GET /api/places/popular
```

### Board

```text
GET  /api/places/{kakaoPlaceId}/board
GET  /api/boards/{boardId}
POST /api/boards
```

### Trace

```text
GET    /api/traces/recent
GET    /api/boards/{boardId}/traces
GET    /api/boards/{boardId}/traces/area
POST   /api/boards/{boardId}/traces
GET    /api/traces/{traceId}
POST   /api/traces/images
PATCH  /api/traces/{traceId}
DELETE /api/traces/{traceId}
POST   /api/traces/{traceId}/likes
DELETE /api/traces/{traceId}/likes
```

### Report

```text
POST /api/traces/{traceId}/reports
```

### Archive

```text
GET    /api/me/traces
GET    /api/me/traces/{traceId}
GET    /api/me/archive/calendar
GET    /api/me/archive/boards
GET    /api/me/received-likes
GET    /api/me/archive/favorite-places
POST   /api/me/archive/favorite-places/{kakaoPlaceId}
DELETE /api/me/archive/favorite-places/{kakaoPlaceId}
```

---

## 디자인 방향

자세한 디자인 기준은 `docs/design-system.md`, `docs/ui-rules.md`를 따릅니다.

핵심 방향:

- 조용하고 따뜻한 분위기
- 모바일 우선 화면
- 사람의 감정과 장소의 기억을 우선
- 리뷰 서비스처럼 점수와 경쟁을 강조하지 않기
- 과한 그림자, 네온, 복잡한 정보 UI 지양

---

## 팀원 충돌 방지 가이드

의존성 충돌을 줄이기 위해 아래 순서를 지킵니다.

1. `package-lock.json`을 기준으로 설치합니다.
2. 새 패키지 설치 전 팀과 목적을 공유합니다.
3. 설치 후 `package.json`과 `package-lock.json`을 함께 커밋합니다.

패키지 설치는 기본적으로 아래 명령을 사용합니다.

```powershell
cd Yeoginamgim-Front\react
npm ci
```

새 패키지를 추가해야 할 때만 `npm install <package>`를 사용합니다.

---

## 네이밍 규칙

### 컴포넌트 파일

컴포넌트 파일은 PascalCase를 사용합니다.

```text
HomePage.jsx
TraceCard.jsx
BottomNavigation.jsx
```

### API 파일

API 파일은 도메인 기준으로 나눕니다.

```text
auth.js
users.js
places.js
boards.js
traces.js
reports.js
archive.js
```

### CSS 파일

CSS 파일은 페이지 또는 기능 이름을 기준으로 작성합니다.

```text
splash.css
login.css
signup.css
onboarding.css
```

---

## 개발 시 주의사항

- API 요청 코드는 `src/api`에 모아서 관리합니다.
- 페이지는 `src/pages`에 작성합니다.
- 재사용 가능한 UI는 `src/components`에 작성합니다.
- 이미지와 아이콘은 `src/assets`에 저장합니다.
- 전역 스타일은 `src/index.css`, 페이지별 보조 스타일은 `src/css`에 작성합니다.
- 비동기 화면에는 loading, empty, error 상태를 함께 고려합니다.
- 로그인 토큰은 `src/api/client.js`의 `yeoginamgim.authToken` key로 관리합니다.
- 임시 `console.log`와 임시 mock 흐름은 handoff 전에 제거합니다.
- 프론트에는 서버 secret을 저장하지 않습니다.


