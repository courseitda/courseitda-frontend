# 코스잇다 (CourseItda) 프론트엔드

코스잇다 (CourseItda)는 일상 동선, 데이트, 여행 코스 등을 카테고리별로 정리하고  
Naver Maps SDK 기반 지도로 한눈에 시각화하는 코스 플래너 서비스입니다.  
이 레포지토리는 코스잇다의 웹 프론트엔드 애플리케이션을 담고 있습니다.

백엔드는 Spring Boot + Spring Data JPA + MySQL 기반의 별도 레포지토리(`courseitda-backend`)에서 관리되며,  
프론트엔드는 REST API를 통해 모든 영속 데이터를 조회·조작합니다.

---

## 1. 프로젝트 개요 (Overview)

- 개인이 만들고 싶은 코스를 **워크스페이스(Workspace)** 단위로 관리하는 웹 애플리케이션입니다.
- 각 워크스페이스 안에서 카테고리(예: 점심, 카페, 산책)를 나누고, 장소를 검색해 추가할 수 있습니다.
- Naver Places 기반 장소 검색과 Naver Maps SDK 기반 지도 렌더링을 통해 코스를 시각적으로 구성합니다.
- 대표 장소를 기준으로 경로를 생성하고, 카테고리별 색상으로 마커를 표시해 코스를 직관적으로 확인할 수 있습니다.
- JWT 기반 인증을 사용하며, 로그인한 사용자별 워크스페이스·설정·색상 팔레트 정보를 관리합니다.

---

## 2. 주요 기능 (Features)

- **인증 및 계정 관리**
  - 이메일·비밀번호 기반 회원가입/로그인
  - 네비게이션/드롭다운/마이페이지용 사용자 정보 표시
- **워크스페이스 관리**
  - 내 워크스페이스 리스트 조회, 생성, 수정, 삭제
  - 마지막 수정 시간 표시 및 정렬
  - 컨텍스트 메뉴를 통한 빠른 편집/삭제
- **카테고리 & 장소 관리**
  - 워크스페이스 내부 카테고리 생성/이름 변경/삭제/순서 재정렬
  - 카테고리별 색상 팔레트 및 대표 장소 지정
  - Naver Places 검색 결과에서 장소를 선택해 카테고리에 추가
- **지도 기반 코스 시각화**
  - Naver Maps SDK를 사용해 카테고리별 장소 마커 표시
  - 대표 장소를 연결하는 경로(폴리라인) 및 색상 그라데이션 표현
  - 장소 클릭 시 커스텀 InfoWindow로 상세 정보 표시
- **사용성 & UI/UX**
  - shadcn/ui + Tailwind CSS 기반의 일관된 폼·다이얼로그·토스트 UI
  - 모바일 퍼스트 레이아웃, 반응형 그리드 및 헤더 구조
  - React Query + 토스트를 활용한 요청 상태 및 에러 피드백

---

## 3. 기술 스택 (Tech Stack)

- **프론트엔드 프레임워크**
  - React 18 (TypeScript)
  - Vite (번들러/개발 서버)
  - React Router DOM (멀티 페이지 라우팅)
- **상태 관리 & 데이터 패칭**
  - TanStack React Query – 서버 상태 캐싱 및 동기화
  - Zustand – 인증 토큰, 색상 팔레트, 지도 설정 등 클라이언트 상태 관리
  - Axios – 백엔드 REST API 호출 (`src/lib/axios.ts`)
- **UI & 스타일링**
  - Tailwind CSS + `tailwindcss-animate`
  - shadcn/ui 컴포넌트 세트 (`src/components/ui`)
  - Lucide 아이콘 세트
  - 전역 색상·테마 관리는 `index.css` / `tailwind.config.ts`에서 통합 관리
- **지도 & 외부 서비스**
  - Naver Maps JavaScript SDK – 지도 렌더링 및 마커/경로 표시
  - Naver Places 검색 – 백엔드 프록시를 통해 장소 검색
- **테스트 & 품질**
  - Vitest – 유닛/통합 테스트
  - Playwright – E2E 및 UI 테스트 (`tests-ui/`)
  - ESLint – 코드 품질 검사

---

## 4. 설치 및 실행 방법 (Installation / Run)

### 4-1. 사전 준비

- Node.js (LTS 버전 권장)
- npm (또는 pnpm / Bun 등 Node 패키지 매니저)
- 코스잇다 백엔드 서버(`courseitda-backend`) 실행 환경

### 4-2. 레포지토리 클론

```bash
git clone https://github.com/your-org/courseitda-frontend.git
cd courseitda-frontend
```

### 4-3. 환경 변수 설정

`.env.example` 파일을 기준으로 로컬 설정 파일을 생성합니다.

```bash
cp .env.example .env.local
```

필수 환경 변수:

- `VITE_API_BASE_URL` – 백엔드 API 서버 기본 URL (예: `http://localhost:8080`)
- `VITE_DEV_MODE` – 개발 모드 플래그 (`true`/`false`)
- `VITE_NAVER_MAP_KEY_ID` – Naver Maps JavaScript SDK Key ID

> Naver Maps Secret Key 등 민감 정보는 백엔드/인프라에서 관리하며, 프론트엔드 환경 변수에는 Key ID만 주입합니다.

### 4-4. 의존성 설치

```bash
npm install
```

> 필요에 따라 `pnpm install` 또는 `bun install`을 사용할 수 있습니다.

### 4-5. 개발 서버 실행

```bash
npm run dev
```

기본적으로 Vite 개발 서버는 `http://localhost:5173`에서 동작합니다.

### 4-6. 프로덕션 빌드 & 프리뷰

```bash
npm run build
npm run preview
```

### 4-7. 테스트 실행 (선택)

```bash
# 유닛/통합 테스트
npm test

# E2E 테스트 (Playwright)
npm run test:e2e
```

---

## 5. 폴더 구조 요약 (Directory Structure)

주요 디렉터리 구조는 다음과 같습니다.

```text
courseitda-frontend/
├─ docs/
│  ├─ API.md           # 백엔드 REST API 연동 및 흐름
│  └─ DB.md            # 도메인 엔티티 및 DB 설계 개요
├─ public/             # 정적 리소스
├─ src/
│  ├─ assets/          # 이미지, 로고 등 정적 에셋
│  ├─ components/
│  │  └─ ui/           # shadcn 기반 공통 UI 컴포넌트
│  ├─ entities/        # 도메인 엔티티 타입 정의
│  ├─ features/        # 기능 단위 모듈 (지도, 워크스페이스, 장소 등)
│  ├─ hooks/           # 공통 React 훅
│  ├─ lib/             # axios, Naver Maps 로더 등 공용 라이브러리
│  ├─ pages/           # 라우팅 단위 페이지 컴포넌트
│  ├─ services/
│  │  └─ api/          # 백엔드 REST API 서비스 래퍼
│  ├─ shared/          # 전역 스토어(Zustand), 유틸리티, 상수
│  ├─ types/           # 외부 SDK/공용 타입 정의
│  ├─ App.tsx          # 루트 컴포넌트 및 라우팅 설정
│  └─ main.tsx         # React 진입점
├─ tests-ui/           # Playwright 기반 UI/E2E 테스트
├─ index.html          # Vite 엔트리 HTML
├─ package.json        # 스크립트 및 의존성 정의
├─ tailwind.config.ts  # Tailwind CSS 설정
└─ vite.config.ts      # Vite 번들러 설정
```

---

## 6. 데이터 설계 개요 (Domain Model)

### 6-1. 백엔드 도메인 엔티티

백엔드 데이터 모델은 `docs/DB.md`와 `courseitda-backend` 레포지토리에 상세히 정의되어 있습니다.  
프론트엔드에서 주로 사용하는 핵심 엔티티는 다음과 같습니다.

| 도메인        | 설명                                                           | 주요 필드 예시                                      |
|--------------|----------------------------------------------------------------|-----------------------------------------------------|
| `Member`     | 코스잇다 회원 계정                                             | `id`, `email`, `password`, `nickname`              |
| `Workspace`  | 사용자가 관리하는 코스 컨테이너                                | `id`, `ownerId`, `identifier`, `title`, `modifiedAt` |
| `Category`   | 워크스페이스 내부 카테고리(점심, 카페 등)                      | `id`, `workspaceId`, `name`, `color`, `sequence`   |
| `Place`      | 실제 장소 정보 (Naver Places 기반)                             | `id`, `name`, `roadAddressName`, `latitude`, `longitude` |
| `CategoryPlace` | 카테고리와 장소 간 연결 (카테고리별 장소 매핑)             | `id`, `categoryId`, `placeId`                      |

- 하나의 `Member`는 여러 `Workspace`를 가질 수 있습니다.
- 각 `Workspace`는 여러 `Category`를 포함하며, 카테고리마다 색상·순서·대표 장소를 가집니다.
- `Category`와 `Place`는 `CategoryPlace` 엔티티를 통해 N:N 관계로 묶입니다.

### 6-2. 프론트엔드 상태 모델

- **서버 상태(Server State)**
  - React Query가 `/api/me/workspaces`, `/api/workspaces/{identifier}`, `/api/workspaces/{identifier}/categories` 등  
    백엔드 REST API 응답을 캐싱하고, 생성/수정/삭제/재정렬 이후 관련 쿼리 키를 무효화합니다.
- **클라이언트 상태(Client State)**
  - Zustand 스토어를 통해 다음과 같은 값만 로컬에 보관합니다.
    - `courseitda_token`, `courseitda_token_type` (JWT 토큰 정보)
    - `courseitda_color_palette_mode` (카테고리 색상 팔레트 모드)
    - Naver Maps Key ID 및 지도 관련 UI 설정
- **로컬 저장소(Local Storage)**
  - 자세한 키 및 역할은 `docs/DB.md`의 “프론트엔드 로컬 저장소” 섹션을 참고합니다.

### 6-3. 추가 문서

- `docs/API.md` – REST API 엔드포인트, 인증 흐름, React Query 키 전략
- `docs/DB.md` – 도메인 엔티티·테이블 구조·로컬 저장소 설계

위 두 문서는 백엔드 스펙 변경 시 함께 갱신해야 하며,  
프론트엔드 구현 시 항상 **단일 진실 소스(Single Source of Truth)** 로 활용됩니다.

