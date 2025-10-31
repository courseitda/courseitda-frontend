# Database Documentation

코스잇다 (CourseItda) 백엔드는 Spring Boot + Spring Data JPA로 MySQL을 사용합니다.  
프론트엔드는 모든 영속 데이터를 백엔드 REST API를 통해서만 읽고 쓰며, 로컬에는 인증 토큰과 UI 설정과 같은 클라이언트 전용 값만 저장합니다.

## 1. 아키텍처 개요

- **데이터 소스**: MySQL (실제 테이블은 Flyway 마이그레이션 및 JPA 엔티티 정의를 따름)
- **도메인 엔티티**
  - `Member` → 테이블 `members`
  - `Workspace` → 테이블 `workspaces`
  - `Category` → 테이블 `categories`
  - `CategoryPlace` → 테이블 `category_places`
  - `Place` → 테이블 `places`
- **프론트엔드 상태**: React Query가 서버 상태를 캐시하고, Zustand는 토큰·색상 팔레트·지도 설정 등 클라이언트 전용 상태만 유지합니다.

## 2. 핵심 테이블 요약

| Domain        | Table              | 주요 컬럼                                              | 설명 |
| ---           | ---                | ---                                                   | --- |
| Member        | `members`          | `id`, `email`, `password`, `nickname`                | 자체 회원 가입/로그인을 위한 사용자 정보 |
| Workspace     | `workspaces`       | `id`, `owner_id`, `identifier`, `title`              | 워크스페이스 메타 정보. `identifier`는 UUID 문자열 |
| Category      | `categories`       | `id`, `workspace_id`, `name`, `color`, `sequence`    | 워크스페이스 내부 카테고리. 정렬은 `sequence` 컬럼 |
| CategoryPlace | `category_places`  | `id`, `category_id`, `place_id` | 카테고리와 장소 매핑 엔티티. 대표 장소 여부는 `categories.representative_place_id` 로 연결 |
| Place         | `places`           | `id`, `name`, `road_address_name`, `latitude`, `longitude` | 장소 기본 정보 (외부 검색 결과 기반) |

> 상세 스키마와 인덱스 구성은 `courseitda-backend` 레포지토리의 엔티티 및 Flyway 마이그레이션 파일을 참고하세요.

## 3. 접근 원칙

**DB 계층은 원자적 CRUD만 수행하고, 모든 비즈니스 로직은 서비스 계층(= Edge Function 역할)에서 처리합니다.**

### ✅ 올바른 패턴

- 서비스/도메인 계층에서 유효성 검증·권한 검사 후, Repository로 단일 INSERT/UPDATE/DELETE를 실행
- 정렬/페이징은 JPA 쿼리 메서드 또는 QueryDSL로 위임하되, 비즈니스 로직은 자바 코드에서 처리
- 프론트엔드는 React Query를 통해 `GET /api/me/workspaces` 등 표준 엔드포인트를 호출하여 결과만 UI에 반영

### ❌ 피해야 할 패턴

- Stored Procedure, Trigger, View에 비즈니스 규칙을 담는 것
- 복잡한 계산/검증을 SQL에서 직접 수행하는 것
- 프론트엔드에서 IndexedDB/LocalStorage에 서버 데이터를 동기화하여 진실의 근원(Single Source of Truth)을 복제하는 것

## 4. 프론트엔드 로컬 저장소

| Key                          | 용도 |
| ---                          | --- |
| `courseitda_token`           | JWT 액세스 토큰 (Bearer) |
| `courseitda_token_type`      | 토큰 타입 (`Bearer` 기본값) |
| `courseitda_color_palette_mode` | 카테고리 색상 팔레트 모드 (`vibrant`, `pastel` 등) |

> 지도 SDK Key ID는 `.env`/환경 변수에서 주입되며 로컬 저장소에 보관하지 않습니다. 사용자 설정 값만 저장하고 서버 데이터는 로컬에 복제하지 않습니다.

## 5. 마이그레이션 및 변경 추적

- 스키마 변경은 백엔드의 Flyway 마이그레이션으로 관리됩니다.
- 프론트엔드 변경 시 반드시 `BACKEND_API.md`와 본 문서의 해당 섹션을 함께 갱신해 일관성을 유지하세요.
