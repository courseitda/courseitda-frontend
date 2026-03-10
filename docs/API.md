# Backend API Integration Guide

프론트엔드 서비스 레이어(`src/services/api`)는 Spring REST API를 감싸며 `ApiResponse<T>` 형태로 일관된 성공/실패 값을 반환합니다. 이 문서는 현재 코드 기준으로 필요한 엔드포인트와 흐름을 정리합니다.

## 1. HTTP 클라이언트 & 인증 상태

- `src/lib/axios.ts`의 `apiClient`가 모든 호출을 담당합니다. 기본 `baseURL`은 `VITE_API_BASE_URL`(없으면 `http://localhost:8080`)입니다.
- 요청 인터셉터가 `localStorage`에 저장된 `courseitda_token`/`courseitda_token_type`을 자동으로 `Authorization` 헤더에 주입합니다.
- 401 응답 시 토큰을 제거하고 `/auth`로 리다이렉트하며, 403/404/500/네트워크 오류는 명시적인 에러 메시지로 변환합니다.
- `useAuthStore`는 토큰만 보관하고 사용자 프로필은 필요할 때마다 API로 가져옵니다. 메서드 호출 시 별도 토큰을 넘기는 구현도 있지만, 인터셉터 덕분에 중복 헤더가 생겨도 문제 없습니다.

## 2. 인증 & 사용자 엔드포인트

| 기능 | 엔드포인트 | 메서드 | 비고 |
| --- | --- | --- | --- |
| 로그인 | `/api/auth/login` | `POST` | `accessToken`, `tokenType` 반환. 실패 시 `BackendErrorCode.INCORRECT_PASSWORD`. |
| 회원가입 | `/api/members` | `POST` | 신규 사용자 생성. 성공 시 `id`, `nickname`, `email`. |
| 이메일 중복 확인 | `/api/members/validations/email` | `GET` | `value` 쿼리 파라미터 필요. |
| 닉네임 중복 확인 | `/api/members/validations/nickname` | `GET` | `value` 쿼리 파라미터 필요. |
| 드롭다운 정보 | `/api/me/dropdown` | `GET` | `Authorization` 필수, `nickname`, `email` 반환. |
| 네비게이터 정보 | `/api/me/navigator` | `GET` | 헤더 표시용 닉네임. |
| 프로필 정보 | `/api/me/profile` | `GET` | 마이페이지용 닉네임/이메일. |

- 로그인 성공 후 `setToken`을 호출하면 인터셉터가 자동으로 헤더를 구성하므로 별도의 토큰 관리 코드는 필요 없습니다.
- 사용자 정보는 페이지 단위에서 `authApi.getProfileInfo`, `authApi.getDropdownInfo` 등을 호출하여 즉시 최신 상태를 확보합니다.

## 3. 워크스페이스 도메인

| 기능 | 엔드포인트 | 메서드 | 메모 |
| --- | --- | --- | --- |
| 내 워크스페이스 목록 | `/api/me/workspaces` | `GET` | React Query 키 `['workspaces','me']`. |
| 워크스페이스 생성 | `/api/workspaces` | `POST` | `Authorization` 필요, 응답에 `identifier`, `modifiedAt`. |
| 워크스페이스 수정 | `/api/workspaces/{identifier}` | `PATCH` | 성공 시 최신 `modifiedAt` 수신. |
| 워크스페이스 삭제 | `/api/workspaces/{identifier}` | `DELETE` | 실패 시 메시지를 감싼 `ApiResponse` 반환. |
| 단건 조회 | `/api/workspaces/{identifier}` | `GET` | 상세 페이지. |
| 제목 중복 확인 | `/api/workspaces/validations/title` | `GET` | `value`, `ownerId` 쿼리 이용. |

- `workspaceApi`는 응답을 문자열 ID와 ISO 타임스탬프로 정규화합니다.
- 생성/수정/삭제 후에는 `['workspaces','me']`, `['workspace', identifier]`를 무효화하여 목록과 상세가 동기화되도록 유지합니다.
- 레거시 경로인 `workspaceApi.getByOwner`는 ownerId 기반 목록 조회로 남아 있지만, 신규 기능에서는 `getMyWorkspaces` 사용이 기본입니다.

## 4. 카테고리 & 장소 도메인

### 카테고리

| 기능 | 엔드포인트 | 메서드 | 비고 |
| --- | --- | --- | --- |
| 카테고리/장소 전체 조회 | `/api/workspaces/{identifier}/categories` | `GET` | 응답을 프론트 `WorkspaceCategory` 구조로 변환해 정렬합니다. |
| 카테고리 생성 | `/api/workspaces/{identifier}/categories` | `POST` | 색상, 이름 전달. |
| 카테고리 수정 | `/api/categories/{categoryId}` | `PATCH` | 부분 업데이트 허용. |
| 카테고리 삭제 | `/api/categories/{categoryId}` | `DELETE` | 연관된 장소 관계도 함께 제거. |
| 순서 재정렬 | `/api/workspaces/{identifier}/categories/sequence` | `POST` | 프론트는 0-based, 서버는 1-based라 가감 처리가 있습니다. |
| 대표 장소 지정/해제 | `/api/categories/{categoryId}/representative-place` | `PUT` / `DELETE` | `categoryPlaceId`를 바디로 전달. |

- `useWorkspaceCategories`는 위 `GET` 응답을 페이지에서 바로 사용할 수 있는 구조로 가공합니다.
- 색상 팔레트 모드는 `useSettingsStore`에서 관리하며, 카테고리 생성/편집 다이얼로그에서 공유합니다.

### 장소

| 기능 | 엔드포인트 | 메서드 | 비고 |
| --- | --- | --- | --- |
| 장소 검색 | `/api/places/search` | `GET` | `keyword` 쿼리 필수. 백엔드가 Naver Places를 프록시하고, 프론트는 `SearchedPlace` DTO를 그대로 사용합니다. |
| 장소 추가 | `/api/categories/{categoryId}/places` | `POST` | `lat`/`lng`를 `latitude`/`longitude`로 매핑 후 전송. |
| 장소 삭제 | `/api/categories/{categoryId}/places/{categoryPlaceId}` | `DELETE` | 삭제 실패 시 `BackendErrorCode.CATEGORY_PLACE_NOT_FOUND`. |
| 장소 목록 조회 | `/api/categories/{categoryId}/places` | `GET` | 상세 관리 화면에서 직접 호출. |

- `placeApi.addToCategory`는 성공 시 `categoryPlaceId`와 좌표를 문자열 ID로 정규화하여 반환합니다.
- 지도 렌더링에는 `useSettingsStore`의 `naverMapKeyId` 값을 사용해 SDK를 초기화합니다.

## 5. 커뮤니티 & 내 보관함(MyStorage)

### 커뮤니티(공유 카테고리)

| 기능 | 엔드포인트 | 메서드 | 비고 |
| --- | --- | --- | --- |
| 추천 목록 조회 | `/api/community/shared-categories/recommendations` | `GET` | 비회원도 조회 가능 |
| 제목 검색 | `/api/community/shared-categories/search` | `GET` | `keyword` 쿼리(옵션) |
| 공유 카테고리 상세 조회 | `/api/community/shared-categories/{id}` | `GET` | 공유 카테고리 상세(장소 포함) |
| 내 공유 목록 | `/api/community/shared-categories/me` | `GET` | 내가 공유한 카테고리 목록, `Authorization` 필요 |
| 보관 카테고리 공유 | `/api/community/shared-categories` | `POST` | `{ savedCategoryId }` 바디, `Authorization` 필요 |
| 공유 카테고리 삭제 | `/api/community/shared-categories/{id}` | `DELETE` | 내가 올린 공유 카테고리 제거, `Authorization` 필요 |

- `communityApi`(`src/services/api/community.service.ts`)가 위 호출을 담당하며, 화면에서는 `useRecommendedSharedCategories`, `useSharedCategorySearch`, `useMySharedCategories`로 사용합니다.
- 공유 카테고리는 `isImmutableSnapshot: true`로 취급합니다. 즉 publish 이후에는 수정하지 않고, 상세 조회는 publish 시점 장소 목록 스냅샷을 기준으로 표시합니다.
- 내 공유 목록 응답은 `publishedFromSavedCategoryId`를 통해 어떤 보관 카테고리에서 게시되었는지 추적합니다.

### 내 보관함(보관 카테고리)

| 기능 | 엔드포인트 | 메서드 | 비고 |
| --- | --- | --- | --- |
| 내 보관 카테고리 목록 | `/api/me/saved-categories` | `GET` | `Authorization` 필요 |
| 내 보관 카테고리 생성 | `/api/me/saved-categories` | `POST` | `Authorization` 필요, `title`, `places` |
| 내 보관 카테고리 수정 | `/api/me/saved-categories/{savedCategoryId}` | `PATCH` | `Authorization` 필요, `title`, `places` |
| 내 보관 카테고리 삭제 | `/api/me/saved-categories/{savedCategoryId}` | `DELETE` | `Authorization` 필요 |

- `myStorageApi`(`src/services/api/my-storage.service.ts`)가 호출을 담당하며, 화면에서는 `useMySavedCategories`, `useCreateSavedCategory`, `useUpdateSavedCategory`, `useDeleteSavedCategory`로 사용합니다.
- 보관 카테고리는 `sourceType`으로 `manual` 또는 `forked`를 구분합니다.
- 공유 카테고리를 복사해 생성할 때는 `forkedFromSharedCategoryId`를 함께 보냅니다.
- 보관 카테고리 응답은 `canPublish`, `publishBlockedReason`을 포함하며, `forked` 카테고리는 장소를 한 번 수정하기 전까지 다시 게시할 수 없습니다.

## 6. 에러 처리 & 메시지 규약

- 백엔드는 Spring `ProblemDetail`을 확장해 `code`, `fieldErrors`를 내려줍니다. 예시는 `BackendErrorCode` 참조.
- `src/services/api/http.ts`의 `toError`/`fromAxiosError`가 응답을 `ApiResponse<never>`로 감싸고, `resolveErrorMessage`(`src/shared/utils/error-message.ts`)가 코드별 사용자 메시지를 도출합니다.
- 요청 검증 실패 시 `error.details.fieldErrors`에 필드별 경고문이 담깁니다. 폼 컴포넌트는 이 값을 그대로 사용합니다.
- Axios 인터셉터에서 변환된 에러는 `toError` 이전에 한 번 더 래핑될 수 있으므로, 서비스 레이어에선 항상 `toError`로 최종 메시지를 결정해야 합니다.

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "존재하지 않는 워크스페이스 입니다.",
  "code": "2003",
  "fieldErrors": null
}
```

## 7. React Query 키 & 캐시 전략

| 도메인 | Query Key | 설명 |
| --- | --- | --- |
| 워크스페이스 목록 | `['workspaces','me']` | 내 워크스페이스 대시보드 |
| 워크스페이스 상세 | `['workspace', identifier]` | 단일 워크스페이스 정보 |
| 카테고리 구조 | `['workspace', identifier, 'categories']` | 카테고리 + 장소 트리 |
| 커뮤니티 추천 | `['community','shared-categories','recommended']` | 공유 카테고리 추천 목록 |
| 커뮤니티 검색 | `['community','shared-categories','search', keyword]` | 공유 카테고리 검색 결과 |
| 내 공유 카테고리 | `['community','shared-categories','me']` | 내가 올린 공유 카테고리 목록 |
| 내 보관함 | `['my-storage','saved-categories','me']` | 내 보관 카테고리 목록 |

- 생성/수정/삭제/재정렬/대표 지정 등의 뮤테이션 이후에는 위 키를 `invalidateQueries`로 무효화합니다.
- 테스트(`Vitest`/`Playwright`) 전에는 백엔드 목업을 최신 API 스펙에 맞춰 동기화해야 합니다.

## 8. 참고 리소스

- `courseitda-frontend/docs/DB.md` – 엔티티 및 테이블 구조
- `src/services/api/*.ts` – 실제 호출 및 어댑터 구현
- `src/shared/utils/error-message.ts` – 에러 코드 <-> 메시지 매핑

---
이 문서는 프론트 서비스 레이어와 백엔드 명세가 변경될 때마다 함께 갱신해야 합니다.
