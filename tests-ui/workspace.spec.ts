import { test, expect } from '@playwright/test';

/**
 * 📁 워크스페이스 관리 UI 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - 워크스페이스 목록 페이지 UI 표시
 * - 버튼 클릭 → 생성 다이얼로그 표시
 * - 폼 입력 → 생성 → 목록에 표시
 * - 워크스페이스 클릭 → 상세 페이지 이동
 * - 컨텍스트 메뉴 (우클릭) 표시
 * - 수정 다이얼로그 표시 및 제목 변경
 * - 삭제 확인 다이얼로그 표시
 * - 취소 버튼 동작
 * - 빈 상태 메시지 표시
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - DB에 워크스페이스 데이터 저장 확인
 * - 제목 중복 검증 로직
 * - 사용자 권한 검증
 * - 워크스페이스 소유자 확인
 * - cascade delete 로직
 * 
 * 📝 총 9개 테스트:
 * 1. 워크스페이스 목록 페이지가 올바르게 표시된다
 * 2. 새 워크스페이스 생성 버튼 클릭 시 다이얼로그가 표시된다
 * 3. 워크스페이스 생성 시 폼 입력 후 제출하면 목록에 표시된다
 * 4. 여러 워크스페이스를 생성할 수 있다
 * 5. 워크스페이스 클릭 시 상세 페이지로 이동한다
 * 6. 워크스페이스 수정이 정상적으로 작동한다
 * 7. 워크스페이스 삭제가 정상적으로 작동한다
 * 8. 워크스페이스 생성 시 취소 버튼이 작동한다
 * 9. 워크스페이스 삭제 시 취소 버튼이 작동한다
 */

test.describe('워크스페이스 관리', () => {
  // 테스트 전 로그인 처리
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
    
    await page.getByPlaceholder('닉네임').fill('워크스페이스테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('workspace@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Test1234!');
    await page.locator('#register-confirm-password').fill('Test1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    
    await expect(page).toHaveURL(/\/workspaces/);
  });

  test('워크스페이스 목록 페이지가 올바르게 표시된다', async ({ page }) => {
    // 워크스페이스 페이지의 주요 요소 확인
    await expect(page.getByRole('heading', { name: '워크스페이스' })).toBeVisible();
    await expect(page.getByRole('button', { name: /새 워크스페이스/ })).toBeVisible();
    
    // 초기 상태에는 워크스페이스가 없음 (페이지가 완전히 로드될 때까지 대기)
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '첫 워크스페이스 만들기' }).first()).toBeVisible();
  });

  test('새 워크스페이스 생성 버튼 클릭 시 다이얼로그가 표시된다', async ({ page }) => {
    // 새 워크스페이스 버튼 클릭
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();

    // 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '새 워크스페이스' })).toBeVisible();
    await expect(page.getByLabel('제목')).toBeVisible();
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: '생성' })).toBeVisible();
  });

  test('워크스페이스 생성 시 폼 입력 후 제출하면 목록에 표시된다', async ({ page }) => {
    // 새 워크스페이스 버튼 클릭
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();

    // 제목 입력
    await page.getByLabel('제목').fill('서울 여행 코스');

    // 생성 버튼 클릭
    await page.getByRole('button', { name: '생성' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 생성된 워크스페이스가 목록에 표시되는지 확인
    await expect(page.getByRole('heading', { name: '서울 여행 코스' }).first()).toBeVisible();
    
    // "아직 워크스페이스가 없습니다" 메시지가 사라졌는지 확인
    await expect(page.getByText('아직 워크스페이스가 없습니다').first()).not.toBeVisible();
  });

  test('여러 워크스페이스를 생성할 수 있다', async ({ page }) => {
    // 첫 번째 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('홍대 데이트');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '홍대 데이트' }).first()).toBeVisible();

    // 두 번째 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('강남 맛집 투어');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '강남 맛집 투어' }).first()).toBeVisible();

    // 세 번째 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('북촌 한옥마을');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '북촌 한옥마을' }).first()).toBeVisible();

    // 모든 워크스페이스가 목록에 표시되는지 확인
    await expect(page.getByRole('heading', { name: '홍대 데이트' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '강남 맛집 투어' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '북촌 한옥마을' }).first()).toBeVisible();
  });

  test('워크스페이스 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('테스트 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();

    // 생성된 워크스페이스 클릭 (Card 내부의 제목)
    await page.getByRole('heading', { name: '테스트 워크스페이스' }).first().click();

    // 상세 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/\/workspace\//);
    
    // 상세 페이지의 주요 요소 확인 (헤더에 워크스페이스 제목이 표시됨)
    await expect(page.getByRole('heading', { name: '테스트 워크스페이스' })).toBeVisible();
  });

  test('워크스페이스 수정이 정상적으로 작동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('수정 전 제목');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '수정 전 제목' }).first()).toBeVisible();

    // 컨텍스트 메뉴 열기 (우클릭)
    await page.getByRole('heading', { name: '수정 전 제목' }).first().click({ button: 'right' });

    // "이름 바꾸기" 메뉴 클릭
    await page.getByRole('menuitem', { name: /이름 바꾸기/ }).click();

    // 수정 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('워크스페이스 이름 바꾸기')).toBeVisible();

    // 제목 수정
    const titleInput = page.getByLabel('제목');
    await titleInput.clear();
    await titleInput.fill('수정 후 제목');

    // 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 수정된 제목이 표시되는지 확인
    await expect(page.getByRole('heading', { name: '수정 후 제목' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '수정 전 제목' })).not.toBeVisible();
  });

  test('워크스페이스 삭제가 정상적으로 작동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('삭제할 워크스페이스');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '삭제할 워크스페이스' }).first()).toBeVisible();

    // 컨텍스트 메뉴 열기 (Card를 우클릭 - ContextMenuTrigger)
    const workspaceCard = page.locator('.hover-lift').filter({ has: page.getByRole('heading', { name: '삭제할 워크스페이스' }) }).first();
    
    // 카드가 보일 때까지 대기
    await expect(workspaceCard).toBeVisible();
    await page.waitForTimeout(500);
    
    // 우클릭
    await workspaceCard.click({ button: 'right', force: true });
    await page.waitForTimeout(500); // 컨텍스트 메뉴 표시 대기

    // "삭제" 메뉴가 보이는지 확인하고 클릭
    const deleteMenuItem = page.getByRole('menuitem', { name: '삭제' });
    await expect(deleteMenuItem).toBeVisible({ timeout: 3000 });
    await deleteMenuItem.click();

    // 삭제 확인 다이얼로그가 표시되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('워크스페이스 삭제')).toBeVisible();
    await expect(page.getByText(/삭제할 워크스페이스.*정말 삭제하시겠습니까/)).toBeVisible();

    // 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 삭제된 워크스페이스가 목록에서 사라졌는지 확인
    await expect(page.getByText('삭제할 워크스페이스')).not.toBeVisible();
    
    // 빈 목록 메시지가 다시 표시되는지 확인
    await expect(page.getByText('아직 워크스페이스가 없습니다').first()).toBeVisible();
  });

  test('워크스페이스 생성 시 취소 버튼이 작동한다', async ({ page }) => {
    // 새 워크스페이스 버튼 클릭
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();

    // 제목 입력
    await page.getByLabel('제목').fill('취소할 워크스페이스');

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 워크스페이스가 생성되지 않았는지 확인
    await expect(page.getByText('취소할 워크스페이스')).not.toBeVisible();
    
    // 워크스페이스 목록에 없는지 확인
    await expect(page.getByRole('heading', { name: '취소할 워크스페이스' })).not.toBeVisible();
  });

  test('워크스페이스 삭제 시 취소 버튼이 작동한다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('취소 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page.getByRole('heading', { name: '취소 테스트' }).first()).toBeVisible();

    // 컨텍스트 메뉴로 삭제 시도
    await page.getByRole('heading', { name: '취소 테스트' }).first().click({ button: 'right' });
    await page.getByRole('menuitem', { name: '삭제' }).click();

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 워크스페이스가 여전히 존재하는지 확인
    await expect(page.getByRole('heading', { name: '취소 테스트' }).first()).toBeVisible();
  });
});

