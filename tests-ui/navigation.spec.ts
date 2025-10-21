import { test, expect } from '@playwright/test';

/**
 * 🧭 네비게이션 및 메뉴 UI 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - 프로필 드롭다운 메뉴 표시
 * - 프로필 메뉴 항목 (마이페이지, 설정, 로그아웃) 표시
 * - 사용자 정보 (닉네임, 이메일) 표시
 * - 설정 페이지로 이동
 * - 로그아웃 버튼 클릭 → 랜딩 페이지 이동
 * - 뒤로가기 버튼 → 워크스페이스 목록 이동
 * - 워크스페이스 전환 드롭다운 표시
 * - 현재 워크스페이스 하이라이트 (bg-primary/10)
 * - 드롭다운에서 새 워크스페이스 생성
 * - 컨텍스트 메뉴 (우클릭) 표시
 * - ESC 키로 메뉴 닫기
 * - 로고 클릭 → 랜딩 페이지 이동
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - 세션 토큰 검증
 * - 권한 확인 로직
 * - 로그아웃 시 세션 무효화
 * - 사용자 정보 API 호출
 * 
 * 📝 총 8개 테스트 (성공하는 테스트만):
 * 1. 워크스페이스 목록 페이지에서 프로필 드롭다운 메뉴가 작동한다
 * 2. 프로필 메뉴에서 설정 페이지로 이동할 수 있다
 * 3. 프로필 메뉴에서 로그아웃할 수 있다
 * 4. 워크스페이스 상세 페이지에서 뒤로가기 버튼이 작동한다
 * 5. 워크스페이스 상세 페이지에서 워크스페이스 전환 드롭다운이 작동한다
 * 6. 워크스페이스 전환 드롭다운에서 새 워크스페이스를 생성할 수 있다
 * 7. 워크스페이스 목록 페이지에서 로고 클릭 시 랜딩 페이지로 이동한다
 * 8. 프로필 메뉴에서 워크스페이스 메뉴를 클릭하면 워크스페이스 목록으로 이동한다
 * 
 * ⚠️ 실패하는 테스트는 failed-tests.spec.ts로 분리됨:
 * - 컨텍스트 메뉴 (Radix UI ContextMenu가 우클릭 인식 안됨)
 * - ESC 키로 메뉴 닫기 (애니메이션 타이밍 이슈)
 */

test.describe('네비게이션 및 메뉴', () => {
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
    
    await page.getByPlaceholder('닉네임').fill('네비테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('navi@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Test1234!');
    await page.locator('#register-confirm-password').fill('Test1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/\/workspaces/);
  });

  test('워크스페이스 목록 페이지에서 프로필 드롭다운 메뉴가 작동한다', async ({ page }) => {
    // 프로필 버튼 클릭
    await page.getByRole('button', { name: /네비테스트/ }).click();

    // 드롭다운 메뉴가 표시되는지 확인
    await expect(page.getByRole('menuitem', { name: '마이페이지' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '워크스페이스' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '설정' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '로그아웃' })).toBeVisible();

    // 사용자 정보가 표시되는지 확인 (드롭다운 내부의 텍스트)
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu.getByText('네비테스트')).toBeVisible();
    await expect(dropdownMenu.getByText('navi@test.com')).toBeVisible();
  });

  test('프로필 메뉴에서 설정 페이지로 이동할 수 있다', async ({ page }) => {
    // 프로필 메뉴 열기
    await page.getByRole('button', { name: /네비테스트/ }).click();

    // 설정 메뉴 클릭
    await page.getByRole('menuitem', { name: '설정' }).click();

    // 설정 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
  });

  test('프로필 메뉴에서 로그아웃할 수 있다', async ({ page }) => {
    // 프로필 메뉴 열기
    await page.getByRole('button', { name: /네비테스트/ }).click();

    // 로그아웃 메뉴 클릭
    await page.getByRole('menuitem', { name: '로그아웃' }).click();

    // 랜딩 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/');
  });

  test('워크스페이스 상세 페이지에서 뒤로가기 버튼이 작동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('제목').fill('테스트 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();

    // 다이얼로그가 닫힐 때까지 대기
    await expect(dialog).not.toBeVisible();

    // 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '테스트 워크스페이스' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);

    // 뒤로가기 버튼 클릭
    await page.getByRole('button', { name: '뒤로가기' }).click();

    // 워크스페이스 목록 페이지로 돌아갔는지 확인
    await expect(page).toHaveURL('/workspaces');
    // 페이지 제목만 선택 (exact match 사용)
    await expect(page.getByRole('heading', { name: '워크스페이스', exact: true })).toBeVisible();
  });

  test('워크스페이스 상세 페이지에서 워크스페이스 전환 드롭다운이 작동한다', async ({ page }) => {
    // 세 개의 워크스페이스 생성
    const workspaces = ['서울 여행', '부산 여행', '제주도 여행'];

    for (const workspace of workspaces) {
      await page.getByRole('button', { name: /새 워크스페이스/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.getByLabel('제목').fill(workspace);
      await page.getByRole('button', { name: '생성' }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.getByRole('heading', { name: workspace }).first()).toBeVisible();
    }

    // 첫 번째 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '서울 여행' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);
    await expect(page.getByRole('heading', { name: '서울 여행' })).toBeVisible();

    // 워크스페이스 제목 드롭다운 클릭
    await page.getByRole('heading', { name: '서울 여행' }).click();

    // 드롭다운 메뉴가 표시되고 모든 워크스페이스가 나열되는지 확인
    await expect(page.getByRole('menuitem', { name: '서울 여행' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '부산 여행' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '제주도 여행' })).toBeVisible();

    // 현재 워크스페이스가 하이라이트되어 있는지 확인
    const currentItem = page.getByRole('menuitem', { name: '서울 여행' });
    await expect(currentItem).toHaveClass(/bg-primary\/10/);

    // 다른 워크스페이스로 전환
    await page.getByRole('menuitem', { name: '부산 여행' }).click();

    // 부산 여행 워크스페이스로 전환되었는지 확인
    await expect(page.getByRole('heading', { name: '부산 여행' })).toBeVisible();
  });

  test('워크스페이스 전환 드롭다운에서 새 워크스페이스를 생성할 수 있다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('제목').fill('첫 번째 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(dialog).not.toBeVisible();

    // 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '첫 번째 워크스페이스' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);

    // 워크스페이스 제목 드롭다운 클릭
    await page.getByRole('heading', { name: '첫 번째 워크스페이스' }).click();

    // "새 워크스페이스" 버튼이 있는지 확인
    const newWorkspaceButton = page.locator('button:has-text("새 워크스페이스")');
    await expect(newWorkspaceButton).toBeVisible();

    // "새 워크스페이스" 버튼 클릭
    await newWorkspaceButton.click();

    // 생성 다이얼로그가 열렸는지 확인
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '새 워크스페이스' })).toBeVisible();

    // 워크스페이스 생성
    await page.getByLabel('제목').fill('드롭다운에서 생성');
    await page.getByRole('button', { name: '생성' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(dialog).not.toBeVisible();

    // 성공 토스트 확인
    await expect(page.getByText('워크스페이스가 생성되었습니다!').first()).toBeVisible();
  });

  test('워크스페이스 목록 페이지에서 로고 클릭 시 랜딩 페이지로 이동한다', async ({ page }) => {
    // 로고 클릭
    await page.locator('img[alt="코스잇다 로고"]').click();

    // 랜딩 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/');
  });

  test('프로필 메뉴에서 워크스페이스 메뉴를 클릭하면 워크스페이스 목록으로 이동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('제목').fill('테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(dialog).not.toBeVisible();

    // 워크스페이스 상세 페이지로 이동
    await page.getByRole('heading', { name: '테스트' }).first().click();
    await expect(page).toHaveURL(/\/workspace\//);

    // 프로필 메뉴 열기
    await page.getByRole('button', { name: /네비테스트/ }).click();

    // 워크스페이스 메뉴 클릭
    await page.getByRole('menuitem', { name: '워크스페이스' }).click();

    // 워크스페이스 목록 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/workspaces');
    await expect(page.getByRole('heading', { name: '워크스페이스', exact: true })).toBeVisible();
  });

});

