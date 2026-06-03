# YEOGINAMGIM-FRONT

`YEOGINAMGIM-FRONT`는 **여기남김** 프로젝트의 React 프론트엔드입니다.

사용자가 장소를 검색하고, 지도에서 공간을 확인하고, 해당 공간의 보드에 흔적을 남기거나 조회하는 화면을 담당합니다. 이 문서는 Google Sheet의 `2.기획서`, `5.API 명세서`와 현재 프론트 코드 구조를 기준으로 정리했습니다.

---

## 기술 스택

아래 내용은 `react/package.json` 기준입니다.

### dependencies

- framer-motion: ^12.40.0
- lucide-react: ^1.17.0
- playwright: ^1.60.0
- react: ^19.2.6
- react-dom: ^19.2.6
- react-icons: ^5.6.0
- react-router-dom: ^7.15.1
- react-zoom-pan-pinch: ^4.0.3

### devDependencies

- @eslint/js: ^10.0.1
- @tailwindcss/vite: ^4.3.0
- @types/react: ^19.2.14
- @types/react-dom: ^19.2.3
- @vitejs/plugin-react: ^6.0.1
- eslint: ^10.3.0
- eslint-plugin-react-hooks: ^7.1.1
- eslint-plugin-react-refresh: ^0.5.2
- globals: ^17.6.0
- tailwindcss: ^4.3.0
- vite: ^8.0.12

---

## 프로젝트 구조

```text
react
├─ public
├─ src
│  ├─ api
│  │  ├─ archive.js
│  │  ├─ auth.js
│  │  ├─ boards.js
│  │  ├─ client.js
│  │  ├─ locationDistrict.js
│  │  ├─ places.js
│  │  ├─ reports.js
│  │  ├─ traces.js
│  │  └─ users.js
│  ├─ assets
│  ├─ components
│  ├─ css
│  ├─ layouts
│  ├─ pages
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

백엔드와 통신하는 API 헬퍼를 모아둡니다. 공통 fetch 래퍼는 `client.js`에 두고, 도메인별 요청은 `auth.js`, `users.js`, `places.js`, `boards.js`, `traces.js`, `reports.js`, `archive.js`로 분리합니다.

### `src/pages`

라우팅 기준이 되는 화면 컴포넌트를 둡니다.

- `SplashPage.jsx`
- `OnboardingPage.jsx`
- `LoginPage.jsx`
- `SignupPage.jsx`
- `HomePage.jsx`
- `Map.jsx`
- `PlaceDetail.jsx`
- `BoardDetail.jsx`
- `PostItEditor.jsx`

### `src/components`

여러 화면에서 재사용하는 UI 컴포넌트를 둡니다. 보드 관련 컴포넌트는 `components/board`, 카드형 UI는 `components/cards`에 둡니다.

### `src/layouts`

공통 레이아웃을 둡니다. 현재는 홈/지도 화면에 쓰는 `MainLayout.jsx`가 있습니다.

### `src/assets`

이미지, 로고, 아이콘, 포스트잇 텍스처 등 정적 리소스를 둡니다.

### `src/css`

페이지별 CSS 파일을 둡니다.

---

## 라우트 구조

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | `/splash`로 이동 | 시작 경로 |
| `/splash` | `SplashPage` | 스플래시 |
| `/onboarding` | `OnboardingPage` | 온보딩 |
| `/login` | `LoginPage` | 로그인 |
| `/signup` | `SignupPage` | 회원가입 |
| `/home` | `HomePage` | 홈 |
| `/map` | `Map` | 지도 |
| `/place/:id` | `PlaceDetail` | 장소 상세 |
| `/board/:id` | `BoardDetail` | 공간 보드 |
| `/board/:id/postit` | `PostItEditor` | 흔적 작성 |

`/home`, `/map`, `/board/:id/postit`은 로그인 토큰이 없으면 `/login`으로 이동합니다.

---

## API 연동 기준

프론트는 `VITE_API_BASE_URL`을 기준으로 백엔드에 요청합니다. 값이 없으면 `http://localhost:8080`을 기본값으로 사용합니다.

주요 연동 경로:

```text
POST  /api/user/signup
GET   /api/user/myinfo
PATCH /api/user/update

POST /api/auth/login
GET  /api/auth/oauth/kakao
GET  /api/auth/oauth/google
GET  /api/auth/logout

GET  /api/places/nearby
GET  /api/places/popular

GET  /api/places/{kakaoPlaceId}/board
GET  /api/boards/{boardId}
POST /api/boards

GET    /api/boards/{boardId}/traces
GET    /api/boards/{boardId}/traces/area
POST   /api/boards/{boardId}/traces
GET    /api/traces/{traceId}
POST   /api/traces/images
PATCH  /api/traces/{traceId}
DELETE /api/traces/{traceId}
POST   /api/traces/{traceId}/likes
DELETE /api/traces/{traceId}/likes

POST /api/traces/{traceId}/reports

GET /api/me/traces
GET /api/me/traces/{traceId}
GET /api/me/archive/calendar
GET /api/me/archive/boards
GET /api/me/received-likes
```

---

## 추천 개발 흐름

### 1. 패키지 설치

```powershell
cd Yeoginamgim-Front\react
npm ci
```

### 2. 개발 서버 실행

```powershell
npm run dev
```

### 3. 빌드 확인

```powershell
npm run build
```

---

## 주의사항

- API 요청 코드는 `src/api`에 모아서 관리합니다.
- 페이지는 `src/pages`에 작성합니다.
- 재사용 가능한 UI는 `src/components`에 작성합니다.
- 이미지와 아이콘은 `src/assets`에 저장합니다.
- 전역 스타일은 `src/index.css`, 페이지별 스타일은 `src/css`에 작성합니다.
- `.env`에는 `VITE_API_BASE_URL`, `VITE_KAKAO_JAVASCRIPT_KEY` 같은 공개 가능한 프론트 환경값만 둡니다.
- 실제 비밀번호, OAuth client secret, JWT secret은 프론트 `.env`에 두지 않습니다.
