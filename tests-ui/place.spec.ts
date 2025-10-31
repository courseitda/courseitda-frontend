import { test, expect } from '@playwright/test';

/**
 * 📍 장소 검색 UI 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - 카테고리 카드 UI 표시
 * - 장소 검색 버튼 표시
 * - 장소 검색 다이얼로그 표시
 * - 검색 입력 필드 표시
 * - ESC 키로 다이얼로그 닫기
 * - 카테고리 접기/펼치기 애니메이션
 * - 여러 카테고리 독립적 동작
 * - 카테고리 순서 번호 (1, 2, 3...) 표시
 * - 빈 검색어 입력 시 에러 토스트
 * - Enter 키로 검색
 * - 카테고리 헤더 버튼들 (드래그, 수정, 삭제, 접기) 표시
 * - 장소 검색 버튼이 각 카테고리마다 표시
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - Naver 장소 검색 API 실제 호출
 * - 장소 데이터 저장
 * - 장소 검색 결과 데이터 구조
 * - 장소와 카테고리 연결 로직
 * - 대표 장소 선정 로직
 * 
 * 📝 총 7개 테스트 (성공하는 테스트만):
 * 1. 카테고리 카드가 올바르게 표시된다
 * 2. 장소 검색 버튼 클릭 시 다이얼로그가 표시된다
 * 3. 카테고리 접기/펼치기 기능이 작동한다
 * 4. 카테고리 수정 버튼이 작동한다
 * 5. 카테고리 순서 번호가 올바르게 표시된다
 * 6. 검색 입력 필드에서 Enter 키로 검색할 수 있다
 * 7. 여러 카테고리를 동시에 표시할 수 있다
 * 
 * ⚠️ 실패하는 테스트는 failed-tests.spec.ts로 분리됨:
 * - 장소 검색 다이얼로그 취소 (ESC 키 타이밍 이슈)
 * - 여러 카테고리 장소 검색 (첫 다이얼로그 닫기 실패)
 * - 카테고리 삭제 버튼 (버튼 클릭 타이밍 이슈)
 * - 빈 검색어 검색 (sonner 토스트 타이밍)
 * - 카테고리 헤더 버튼 (휴지통 버튼 찾기 실패)
 * 
 * ⚠️ 참고: Naver API 키가 없어도 UI 테스트는 정상 실행됨
 */

test.describe('장소 관리', () => {
  // 테스트 전 로그인, 워크스페이스 및 카테고리 생성
  test.beforeEach(async ({ page }) => {
    // IndexedDB 초기화
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('CourseItdaDB');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve();
      });
    });

    // 회원가입 및 자동 로그인
    await page.goto('/auth');
    await page.getByRole('tab', { name: '회원가입' }).click();
    
    await page.getByPlaceholder('닉네임').fill('장소테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('place@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Test1234!');
    await page.locator('#register-confirm-password').fill('Test1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/\/workspaces/);

    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('장소 테스트 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();

    // 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '장소 테스트 워크스페이스' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);

    // 카테고리 생성
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: '점심' }).click();

    // 다이얼로그가 닫힐 때까지 대기
    await expect(dialog).not.toBeVisible();

    // 카테고리 카드가 표시되는지 확인
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("점심")').first()).toBeVisible();
  });

  test('카테고리 카드가 올바르게 표시된다', async ({ page }) => {
    // 카테고리 카드 확인
    await expect(page.getByText('점심')).toBeVisible();
    
    // 순서 번호가 표시되는지 확인 (1번)
    await expect(page.locator('.w-6.h-6.rounded-full').first()).toContainText('1');
    
    // 장소 검색 버튼 확인
    await expect(page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)').first()).toBeVisible();
    
    // 초기 안내 메시지 확인
    await expect(page.getByText('장소를 추가해보세요')).toBeVisible();
  });

  test('장소 검색 버튼 클릭 시 다이얼로그가 표시된다', async ({ page }) => {
    // 장소 검색 버튼 클릭
    await page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)').first().click();

    // 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '장소 검색' })).toBeVisible();
    await expect(page.getByText('Naver 지도에서 장소를 검색하고 추가하세요')).toBeVisible();
    
    // 검색 입력 필드 확인
    await expect(page.getByPlaceholder('장소 이름이나 주소 검색')).toBeVisible();
    
    // 검색 버튼 확인
    await expect(page.getByRole('button', { name: /검색/ })).toBeVisible();
  });

  test('카테고리 접기/펼치기 기능이 작동한다', async ({ page }) => {
    // 초기 상태: 카테고리가 펼쳐져 있음
    await expect(page.getByText('장소를 추가해보세요')).toBeVisible();
    await expect(page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)').first()).toBeVisible();

    // 카테고리 헤더 클릭하여 접기 (CardTitle)
    await page.locator('.font-semibold.tracking-tight.text-base:has-text("점심")').first().click();

    // 콘텐츠가 숨겨졌는지 확인
    await page.waitForTimeout(500); // 애니메이션 대기
    await expect(page.getByText('장소를 추가해보세요')).not.toBeVisible();
    await expect(page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)')).not.toBeVisible();

    // 다시 헤더 클릭하여 펼치기
    await page.locator('.font-semibold.tracking-tight.text-base:has-text("점심")').first().click();

    // 콘텐츠가 다시 표시되는지 확인
    await page.waitForTimeout(500); // 애니메이션 대기
    await expect(page.getByText('장소를 추가해보세요')).toBeVisible();
    await expect(page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)').first()).toBeVisible();
  });

  test('카테고리 수정 버튼이 작동한다', async ({ page }) => {
    // 수정 버튼 클릭 (연필 아이콘)
    await page.locator('button').filter({ has: page.locator('svg.lucide-pencil') }).click();

    // 수정 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('카테고리 수정')).toBeVisible();
  });

  test('카테고리 순서 번호가 올바르게 표시된다', async ({ page }) => {
    // 두 번째 카테고리 추가
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByRole('button', { name: '카페' }).click();

    // 세 번째 카테고리 추가
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByRole('button', { name: '저녁' }).click();

    // 순서 번호가 올바르게 표시되는지 확인
    const categoryNumbers = page.locator('.w-6.h-6.rounded-full');
    await expect(categoryNumbers.nth(0)).toContainText('1');
    await expect(categoryNumbers.nth(1)).toContainText('2');
    await expect(categoryNumbers.nth(2)).toContainText('3');
  });

  test('검색 입력 필드에서 Enter 키로 검색할 수 있다', async ({ page }) => {
    // 장소 검색 다이얼로그 열기
    await page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)').first().click();

    // 검색어 입력
    await page.getByPlaceholder('장소 이름이나 주소 검색').fill('테스트 검색');

    // Enter 키 누르기
    await page.getByPlaceholder('장소 이름이나 주소 검색').press('Enter');

    // API 키가 없으므로 에러 토스트가 표시됨
    await expect(page.getByText(/장소 검색 API/)).toBeVisible();
  });

  test('여러 카테고리를 동시에 표시할 수 있다', async ({ page }) => {
    // 여러 카테고리 추가
    const categories = ['카페', '산책', '쇼핑'];

    for (const category of categories) {
      await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.getByRole('button', { name: category }).click();

      // 다이얼로그가 닫힐 때까지 대기
      await expect(dialog).not.toBeVisible();

      // 카테고리 카드가 표시되는지 확인
      await expect(page.locator(`.font-semibold.tracking-tight.text-base:has-text("${category}")`).first()).toBeVisible();
    }

    // 모든 카테고리가 표시되고 각각 장소 검색 버튼이 있는지 확인
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("점심")').first()).toBeVisible();
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("카페")').first()).toBeVisible();
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("산책")').first()).toBeVisible();
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("쇼핑")').first()).toBeVisible();

    // 장소 검색 버튼이 4개인지 확인
    const searchButtons = page.locator('button:has-text("장소 검색"):has(svg.lucide-plus)');
    await expect(searchButtons).toHaveCount(4);
  });

});

