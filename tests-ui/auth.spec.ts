import { test, expect } from '@playwright/test';

/**
 * 🔐 인증 페이지 UI 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - 로그인/회원가입 페이지 UI 요소 표시 확인
 * - 탭 전환 (로그인 ↔ 회원가입) 동작
 * - 폼 입력 필드 표시 및 입력 가능 여부
 * - 버튼 클릭 → 페이지 이동
 * - 중복 확인 메시지 표시
 * - 비밀번호 보기/숨기기 토글
 * - 비밀번호 요구사항 체크 표시
 * - 로그아웃 후 재로그인
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - 이메일 형식 유효성 검증 로직
 * - 비밀번호 암호화
 * - DB에 사용자 정보 저장 확인
 * - JWT 토큰 생성 로직
 * - 세션 관리 로직
 * 
 * 📝 총 5개 테스트:
 * 1. 로그인 페이지가 올바르게 표시된다
 * 2. 탭 전환이 정상적으로 작동한다
 * 3. 회원가입 후 자동 로그인되어 워크스페이스 페이지로 이동한다
 * 4. 로그인이 정상적으로 작동한다
 * 5. 비밀번호 보기/숨기기 토글이 작동한다
 */

test.describe('인증 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 IndexedDB 초기화 (깨끗한 상태로 시작)
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('CourseItdaDB');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve();
      });
    });
  });

  test('로그인 페이지가 올바르게 표시된다', async ({ page }) => {
    // 인증 페이지로 이동
    await page.goto('/auth');

    // 페이지 타이틀 확인
    await expect(page.getByText('코스잇다')).toBeVisible();
    await expect(page.getByText('당일 코스 플래닝을 시작해보세요')).toBeVisible();

    // 로그인/회원가입 탭 확인
    await expect(page.getByRole('tab', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '회원가입' })).toBeVisible();

    // 기본적으로 로그인 탭이 선택되어 있는지 확인
    await expect(page.getByPlaceholder('이메일')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('탭 전환이 정상적으로 작동한다', async ({ page }) => {
    await page.goto('/auth');

    // 회원가입 탭 클릭
    await page.getByRole('tab', { name: '회원가입' }).click();

    // 회원가입 폼이 표시되는지 확인
    await expect(page.getByPlaceholder('닉네임')).toBeVisible();
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-confirm-password')).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();

    // 다시 로그인 탭으로 전환
    await page.getByRole('tab', { name: '로그인' }).click();

    // 로그인 폼이 표시되는지 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('회원가입 후 자동 로그인되어 워크스페이스 페이지로 이동한다', async ({ page }) => {
    await page.goto('/auth');

    // 회원가입 탭으로 이동
    await page.getByRole('tab', { name: '회원가입' }).click();

    // 닉네임 입력 및 중복 확인
    await page.getByPlaceholder('닉네임').fill('테스트유저');
    await page.getByRole('button', { name: '확인' }).first().click();
    
    // 중복 확인 완료 메시지 확인
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();

    // 이메일 입력 및 중복 확인
    await page.getByPlaceholder('이메일').fill('newuser@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    
    // 중복 확인 완료 메시지 확인
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();

    // 비밀번호 입력 (보안 요구사항을 만족하는 비밀번호)
    await page.locator('#register-password').fill('Test1234!');
    
    // 비밀번호 요구사항이 모두 충족되었는지 확인 (체크 아이콘 표시)
    await expect(page.locator('#register-password + button + svg').first()).toBeVisible();

    // 비밀번호 확인 입력
    await page.locator('#register-confirm-password').fill('Test1234!');

    // 회원가입 버튼 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // 워크스페이스 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/\/workspaces/);
    
    // 워크스페이스 페이지의 주요 요소 확인
    await expect(page.getByRole('heading', { name: '워크스페이스' })).toBeVisible();
    await expect(page.getByRole('button', { name: /새 워크스페이스/ })).toBeVisible();
  });

  test('로그인이 정상적으로 작동한다', async ({ page }) => {
    // 먼저 회원가입 진행
    await page.goto('/auth');
    await page.getByRole('tab', { name: '회원가입' }).click();
    
    await page.getByPlaceholder('닉네임').fill('로그인테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('logintest@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Login1234!');
    await page.locator('#register-confirm-password').fill('Login1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    
    // 워크스페이스 페이지로 이동 확인
    await expect(page).toHaveURL(/\/workspaces/);

    // 로그아웃
    await page.getByRole('button', { name: /로그인테스트/ }).click();
    await page.getByRole('menuitem', { name: '로그아웃' }).click();

    // 다시 로그인 페이지로 이동
    await expect(page).toHaveURL('/');

    // 로그인 페이지로 이동
    await page.goto('/auth');

    // 로그인 폼에 정보 입력
    await page.getByPlaceholder('이메일').fill('logintest@test.com');
    await page.locator('#password').fill('Login1234!');

    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click();

    // 워크스페이스 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/\/workspaces/);
    await expect(page.getByText('로그인테스트')).toBeVisible();
  });

  test('비밀번호 보기/숨기기 토글이 작동한다', async ({ page }) => {
    await page.goto('/auth');

    // 비밀번호 입력
    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpassword');

    // 초기 상태는 password 타입
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 비밀번호 보기 버튼 클릭
    await page.locator('button:has(svg.lucide-eye)').first().click();

    // text 타입으로 변경되었는지 확인
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // 다시 숨기기 버튼 클릭
    await page.locator('button:has(svg.lucide-eye-off)').first().click();

    // password 타입으로 변경되었는지 확인
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

