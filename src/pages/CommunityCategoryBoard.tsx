import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useSharedCategories } from '@/shared/hooks/use-community';
import { useForkedSharedCategoryIds, useMySavedCategories, useToggleSharedCategoryFork } from '@/shared/hooks/use-my-storage';
import { MESSAGES } from '@/shared/constants/messages';
import type { SharedSavedCategory } from '@/entities/types';
import { sortSharedCategoriesById } from '@/shared/utils/shared-category-sort';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import LoginRequiredDialog from '@/components/common/login-required-dialog';
import PageHeader from '@/components/layout/page-header';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';

const CommunityCategoryBoard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { data: savedCategories = [] } = useMySavedCategories(token);
  const toggleForkMutation = useToggleSharedCategoryFork(token);

  // UserRequest: 공유된 카테고리 게시판 페이지는 검색 결과 페이지와 동일한 구성으로 구현
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useSharedCategories();
  const { data: forkedSharedCategoryIds = [] } = useForkedSharedCategoryIds(
    token,
    sharedCategories.map((category) => category.id),
  );

  const filteredCategories = useMemo(() => {
    // UserRequest: 카테고리 게시판은 id 오름차순으로 기본 정렬
    return sortSharedCategoriesById(sharedCategories);
  }, [sharedCategories]);
  const forkedSharedCategoryMap = useMemo(
    () =>
      forkedSharedCategoryIds.reduce<Record<string, boolean>>((accumulator, sharedCategoryId) => {
        accumulator[sharedCategoryId] = true;
        return accumulator;
      }, {}),
    [forkedSharedCategoryIds],
  );

  // UserRequest: 공유된 카테고리 게시판 조회 실패 시 사용자에게 즉시 알림
  useQueryErrorToast(sharedCategoriesError, MESSAGES.sharedCategory.searchLoadFailed);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // UserRequest: 검색 영역 클릭 또는 제출 시 검색 전용 페이지로 이동
    navigate('/community/search');
  };

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

  if (sharedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-card">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title={UI_COPY.community.boardPageTitle} desktopSideLayout />

      {/* UserRequest: 헤더와 검색 영역 사이 간격을 0.5배로 조정 */}
      <DesktopSideLayout className="min-h-[calc(100vh-72px)]">
        <main className="min-h-[calc(100vh-72px)] flex flex-col overflow-x-hidden pt-6 pb-6 md:pt-8 md:pb-8">
          <div className="px-8">
            <div className="space-y-6">
              {/* UserRequest: 검색 영역 클릭 시 검색 전용 페이지로 이동 */}
              <section className="space-y-3">
                <SharedCategorySearchBar
                  value=""
                  onChange={() => undefined}
                  onSubmit={handleSearchSubmit}
                  readOnly
                  onFocus={() => navigate('/community/search')}
                  onClick={() => navigate('/community/search')}
                />
              </section>
            </div>
          </div>

          {/* UserRequest: 검색 영역과 데이터 영역 사이 구분선 위치 조정 */}
          <div className="mt-12 border-t border-border/60" />

          {/* UserRequest: 구분선 아래 전체 배경을 회색으로 표시 */}
          <div className="bg-muted/30 flex-1">
            <div className="px-8">
              <section className="space-y-3 p-3 md:p-4">
                {/* UserRequest: 정렬 드롭다운 제거 */}
                <SharedCategoryList
                  categories={filteredCategories}
                  forkedSharedCategoryMap={forkedSharedCategoryMap}
                  onOpenDetail={handleOpenDetail}
                  // UserRequest: 데스크톱 게시판 목록은 고정 높이로 자르지 않고 자연 높이로 모두 노출한다.
                  viewportClassName="h-[520px] md:h-auto"
                />
              </section>
            </div>
          </div>
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

      {/* UserRequest: 비회원에게는 업로드 버튼을 숨김 */}
      {isAuthenticated && (
        <Button
          type="button"
          onClick={() => navigate('/my-posts')}
          // UserRequest: 모바일 브라우저 하단 UI와 겹치지 않도록 업로드 FAB의 하단 위치에 safe area를 반영한다.
          className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-lg gap-2 px-5 py-3 text-base rounded-full upload-fab-pop"
        >
          <Upload className="w-4 h-4" />
          <span className="font-semibold">{UI_COPY.community.uploadFabLabel}</span>
        </Button>
      )}
    </div>
  );
};

export default CommunityCategoryBoard;
