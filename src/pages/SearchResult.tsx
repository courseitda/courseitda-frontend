import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useSharedCategorySearch } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';
import type { SharedSavedCategory } from '@/entities/types';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import PageHeader from '@/components/layout/page-header';
import { UI_COPY } from '@/shared/constants/ui-copy';

const SearchResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
      toast.error(sharedCategoriesError.message || MESSAGES.sharedCategory.searchLoadFailed);
    }
  }, [sharedCategoriesError]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // UserRequest: 검색 결과 페이지에서는 제출 시 검색 전용 페이지로 이동
    navigate('/community/search');
  };

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
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
      <PageHeader title={UI_COPY.searchResult.pageTitle} />

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
              <h2 className="text-base font-semibold pl-1">{UI_COPY.searchResult.sectionTitle}</h2>
              <span className="text-xs text-muted-foreground">
                {filteredCategories.length}개
              </span>
            </div>

            {/* UserRequest: 검색 결과 영역을 커뮤니티 게시판과 동일하게 간격을 좁히고 박스 형태로 구분 */}
            <div className="border border-border rounded-2xl bg-muted/30 p-3 md:p-4">
              {/* UserRequest: 검색 결과 영역 높이를 고정하고 내부 스크롤로 표시 */}
              <SharedCategoryList
                categories={filteredCategories}
                onOpenDetail={handleOpenDetail}
                showEmptyState
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
    </div>
  );
};

export default SearchResult;
