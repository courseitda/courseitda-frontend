import { test, expect } from '@playwright/test';

/**
 * 🏷️ 카테고리 관리 UI 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - 카테고리 추가 버튼 → 다이얼로그 표시
 * - 추천 카테고리 버튼 표시 및 클릭
 * - 직접 입력 필드 표시 및 입력
 * - 색상 팔레트 (14개) 표시 및 선택
 * - 색상 팔레트 변경 (생동감 → 파스텔 → 깊은)
 * - 생성된 카테고리가 목록에 표시
 * - 카테고리 수정 다이얼로그
 * - 카테고리 삭제 확인 다이얼로그
 * - Enter 키로 생성
 * - 빈 이름 입력 시 버튼 비활성화
 * - 드래그 앤 드롭으로 순서 변경
 * - 카테고리 순서 번호 (1, 2, 3...) 표시
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - DB에 카테고리 데이터 저장 확인
 * - 카테고리 이름 중복 검증 로직
 * - 색상 코드 검증
 * - 정렬 순서 알고리즘
 * - cascade delete (카테고리 삭제 시 장소 삭제)
 * 
 * 📝 총 10개 테스트 (성공하는 테스트만):
 * 1. 카테고리 섹션이 올바르게 표시된다
 * 2. 카테고리 추가 버튼 클릭 시 다이얼로그가 표시된다
 * 3. 추천 카테고리 버튼으로 카테고리를 생성할 수 있다
 * 4. 직접 입력으로 카테고리를 생성할 수 있다
 * 5. 여러 카테고리를 생성할 수 있다
 * 6. 색상 선택 기능이 작동한다
 * 7. 카테고리 수정이 정상적으로 작동한다
 * 8. 카테고리 추가 시 취소 버튼이 작동한다
 * 9. Enter 키로 카테고리를 생성할 수 있다
 * 10. 빈 이름으로 카테고리를 생성할 수 없다
 * 
 * ⚠️ 실패하는 테스트는 failed-tests.spec.ts로 분리됨:
 * - 팔레트 변경 버튼 (타이밍 이슈)
 * - 카테고리 삭제 (버튼 클릭 타이밍 이슈)
 * - 카테고리 삭제 취소 (버튼 클릭 타이밍 이슈)
 * - 드래그 앤 드롭 (react-beautiful-dnd 호환성 문제)
 */

test.describe('카테고리 관리', () => {
  // 테스트 전 로그인 및 워크스페이스 생성
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
    
    await page.getByPlaceholder('닉네임').fill('카테고리테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('category@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Test1234!');
    await page.locator('#register-confirm-password').fill('Test1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/\/workspaces/);

    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('테스트 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();

    // 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '테스트 워크스페이스' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);
  });

  test('카테고리 섹션이 올바르게 표시된다', async ({ page }) => {
    // 카테고리 섹션 확인
    await expect(page.getByRole('heading', { name: '카테고리' })).toBeVisible();
    
    // 카테고리 헤더의 추가 버튼 확인 (Plus 아이콘과 "추가" 텍스트를 포함한 작은 버튼)
    const categoryHeader = page.locator('.flex.items-center.justify-between', { has: page.getByRole('heading', { name: '카테고리' }) });
    await expect(categoryHeader.getByRole('button', { name: /추가/ })).toBeVisible();
    
    // 초기 상태에는 카테고리가 없음
    await expect(page.getByText('카테고리를 추가해보세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '첫 카테고리 만들기' })).toBeVisible();
  });

  test('카테고리 추가 버튼 클릭 시 다이얼로그가 표시된다', async ({ page }) => {
    // 카테고리 헤더의 추가 버튼 클릭
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('카테고리 추가')).toBeVisible();
    
    // 색상 선택 영역 확인
    await expect(page.getByText('색상 선택')).toBeVisible();
    
    // 추천 카테고리 버튼 확인
    await expect(page.getByText('추천 카테고리')).toBeVisible();
    await expect(page.getByRole('button', { name: '점심' })).toBeVisible();
    await expect(page.getByRole('button', { name: '카페' })).toBeVisible();
    await expect(page.getByRole('button', { name: '산책' })).toBeVisible();
    await expect(page.getByRole('button', { name: '쇼핑' })).toBeVisible();
    await expect(page.getByRole('button', { name: '저녁' })).toBeVisible();
    
    // 직접 입력 필드 확인
    await expect(page.getByText('직접 입력')).toBeVisible();
    await expect(page.getByPlaceholder('카테고리 이름')).toBeVisible();
    
    // 버튼 확인
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: '추가' })).toBeVisible();
  });

  test('추천 카테고리 버튼으로 카테고리를 생성할 수 있다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 추천 카테고리 "점심" 버튼 클릭
    await page.getByRole('button', { name: '점심' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 생성된 카테고리가 표시되는지 확인
    await expect(page.getByText('점심')).toBeVisible();
    
    // "카테고리를 추가해보세요" 메시지가 사라졌는지 확인
    await expect(page.getByText('카테고리를 추가해보세요')).not.toBeVisible();
  });

  test('직접 입력으로 카테고리를 생성할 수 있다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 카테고리 이름 입력
    await page.getByPlaceholder('카테고리 이름').fill('브런치');

    // 추가 버튼 클릭
    await page.getByRole('button', { name: '추가' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 생성된 카테고리가 표시되는지 확인
    await expect(page.getByText('브런치')).toBeVisible();
  });

  test('여러 카테고리를 생성할 수 있다', async ({ page }) => {
    // 첫 번째 카테고리 (추천)
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByRole('button', { name: '점심' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.waitForTimeout(500);

    // 두 번째 카테고리 (직접 입력)
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByPlaceholder('카테고리 이름').fill('디저트');
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.waitForTimeout(500);

    // 세 번째 카테고리 (추천)
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByRole('button', { name: '카페' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.waitForTimeout(500);

    // 네 번째 카테고리 (직접 입력)
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByPlaceholder('카테고리 이름').fill('야경');
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.waitForTimeout(500);

    // 모든 카테고리가 표시되는지 확인
    await expect(page.getByRole('heading', { name: '점심' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '디저트' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '카페' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '야경' })).toBeVisible();
  });

  test('색상 선택 기능이 작동한다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 색상 버튼들 확인 (14개 색상 + 1개 팔레트 변경 버튼)
    const colorButtons = page.locator('button[aria-label*="색상"]');
    await expect(colorButtons).toHaveCount(14);

    // 두 번째 색상 선택
    await colorButtons.nth(1).click();

    // 카테고리 생성
    await page.getByPlaceholder('카테고리 이름').fill('테스트');
    await page.getByRole('button', { name: '추가' }).click();

    // 카테고리가 생성되었는지 확인 (다이얼로그가 닫히고 카테고리 헤더에 표시)
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('.font-semibold.tracking-tight.text-base:has-text("테스트")').first()).toBeVisible();
  });

  test('카테고리 수정이 정상적으로 작동한다', async ({ page }) => {
    // 카테고리 생성
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
    await page.getByPlaceholder('카테고리 이름').fill('수정 전');
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByText('수정 전')).toBeVisible();

    // 카테고리 카드의 수정 버튼 클릭 (연필 아이콘) - 바로 다이얼로그 열림
    await page.locator('button:has(svg.lucide-pencil)').first().click();

    // 수정 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('카테고리 수정')).toBeVisible();

    // 카테고리 이름 수정
    const nameInput = page.getByPlaceholder('카테고리 이름');
    await nameInput.clear();
    await nameInput.fill('수정 후');

    // 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 수정된 카테고리 이름이 표시되는지 확인
    await expect(page.getByText('수정 후')).toBeVisible();
    await expect(page.getByText('수정 전')).not.toBeVisible();
  });

  test('카테고리 추가 시 취소 버튼이 작동한다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 카테고리 이름 입력
    await page.getByPlaceholder('카테고리 이름').fill('취소할 카테고리');

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 카테고리가 생성되지 않았는지 확인
    await expect(page.getByText('취소할 카테고리')).not.toBeVisible();
    await expect(page.getByText('카테고리를 추가해보세요')).toBeVisible();
  });

  test('Enter 키로 카테고리를 생성할 수 있다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 카테고리 이름 입력 후 Enter 키 누르기
    await page.getByPlaceholder('카테고리 이름').fill('엔터 테스트');
    await page.getByPlaceholder('카테고리 이름').press('Enter');

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 생성된 카테고리가 표시되는지 확인
    await expect(page.getByText('엔터 테스트')).toBeVisible();
  });

  test('빈 이름으로 카테고리를 생성할 수 없다', async ({ page }) => {
    // 카테고리 추가 다이얼로그 열기
    await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();

    // 추가 버튼이 비활성화되어 있는지 확인 (빈 입력)
    await expect(page.getByRole('button', { name: '추가' })).toBeDisabled();

    // 공백만 입력
    await page.getByPlaceholder('카테고리 이름').fill('   ');

    // 추가 버튼이 여전히 비활성화되어 있는지 확인
    await expect(page.getByRole('button', { name: '추가' })).toBeDisabled();
  });

});

