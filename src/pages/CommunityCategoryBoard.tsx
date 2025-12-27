import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useSharedCategorySearch } from '@/shared/hooks/use-community';
import type { SharedSavedCategory } from '@/entities/types';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';
import { sortSharedCategoriesById } from '@/shared/utils/shared-category-sort';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import PageHeader from '@/components/layout/page-header';

const CommunityCategoryBoard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [inputKeyword, setInputKeyword] = useState('');
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const keyword = '';

  // UserRequest: 공유된 카테고리 게시판 페이지는 검색 결과 페이지와 동일한 구성으로 구현
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useSharedCategorySearch(keyword);

  const filteredCategories = useMemo(() => {
    // UserRequest: 카테고리 게시판은 id 오름차순으로 기본 정렬
    return sortSharedCategoriesById(sharedCategories);
  }, [sharedCategories]);

  useEffect(() => {
    // UserRequest: 공유된 카테고리 게시판 조회 실패 시 사용자에게 즉시 알림
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
    const value = inputKeyword.trim();
    navigate(`/community/search${value ? `?keyword=${encodeURIComponent(value)}` : ''}`);
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
      <PageHeader title="카테고리 게시판" />

      {/* UserRequest: 헤더와 검색 영역 사이 간격을 0.5배로 조정 */}
      <main className="min-h-[calc(100vh-72px)] flex flex-col pt-6 pb-6 md:pt-8 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <section className="space-y-3">
              <SharedCategorySearchBar
                value={inputKeyword}
                onChange={setInputKeyword}
                onSubmit={handleSearchSubmit}
              />
            </section>
          </div>
        </div>

        {/* UserRequest: 검색 영역과 데이터 영역 사이 구분선 위치 조정 */}
        <div className="mt-12 border-t border-border/60" />

        {/* UserRequest: 구분선 아래 전체 배경을 회색으로 표시 */}
        <div className="bg-muted/30 flex-1">
          <div className="container mx-auto px-4">
            <section className="max-w-6xl mx-auto space-y-3 p-3 md:p-4">
              {/* UserRequest: 정렬 드롭다운 제거 */}
              <SharedCategoryList
                categories={filteredCategories}
                isAuthenticated={isAuthenticated}
                likePulse={likePulse}
                onOpenDetail={handleOpenDetail}
                onToggleLike={handleToggleLike}
              />
            </section>
          </div>
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

export default CommunityCategoryBoard;
