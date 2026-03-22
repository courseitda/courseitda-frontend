import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { useSharedCategories } from '@/shared/hooks/use-community';
import { useForkedSharedCategoryIds, useMySavedCategories, useToggleSharedCategoryFork } from '@/shared/hooks/use-my-storage';
import { MESSAGES } from '@/shared/constants/messages';
import type { SharedSavedCategory } from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import LoginRequiredDialog from '@/components/common/login-required-dialog';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import RecommendedCategoryCarousel from '@/components/community/recommended-category-carousel';

/**
 * 커뮤니티 메인 페이지 - 검색 입력 후 검색 결과 페이지로 이동
 * UserRequest: 메인 섹션 절반을 primary 배경으로 채우고 중앙에 검색창/버튼 배치
 */
const Community = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  // UserRequest: Community 페이지의 추천/검색 로직은 service 계층 인터페이스를 통해 실행
  // TODO: 다음 스프린트에서 recommendations API가 준비되면 추천 영역 조회를 전용 API로 교체한다.
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useSharedCategories(5, false);
  const {
    data: boardCategories = [],
    error: boardCategoriesError,
  } = useSharedCategories(3, false);
  const { data: savedCategories = [] } = useMySavedCategories(token);
  const { data: forkedSharedCategoryIds = [] } = useForkedSharedCategoryIds(
    token,
    Array.from(new Set([...sharedCategories, ...boardCategories].map((category) => category.id))),
  );
  const toggleForkMutation = useToggleSharedCategoryFork(token);

  const filteredCategories = useMemo(() => sharedCategories, [sharedCategories]);
  const forkedSharedCategoryMap = useMemo(
    () =>
      forkedSharedCategoryIds.reduce<Record<string, boolean>>((accumulator, sharedCategoryId) => {
        accumulator[sharedCategoryId] = true;
        return accumulator;
      }, {}),
    [forkedSharedCategoryIds],
  );

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  const handleFork = async (category: SharedSavedCategory) => {
    // UserRequest: 상세 모달의 fork 아이콘을 누르면 내 카테고리로 복사
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return false;
    }

    const forkedSavedCategoryId = savedCategories.find(
      (savedCategory) => savedCategory.forkedFromSharedCategoryId === category.id,
    )?.id ?? null;

    if (toggleForkMutation.isPending) return false;
    try {
      const result = await toggleForkMutation.mutateAsync({ category, forkedSavedCategoryId });
      return result.action;
    } catch {
      return false;
    }
  };

  // UserRequest: 로그인 필요 안내는 전용 안내창으로 노출
  const handleLoginStart = () => {
    setLoginDialogOpen(false);
    navigate('/auth?tab=login');
  };

  // UserRequest: 추천 목록 조회 실패 시 사용자에게 즉시 알림
  useQueryErrorToast(sharedCategoriesError, MESSAGES.sharedCategory.recommendedLoadFailed);
  useQueryErrorToast(boardCategoriesError, MESSAGES.sharedCategory.searchLoadFailed);

  // 데이터 로딩 중에는 중앙에 스피너를 표시하여 진행 상황 안내
  if (sharedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title={UI_COPY.community.pageTitle} desktopSideLayout />

      <DesktopSideLayout className="min-h-[calc(100vh-72px)]">
        <main className="min-h-[calc(100vh-72px)] flex flex-col">

        <RecommendedCategoryCarousel
          categories={filteredCategories}
          forkedSharedCategoryMap={forkedSharedCategoryMap}
          onOpenDetail={handleOpenDetail}
        />

        {/* UserRequest: 커뮤니티 페이지에서 검색 영역 제거 */}

        <section className="px-8 pt-2 pb-8">
          {/* UserRequest: 섹션 문구를 "카테고리 게시판"으로 변경 */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-base font-semibold pl-1">{UI_COPY.community.boardTitle}</h2>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:underline flex items-center gap-1"
              onClick={() => navigate('/community/category-board')}
            >
              더보기
              <span aria-hidden>&gt;</span>
            </button>
          </div>
          {/* UserRequest: 전체 카테고리 영역을 옅은 회색 배경으로 강조 */}
          <div className="border border-border rounded-2xl bg-muted/30 p-3 md:p-4">
            {/* UserRequest: 전체 카테고리 카드 간격을 1/3 수준으로 축소 */}
            {/* UserRequest: 카테고리 게시판에는 최대 4개까지만 노출 */}
            {/* UserRequest: 커뮤니티 메인 카테고리 게시판 카드도 공통 SharedCategoryList를 사용한다. */}
            <SharedCategoryList
              categories={boardCategories}
              forkedSharedCategoryMap={forkedSharedCategoryMap}
              onOpenDetail={handleOpenDetail}
              viewportClassName="h-auto"
              size="compact"
            />
          </div>
        </section>

        {/* UserRequest: 커뮤니티 페이지에서 커뮤니티 관리 영역 제거 */}
        </main>
      </DesktopSideLayout>

      <SharedCategoryDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        category={selectedCategory}
        isForked={selectedCategory ? forkedSharedCategoryIds.includes(selectedCategory.id) : false}
        onToggleFork={handleFork}
        forkPending={toggleForkMutation.isPending}
      />
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onStart={handleLoginStart}
        featureName="fork 기능"
      />
    </div>
  );
};

export default Community;
