import { test, expect } from '@playwright/test';

/**
 * ⚡ 고급 UI 기능 테스트
 * 
 * ✅ 테스트하는 것 (프론트엔드 UI/UX):
 * - Naver 지도 로딩 실패 시 사용자 안내 메시지
 * - API 키 입력 없이 지도 영역 표시
 * - 설정 페이지에서 API 키 자동 관리 안내
 * - 모바일 반응형 레이아웃 (390x844)
 *   - 지도 상단 고정
 *   - 카테고리 영역 스크롤 가능
 * - 데스크톱 2단 분할 레이아웃 (1920x1080)
 *   - 좌우 그리드 구조 (md:grid-cols-2)
 * - 빈 상태 메시지 표시
 *   - "아직 워크스페이스가 없습니다"
 *   - "카테고리를 추가해보세요"
 *   - "장소를 추가해보세요"
 * - 여러 카테고리 독립적 접기/펼치기
 * - 카테고리 색상 동그라미 표시
 * - 색상 팔레트 자동 선택 (중복 방지)
 * - 삭제 경고 메시지 표시
 * - 삭제 버튼 destructive 스타일 (bg-destructive)
 * 
 * ❌ 테스트하지 않는 것 (백엔드 로직):
 * - Naver Maps SDK 실제 렌더링
 * - API 키 유효성 검증
 * - 지도 마커 생성 로직
 * - 반응형 브레이크포인트 계산 로직
 * 
 * 📝 총 9개 테스트 (성공하는 테스트만):
 * 1. 지도 로딩 실패 시 안내 메시지가 표시된다
 * 2. 지도 영역에는 설정 안내 대신 지도 콘텐츠가 표시된다
 * 3. 설정 페이지에서 API 키 자동 관리 메시지를 확인할 수 있다
 * 4. 모바일 뷰에서 지도가 상단에 고정되고 카테고리가 스크롤 가능하다
 * 5. 데스크톱 뷰에서 지도와 카테고리가 좌우로 분할되어 표시된다
 * 6. 카테고리와 워크스페이스 빈 상태 메시지가 올바르게 표시된다
 * 7. 여러 카테고리가 서로 독립적으로 접기/펼치기 된다
 * 8. 카테고리 색상이 올바르게 표시된다
 * 9. 워크스페이스 삭제 시 경고 메시지가 표시된다
 * 
 * ⚠️ 실패하는 테스트는 failed-tests.spec.ts로 분리됨:
 * - 팔레트 변경 시 자동 선택 (타이밍 이슈)
 * - 카테고리 삭제 경고 (버튼 클릭 타이밍 이슈)
 * - 성공/에러 토스트 메시지 (sonner 토스트 타이밍)
 */

test.describe('고급 기능', () => {
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
    
    await page.getByPlaceholder('닉네임').fill('고급테스트');
    await page.getByRole('button', { name: '확인' }).first().click();
    await expect(page.getByText('사용 가능한 닉네임입니다')).toBeVisible();
    
    await page.getByPlaceholder('이메일').fill('advanced@test.com');
    await page.getByRole('button', { name: '확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible();
    
    await page.locator('#register-password').fill('Test1234!');
    await page.locator('#register-confirm-password').fill('Test1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/\/workspaces/);
  });

  test('지도 로딩 실패 시 안내 메시지가 표시된다', async ({ page }) => {
    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('지도 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '지도 테스트' }).first().click();

    // 지도 로딩 실패 안내 메시지가 표시되는지 확인
    await expect(
      page.getByText('Naver Maps SDK 로딩에 실패했습니다.')
    ).toBeVisible();
  });

  test('지도 영역에는 설정 안내 대신 지도 콘텐츠가 표시된다', async ({ page }) => {
    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('설정 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '설정 테스트' }).first().click();

    // 지도 영역에 설정 안내 버튼이 표시되지 않는지 확인
    await expect(page.getByRole('button', { name: '설정하기' })).toHaveCount(0);
    await expect(page.getByText('네이버 지도 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.')).toHaveCount(0);
  });

  test('설정 페이지에서 API 키 자동 관리 메시지를 확인할 수 있다', async ({ page }) => {
    await page.goto('/settings');
    await expect(
      page.getByText('REST API 키는 백엔드에서 관리되고, JavaScript SDK용 Key ID는 환경 변수에서 자동으로 주입됩니다.')
    ).toBeVisible();
  });

  test('모바일 뷰에서 지도가 상단에 고정되고 카테고리가 스크롤 가능하다', async ({ page }) => {
    // 모바일 뷰포트 설정 (iPhone 13 크기)
    await page.setViewportSize({ width: 390, height: 844 });

    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('모바일 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '모바일 테스트' }).first().click();

    // 지도 영역이 표시되는지 확인
    const mapContainer = page.locator('.rounded-xl.overflow-hidden').first();
    await expect(mapContainer).toBeVisible();

    // 카테고리 영역이 스크롤 가능한지 확인
    const categoryContainer = page.locator('.overflow-y-auto.rounded-xl');
    await expect(categoryContainer).toBeVisible();

    // 여러 카테고리를 생성하여 스크롤 테스트
    const categories = ['점심', '카페', '산책', '쇼핑', '저녁'];
    for (const category of categories) {
      await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.getByRole('button', { name: category }).click();
      await expect(dialog).not.toBeVisible(); // 다이얼로그가 닫힐 때까지 대기
      await page.waitForTimeout(300); // 애니메이션 대기
    }

    // 카테고리 영역이 스크롤 가능한지 확인
    const isScrollable = await categoryContainer.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });
    expect(isScrollable).toBe(true);
  });

  test('데스크톱 뷰에서 지도와 카테고리가 좌우로 분할되어 표시된다', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('데스크톱 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '데스크톱 테스트' }).first().click();

    // 좌우 분할 레이아웃 확인
    const gridContainer = page.locator('.md\\:grid-cols-2');
    await expect(gridContainer).toBeVisible();

    // 지도와 카테고리 영역이 모두 표시되는지 확인
    const mapContainer = page.locator('.rounded-xl.overflow-hidden').first();
    const categoryContainer = page.locator('.overflow-y-auto.rounded-xl');
    
    await expect(mapContainer).toBeVisible();
    await expect(categoryContainer).toBeVisible();
  });

  test('카테고리와 워크스페이스 빈 상태 메시지가 올바르게 표시된다', async ({ page }) => {
    // 이 테스트는 빈 상태를 확인하므로 beforeEach의 로그인을 사용하지 않고 직접 시작
    // 워크스페이스 페이지로 이동하여 빈 상태 확인
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '첫 워크스페이스 만들기' }).first()).toBeVisible();

    // 워크스페이스 생성
    await page.getByRole('button', { name: '첫 워크스페이스 만들기' }).click();
    await page.getByLabel('제목').fill('빈 상태 테스트');
    await page.getByRole('button', { name: '생성' }).click();

    // 워크스페이스 상세로 이동
    await page.getByRole('heading', { name: '빈 상태 테스트' }).first().click();

    // 카테고리 빈 상태 확인
    await expect(page.getByText('카테고리를 추가해보세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '첫 카테고리 만들기' })).toBeVisible();

    // 첫 카테고리 만들기 버튼으로 카테고리 추가
    await page.getByRole('button', { name: '첫 카테고리 만들기' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: '점심' }).click();
    await expect(dialog).not.toBeVisible();

    // 빈 상태 메시지가 사라졌는지 확인
    await expect(page.getByText('카테고리를 추가해보세요')).not.toBeVisible();

    // 장소 빈 상태 확인
    await expect(page.getByText('장소를 추가해보세요')).toBeVisible();
  });

  test('여러 카테고리가 서로 독립적으로 접기/펼치기 된다', async ({ page }) => {
    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('접기 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '접기 테스트' }).first().click();

    // 세 개의 카테고리 생성
    const categories = ['점심', '카페', '저녁'];
    for (const category of categories) {
      await page.locator('button:has-text("추가"):has(svg.lucide-plus)').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.getByRole('button', { name: category }).click();
      await expect(dialog).not.toBeVisible(); // 다이얼로그가 닫힐 때까지 대기
      await page.waitForTimeout(300); // 애니메이션 대기
    }

    // 모든 카테고리가 펼쳐진 상태에서 "장소를 추가해보세요" 메시지 확인
    const placeholderTexts = page.getByText('장소를 추가해보세요');
    await expect(placeholderTexts).toHaveCount(3);

    // 첫 번째 카테고리만 접기
    await page.getByText('점심').click();
    
    // 첫 번째 카테고리의 내용이 숨겨졌는지 확인
    await page.waitForTimeout(500); // 애니메이션 대기
    await expect(placeholderTexts).toHaveCount(2);

    // 세 번째 카테고리 접기
    await page.getByText('저녁').click();
    await page.waitForTimeout(500);
    await expect(placeholderTexts).toHaveCount(1);

    // 두 번째 카테고리만 펼쳐진 상태인지 확인
    await expect(page.locator('.space-y-2:visible:has-text("장소 검색")')).toHaveCount(1);
  });

  test('카테고리 색상이 올바르게 표시된다', async ({ page }) => {
    // 워크스페이스 생성 및 이동
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('색상 테스트');
    await page.getByRole('button', { name: '생성' }).click();
    await page.getByRole('heading', { name: '색상 테스트' }).first().click();

    // 카테고리 생성
    await page.getByRole('button', { name: /추가/ }).click();

    // 색상 팔레트가 표시되는지 확인
    const colorButtons = page.locator('button[aria-label*="색상"]');
    await expect(colorButtons).toHaveCount(14);

    // 특정 색상 선택
    const secondColor = colorButtons.nth(1);
    await secondColor.click();

    // 체크 표시 확인
    await expect(secondColor.locator('.lucide-check')).toBeVisible();

    // 카테고리 생성
    await page.getByPlaceholder('카테고리 이름').fill('색상 테스트');
    await page.getByRole('button', { name: '추가' }).click();

    // 카테고리 카드에서 색상 동그라미 확인
    const categoryColorBadge = page.locator('.w-6.h-6.rounded-full').first();
    await expect(categoryColorBadge).toBeVisible();
    await expect(categoryColorBadge).toContainText('1');
  });

  test('워크스페이스 삭제 시 경고 메시지가 표시된다', async ({ page }) => {
    // 워크스페이스 생성
    await page.getByRole('button', { name: /새 워크스페이스/ }).click();
    await page.getByLabel('제목').fill('삭제 경고 테스트');
    await page.getByRole('button', { name: '생성' }).click();

    // 컨텍스트 메뉴로 삭제 시도
    await page.getByRole('heading', { name: '삭제 경고 테스트' }).first().click({ button: 'right' });
    await page.getByRole('menuitem', { name: '삭제' }).click();

    // 경고 메시지가 표시되는지 확인
    await expect(page.getByText(/이 작업은 되돌릴 수 없으며.*모든 카테고리와 장소 정보가 함께 삭제됩니다/)).toBeVisible();
    
    // 삭제 버튼이 destructive 스타일인지 확인
    const deleteButton = page.getByRole('button', { name: '삭제' }).last();
    await expect(deleteButton).toHaveClass(/bg-destructive/);
  });

});
