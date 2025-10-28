# Backend API Integration Guide

프론트엔드는 `BACKEND_API.md`에 정리된 Spring REST API를 Axios + React Query로 호출합니다.  
이 문서는 실제 연동 시 알아야 할 핵심 포인트를 요약합니다.

## 1. 인증 흐름

| 단계 | 엔드포인트 | 설명 | 응답 |
| --- | --- | --- | --- |
| 로그인 | `POST /api/auth/login` | 이메일/비밀번호 인증 | `{ "tokenType": "Bearer", "accessToken": "..." }` |
| 회원가입 | `POST /api/members` | 신규 사용자 생성 | `{ "id": 1, "nickname": "...", "email": "..." }` |
| 프로필 조회 | `GET /api/me/profile` | 닉네임·이메일 조회 | `{ "nickname": "...", "email": "..." }` |
| 네비게이터 표시 | `GET /api/me/navigator` | 헤더용 닉네임 조회 | `{ "nickname": "..." }` |

- 프론트는 `useAuthStore`로 토큰만 저장합니다.
- 사용자 정보가 필요할 때마다 `authApi.getProfileInfo` 혹은 `getNavigatorInfo`를 호출합니다.
- 백엔드가 토큰을 검증하므로 `/api/auth/verify` 같은 사전 검증 호출은 필요 없습니다.

## 2. 워크스페이스 흐름

| 기능 | 엔드포인트 | 메서드 |
| --- | --- | --- |
| 내 워크스페이스 목록 | `/api/me/workspaces` | `GET` |
| 워크스페이스 생성 | `/api/workspaces` | `POST` |
| 워크스페이스 수정 | `/api/workspaces/{identifier}` | `PATCH` |
| 워크스페이스 삭제 | `/api/workspaces/{identifier}` | `DELETE` |

- `workspaceApi`가 Axios 호출 및 응답 변환을 담당합니다.
- React Query 훅(`useWorkspacesByOwner`, `useWorkspace`)이 목록/상세를 캐시합니다.
- 뮤테이션 후에는 `['workspaces','me']`, `['workspace', identifier]` 쿼리를 무효화합니다.

## 3. 카테고리 & 장소 흐름

| 기능 | 엔드포인트 | 메서드 |
| --- | --- | --- |
| 워크스페이스 카테고리 목록 | `/api/workspaces/{identifier}/categories` | `GET` |
| 카테고리 생성 | `/api/workspaces/{identifier}/categories` | `POST` |
| 카테고리 수정 | `/api/categories/{categoryId}` | `PATCH` |
| 카테고리 삭제 | `/api/categories/{categoryId}` | `DELETE` |
| 순서 재정렬 | `/api/workspaces/{identifier}/categories/sequence` | `POST` |
| 대표 장소 설정 | `/api/categories/{categoryId}/representative-place` | `PUT`/`DELETE` |
| 장소 검색 | `/api/places/search?keyword={keyword}` | `GET` |
| 장소 추가 | `/api/categories/{categoryId}/places` | `POST` |
| 장소 삭제 | `/api/categories/{categoryId}/places/{categoryPlaceId}` | `DELETE` |

- `useWorkspaceCategories` 훅이 워크스페이스와 연관된 카테고리/장소를 한 번에 불러옵니다.
- `categoryApi`, `placeApi`가 각종 뮤테이션을 담당하며 성공 시 관련 캐시를 무효화합니다.
- Kakao 키는 `useSettingsStore`에서 로컬 저장 후 Axios 요청 헤더(백엔드 relaying)에 사용합니다.

## 4. 에러 처리

백엔드는 `GlobalExceptionHandler`에서 Spring `ProblemDetail`을 그대로 반환하며, `ErrorCode` enum의 `code` 값(예: `"2003"`)을 `problemDetail`의 `code` 프로퍼티로 추가합니다.

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "존재하지 않는 워크스페이스 입니다.",
  "code": "2003"
}
```

요청 DTO 검증 실패(`REQUEST_VALIDATION_FAILED`, `"0001"`) 시에는 `fieldErrors` 맵이 함께 내려옵니다.

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "요청 데이터 검증에 실패했습니다.",
  "code": "0001",
  "fieldErrors": {
    "nickname": "공백일 수 없습니다.",
    "password": "비밀번호는 6자 이상 20자 이하이어야 합니다."
  }
}
```

프론트 에러 처리 파이프라인:

1. `src/services/api/http.ts`  
   - `fromAxiosError`가 `problemDetail.detail` / `problemDetail.code` / `fieldErrors`를 추출  
   - `resolveErrorMessage` (`src/shared/utils/error-message.ts`)로 코드별 한국어 메시지를 매핑  
   - `ApiResponse` 표준 타입으로 에러 객체를 감싸고, `error.details.fieldErrors`에 필드별 메시지를 유지합니다.
2. 페이지/훅 레이어  
   - React Query `onError` 또는 `error` 상태에서 `apiResponse.error?.message`를 UI에 전달  
   - 폼 검증 시 `error.details?.fieldErrors`를 참조하여 필드별 에러 메시지를 매핑  
   - 필요 시 `error.details`에 담긴 `title`, `detail`, `type` 등을 로깅합니다.
3. Axios 인터셉터(`src/lib/axios.ts`)  
   - 401/403은 토큰 초기화 및 로그인 리다이렉션, 5xx는 전역 토스트를 표시

> 에러 코드 ↔ 메시지 매핑은 `src/shared/utils/error-message.ts`에 정의되어 있으며, 백엔드 `ErrorCode`가 변경될 때 반드시 해당 파일을 함께 갱신하세요.

## 5. React Query Key 표준

| 도메인 | Query Key | 설명 |
| --- | --- | --- |
| 워크스페이스 목록 | `['workspaces','me']` | 인증된 사용자 워크스페이스 |
| 워크스페이스 상세 | `['workspace', identifier]` | 단일 워크스페이스 |
| 카테고리/장소 | `['workspace', identifier, 'categories']` | 워크스페이스 내부 구조 |

뮤테이션 성공 시 위 키를 invalidate하여 최신 데이터를 유지합니다.

## 6. 참고 문서

- `BACKEND_API.md` – 상세 엔드포인트 명세  
- `src/services/api/*.ts` – Axios 호출 구현  
- `src/shared/utils/error-message.ts` – 에러 메시지 매핑  
- 백엔드 레포지토리 `courseitda-backend` – 실제 엔티티/예외/마이그레이션 정의

---  
이 문서를 업데이트할 때는 프론트의 서비스 레이어와 백엔드 엔드포인트 변경 사항을 동시에 반영하세요.
