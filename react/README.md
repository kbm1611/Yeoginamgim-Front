# YEOGINAMGIM-FRONT
`YEOGINAMGIM-FRONT`는 **여기남김** 프로젝트의 React 프론트엔드입니다.  
사용자가 장소를 검색하고, 지도에서 공간을 확인하고, 해당 공간에 흔적을 남기거나 조회하는 화면을 담당합니다.

---
## 프로젝트 구조
```text
react
├─ node_modules
├─ public
├─ src
│  ├─ api
│  ├─ assets
│  ├─ components
│  ├─ css
│  ├─ pages
│  ├─ App.css
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ README.md
└─ vite.config.js
```
---
## 폴더 역할
### node_modules
프로젝트에서 사용하는 외부 라이브러리들이 설치되는 폴더입니다.  
React, Vite, Axios, React Router 같은 패키지가 이곳에 들어갑니다.
직접 수정하지 않으며, GitHub에는 보통 올리지 않습니다.

---

### public
정적인 파일을 보관하는 폴더입니다.  
빌드 과정에서 별도 변환 없이 그대로 배포됩니다.
파비콘, 기본 이미지, 정적 파일 등을 넣습니다.

---
### src
실제 React 프론트엔드 소스 코드가 들어가는 핵심 폴더입니다.
화면, 컴포넌트, API 요청 코드, CSS, 이미지 리소스 등을 이 안에서 관리합니다.

---
### src/api
백엔드 서버나 외부 API와 통신하는 함수를 모아두는 폴더입니다.
역할 예시:
- 카카오 장소 검색 API 요청
- 백엔드 장소 저장/조회 요청
- 흔적 작성/수정/삭제 요청
- 로그인/회원 관련 요청
예시 파일:
- kakaoApi.js
- spotApi.js
- traceApi.js
- userApi.js

---
### src/assets
이미지, 아이콘, 로고 같은 정적 리소스를 보관하는 폴더입니다.
예시:
- logo.png
- marker.png
- postit.png
- sticker-star.png

---

### src/components
여러 페이지에서 재사용할 수 있는 작은 UI 조각들을 모아두는 폴더입니다.
역할 예시:
- Header
- Footer
- KakaoMap
- SearchBox
- TraceCard
- TraceEditor
- Modal
- Button
컴포넌트는 보통 하나의 기능이나 UI 단위를 담당합니다.

---
### src/css
CSS 파일을 모아두는 폴더입니다.
역할 예시:
- 공통 스타일
- 페이지별 스타일
- 지도 화면 스타일
- 흔적 작성 화면 스타일
- 반응형 디자인 스타일
예시 파일:
- common.css
- main.css
- map.css
- trace.css

---
### src/pages
라우팅 기준이 되는 페이지 컴포넌트를 모아두는 폴더입니다.
역할 예시:
- MainPage
- LoginPage
- SpotPage
- BoardPage
- MyPage
pages는 하나의 전체 화면을 담당하고, 그 안에서 components 폴더의 컴포넌트들을 조립해서 사용합니다.

---

## 주요 파일 역할

### src/main.jsx
React 앱의 시작점입니다.  
index.html의 root 영역에 React 앱을 연결합니다.

---
### src/App.jsx
전체 앱의 최상위 컴포넌트입니다.  
라우터 설정이나 전체 레이아웃을 관리하는 역할을 합니다.

---
### src/App.css
App.jsx와 관련된 스타일을 작성하는 CSS 파일입니다.  
프로젝트가 커지면 src/css 폴더에 스타일을 나누어 관리하는 것이 좋습니다.

---
### src/index.css
전체 프로젝트에 적용되는 전역 CSS 파일입니다.
예시:
- 기본 margin 제거
- 기본 font 설정
- body 배경색 설정
- 공통 box-sizing 설정

---
### index.html
React 앱이 렌더링될 기본 HTML 파일입니다.  
React는 보통 div id="root" 영역 안에 화면을 그립니다.

---
### package.json
프로젝트 정보와 사용하는 라이브러리 목록, 실행 명령어가 들어있는 파일입니다.
주요 명령어:
- npm run dev
- npm run build
- npm run preview

---
### package-lock.json
설치된 라이브러리의 정확한 버전 정보를 기록하는 파일입니다.  
팀원들과 같은 버전의 패키지를 사용하기 위해 필요합니다.
직접 수정하지 않습니다.

---
### .gitignore
GitHub에 올리지 않을 파일이나 폴더를 설정하는 파일입니다.
예시:
- node_modules
- dist
- .env
API 키가 들어있는 .env 파일은 보안상 GitHub에 올리면 안 됩니다.

---
### eslint.config.js
ESLint 설정 파일입니다.  
코드 스타일을 검사하고, 실수를 줄이기 위한 규칙을 관리합니다.

---

### vite.config.js
Vite 설정 파일입니다.  
개발 서버, 빌드 옵션, 프록시 설정 등을 관리할 수 있습니다.

---
## 추천 개발 흐름
### 1. 패키지 설치
npm install
### 2. 개발 서버 실행
npm run dev
### 3. 브라우저 접속
http://localhost:5173

---
## 여기남김 프론트엔드 개발 기준
이 프로젝트에서는 다음과 같은 기준으로 파일을 나누어 관리합니다.
pages  
→ 하나의 화면 단위
components  
→ 여러 화면에서 재사용하는 UI 단위
api  
→ 서버와 통신하는 함수
assets  
→ 이미지, 아이콘, 로고
css  
→ 스타일 파일

---
## 네이밍 규칙
### 컴포넌트 파일
컴포넌트 파일은 PascalCase를 사용합니다.
예시:
- Header.jsx
- Footer.jsx
- KakaoMap.jsx
- TraceCard.jsx

### API 파일
API 파일은 camelCase를 사용합니다.
예시:
- kakaoApi.js
- spotApi.js
- traceApi.js

### CSS 파일
CSS 파일은 기능 또는 페이지 이름을 기준으로 작성합니다.
예시:
- main.css
- map.css
- trace.css
- common.css

---
## 주의사항
- node_modules는 직접 수정하지 않습니다.
- .env 파일은 GitHub에 올리지 않습니다.
- API 요청 코드는 src/api에 모아서 관리합니다.
- 페이지는 src/pages에 작성합니다.
- 재사용 가능한 UI는 src/components에 작성합니다.
- 이미지와 아이콘은 src/assets에 저장합니다.
- 전역 스타일은 index.css 또는 css/common.css에 작성합니다.