import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useSharedCategorySearch } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';
import type { SharedSavedCategory } from '@/entities/types';
import { useAuthStore } from '@/shared/stores/auth-store';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import PageHeader from '@/components/layout/page-header';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import LoginRequiredDialog from '@/components/common/login-required-dialog';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';

const SearchResult = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // UserRequest: /community/search/results 결과는 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useSharedCategorySearch(keyword);

  const { toggleLike } = useSharedCategoryLike({
    queryKey: [...COMMUNITY_QUERY_KEYS.search(keyword), token],
    token,
    isAuthenticated,
    setSelectedCategory,
    onRequireLogin: () => setLoginDialogOpen(true),
  });

  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  const filteredCategories = useMemo(() => sharedCategories, [sharedCategories]);

  // UserRequest: 검색 결과 조회 실패 시 사용자에게 즉시 알림
  useQueryErrorToast(sharedCategoriesError, MESSAGES.sharedCategory.searchLoadFailed);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // UserRequest: 검색 결과 페이지에서는 제출 시 검색 전용 페이지로 이동
    navigate('/community/search');
  };

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  const handleFavoriteClick = (category: SharedSavedCategory) =>
    toggleLike({ sharedCategoryId: category.id, currentLiked: !!category.liked });

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
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title={UI_COPY.searchResult.pageTitle} desktopSideLayout />

      <DesktopSideLayout className="min-h-[calc(100vh-72px)]">
        <main className="px-8 py-6 md:py-8">
          <div className="space-y-6">
          <section className="space-y-3">
            {/* UserRequest: 검색 결과 페이지 검색창을 커뮤니티 페이지와 동일한 형태로 변경 */}
            {/* UserRequest: 검색 페이지 진입 시 키보드 포커스를 바로 활성화 */}
            <SharedCategorySearchBar
              value={inputKeyword}
              onChange={setInputKeyword}
              onSubmit={handleSearchSubmit}
              onFocus={() => navigate('/community/search')}
              onClick={() => navigate('/community/search')}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-base font-semibold pl-1">{UI_COPY.searchResult.sectionTitle}</h2>
              <span className="text-xs text-muted-foreground">
                {filteredCategories.length}{UI_COPY.common.countSuffix}
              </span>
            </div>

            {/* UserRequest: 검색 결과 영역을 커뮤니티 게시판과 동일하게 간격을 좁히고 박스 형태로 구분 */}
            <div className="border border-border rounded-2xl bg-muted/30 p-3 md:p-4">
              {/* UserRequest: 검색 결과 영역 높이를 고정하고 내부 스크롤로 표시 */}
              <SharedCategoryList
                categories={filteredCategories}
                onOpenDetail={handleOpenDetail}
                onFavoriteClick={handleFavoriteClick}
                showEmptyState
                // UserRequest: 데스크톱 검색 결과 목록은 고정 높이로 자르지 않고 자연 높이로 모두 노출한다.
                viewportClassName="h-[520px] md:h-auto"
              />
            </div>
          </section>
          </div>
        </main>
      </DesktopSideLayout>

      <SharedCategoryDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        category={selectedCategory}
        onFavoriteClick={handleFavoriteClick}
      />
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onStart={handleLoginStart}
        featureName="찜 기능"
      />
    </div>
  );
};

export default SearchResult;
