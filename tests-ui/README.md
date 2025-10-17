# UI E2E 테스트 가이드

이 디렉토리는 **프론트엔드 UI의 End-to-End 테스트**를 포함하고 있습니다.  
백엔드 로직이 아닌, **사용자가 보는 화면과 인터랙션만 테스트**합니다.

## 🎯 테스트 목적

- ✅ **UI 표시**: 버튼, 다이얼로그, 메뉴 등이 화면에 제대로 나타나는가?
- ✅ **사용자 인터랙션**: 클릭, 입력, 드래그 등이 정상 작동하는가?
- ✅ **페이지 이동**: 버튼 클릭 시 올바른 페이지로 이동하는가?
- ✅ **반응형 디자인**: 모바일/데스크톱 레이아웃이 올바른가?
- ❌ **백엔드 로직**: API, DB, 도메인 검증은 테스트하지 않음

## 🚀 빠른 시작

### 1. 추천 방법 (UI 모드)
```bash
npm run test:e2e:ui
```
시각적으로 테스트를 확인하고 디버깅할 수 있는 가장 편리한 방법입니다.

### 2. 기본 실행 (Headless)
```bash
npm run test:e2e
```

### 3. 브라우저 보면서 실행
```bash
npm run test:e2e:headed
```

### 4. 테스트 리포트 보기
```bash
npm run test:e2e:report
```

## 📁 테스트 파일 구조

```
tests-ui/
├── auth.spec.ts          # 로그인/회원가입
├── workspace.spec.ts     # 워크스페이스 CRUD
├── category.spec.ts      # 카테고리 CRUD + 드래그앤드롭
├── place.spec.ts         # 장소 검색 UI
├── navigation.spec.ts    # 네비게이션/드롭다운/컨텍스트 메뉴
└── advanced.spec.ts      # 반응형/토스트/고급 UI
```

## 📝 주요 테스트 시나리오

### 🔐 인증 (auth.spec.ts)
- 로그인/회원가입 페이지 UI
- 탭 전환
- 폼 입력 및 제출
- 비밀번호 보기/숨기기
- 자동 로그인 후 페이지 이동

### 📁 워크스페이스 (workspace.spec.ts)
- 생성 버튼 → 다이얼로그 표시
- 폼 입력 → 생성 → 목록 표시
- 클릭 → 상세 페이지 이동
- 컨텍스트 메뉴 (우클릭)
- 수정/삭제

### 🏷️ 카테고리 (category.spec.ts)
- 추가 버튼 → 다이얼로그
- 추천 카테고리/직접 입력
- 색상 선택 및 팔레트 변경
- **드래그 앤 드롭 순서 변경**
- 수정/삭제

### 📍 장소 (place.spec.ts)
- 장소 검색 다이얼로그
- 카테고리 접기/펼치기
- 순서 번호 표시
- 빈 검색어 방지

### 🧭 네비게이션 (navigation.spec.ts)
- 프로필 드롭다운 메뉴
- 워크스페이스 전환 드롭다운
- 뒤로가기 버튼
- 컨텍스트 메뉴 (우클릭)
- ESC 키로 메뉴 닫기

### ⚡ 고급 기능 (advanced.spec.ts)
- 모바일 반응형 (390x844)
- 데스크톱 2단 분할 (1920x1080)
- 토스트 메시지
- 빈 상태 메시지
- 지도 API 키 안내

## 🎨 특정 테스트만 실행

```bash
# 로그인/회원가입만
npx playwright test auth.spec.ts

# 워크스페이스만
npx playwright test workspace.spec.ts

# 카테고리만
npx playwright test category.spec.ts

# 키워드로 검색
npx playwright test --grep "드래그"
```

## 🔧 기술 스택

- **Playwright**: E2E 테스트 프레임워크
- **TypeScript**: 타입 안전성
- **IndexedDB**: Mock 데이터 (실제 백엔드 없이 테스트)

## 💡 주요 특징

### ✨ Mock 데이터
- 실제 백엔드 API 없이도 테스트 가능
- IndexedDB를 사용한 클라이언트 저장소
- 각 테스트마다 DB 초기화하여 독립 실행

### ✨ 테스트 격리
- `beforeEach`에서 IndexedDB 초기화
- 테스트 간 데이터 간섭 없음
- 병렬 실행 가능

### ✨ 자동 디버깅 자료
- 실패 시 스크린샷 자동 저장
- 실패 시 비디오 녹화
- `test-results/` 디렉토리에서 확인

## 🐛 디버깅

### 1. UI 모드 (추천)
```bash
npm run test:e2e:ui
```
- 타임라인으로 각 단계 확인
- 스크린샷 미리보기
- 네트워크 요청 확인
- 실패 지점 쉽게 파악

### 2. 특정 테스트만 실행
```typescript
test.only('이 테스트만 실행', async ({ page }) => {
  // ...
});
```

### 3. 느린 속도로 실행
```bash
npx playwright test --headed --slow-mo=1000
```

## ⚠️ 문제 해결

### "Timed out waiting for WebServer"
개발 서버가 실행되지 않았습니다:
```bash
npm run dev
```

### "Executable doesn't exist"
Playwright 브라우저 설치:
```bash
npx playwright install chromium
```

### IndexedDB 관련 에러
Playwright 캐시 삭제:
```bash
npx playwright clean
```

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**중요**: 이 테스트들은 **UI만 검증**합니다. 백엔드가 Mock에서 실제 API로 바뀌어도 테스트 코드는 변경 없이 사용할 수 있습니다.
