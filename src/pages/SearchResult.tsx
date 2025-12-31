import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useSharedCategorySearch } from '@/shared/hooks/use-community';
import type { SharedSavedCategory } from '@/entities/types';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import PageHeader from '@/components/layout/page-header';
import LoginRequiredDialog from '@/components/common/login-required-dialog';

const SearchResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  const keyword = searchParams.get('keyword') || '';
  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // UserRequest: /community/search/results 결과는 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useSharedCategorySearch(keyword);

  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  const filteredCategories = useMemo(() => sharedCategories, [sharedCategories]);

  useEffect(() => {
    // UserRequest: 검색 결과 조회 실패 시 사용자에게 즉시 알림
    if (sharedCategoriesError) {
      toast.error(sharedCategoriesError.message);
    }
  }, [sharedCategoriesError]);

  // UserRequest: 공유 카테고리 찜 토글 로직을 공통 훅으로 대체
  const { toggleLike } = useSharedCategoryLike({
    queryKey: COMMUNITY_QUERY_KEYS.search(keyword),
    token,
    isAuthenticated,
    setSelectedCategory,
    onRequireLogin: () => setLoginDialogOpen(true),
  });

  const triggerLikePulse = (categoryId: string) => {
    setLikePulse((prev) => ({ ...prev, [categoryId]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [categoryId]: false }));
    }, 200);
  };

  const handleToggleLike = (category: SharedSavedCategory) => {
    const didToggle = toggleLike({ sharedCategoryId: category.id, currentLiked: category.liked });
    if (!didToggle) return;
    triggerLikePulse(category.id);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // UserRequest: 검색 결과 페이지에서는 제출 시 검색 전용 페이지로 이동
    navigate('/community/search');
  };

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  // UserRequest: 로그인 필요 안내는 안내창으로 노출되도록 처리
  const handleLoginStart = () => {
    setLoginDialogOpen(false);
    navigate('/auth?tab=register');
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
      <PageHeader showLogo />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
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
              <h2 className="text-base font-semibold pl-1">검색 결과</h2>
              <span className="text-xs text-muted-foreground">
                {filteredCategories.length}개
              </span>
            </div>

            {/* UserRequest: 검색 결과 영역을 커뮤니티 게시판과 동일하게 간격을 좁히고 박스 형태로 구분 */}
            <div className="border border-border rounded-2xl bg-muted/30 p-3 md:p-4">
              {/* UserRequest: 검색 결과 영역 높이를 고정하고 내부 스크롤로 표시 */}
              <SharedCategoryList
                categories={filteredCategories}
                isAuthenticated={isAuthenticated}
                likePulse={likePulse}
                onOpenDetail={handleOpenDetail}
                onToggleLike={handleToggleLike}
              />
            </div>
          </section>
    </div>
  </main>

      <SharedCategoryDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        category={selectedCategory}
      />
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onStart={handleLoginStart}
      />
    </div>
  );
};

export default SearchResult;
