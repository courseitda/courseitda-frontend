import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Calendar, GitFork, Sparkles } from 'lucide-react';
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
import { useCommunityRecommendCarousel } from '@/shared/hooks/use-community-recommend-carousel';

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
  const {
    sliderRef,
    trackRef,
    sliderCategories,
    activeIndex,
    isAnimating,
    hasLoop,
    recommendIndex,
    sliderWidth,
    cardWidth,
    cardGap,
    cardImageHeight,
    getBaseTranslate,
    handleSelectRecommend,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTransitionEnd,
  } = useCommunityRecommendCarousel(filteredCategories);

  const formatUploadedDate = (uploadedAt: string): string => {
    const date = new Date(uploadedAt);
    if (Number.isNaN(date.getTime())) return uploadedAt;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
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

        {/* UserRequest: 검색 제거 후 섹션 간 여백 재조정 */}
        <section className="px-8 pb-4 pt-6 md:pt-8">
            <div className="flex flex-col gap-3 mb-6">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold tracking-tight">{UI_COPY.community.recommendedTitle}</h2>
              </div>
            </div>
          {filteredCategories.length > 0 && (
            <div className="relative">
              <div className="flex items-center justify-center">
                <div
                  ref={sliderRef}
                  className="overflow-hidden w-full"
                  onPointerDown={(event) => {
                    handlePointerDown(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    handlePointerMove(event.clientX);
                  }}
                  onPointerUp={(event) => {
                    handlePointerUp(event.clientX);
                  }}
                  onPointerLeave={() => {
                    handlePointerLeave();
                  }}
                >
                  <div
                    ref={trackRef}
                    className={`flex items-center gap-4 ease-out ${isAnimating ? 'transition-transform duration-500' : 'transition-none'}`}
                    style={{
                      transform: `translateX(${sliderWidth ? (sliderWidth - cardWidth) / 2 - recommendIndex * (cardWidth + cardGap) : 0}px)`,
                    }}
                    onTransitionEnd={handleTransitionEnd}
                  >
                    {sliderCategories.map((category, index) => {
                      const normalizedIndex = hasLoop
                        ? (index - 1 + filteredCategories.length) % filteredCategories.length
                        : index;
                      const rawDiff = Math.abs(normalizedIndex - activeIndex);
                      const diff = hasLoop
                        ? Math.min(rawDiff, filteredCategories.length - rawDiff)
                        : rawDiff;
                      const scale = diff === 0 ? 1 : 0.94;
                      const opacity = diff === 0 ? 1 : 0.55;
                      const blur = diff === 0 ? 'blur(0)' : 'blur(2px)';

                      return (
                        <Card
                          key={`${category.id}-${index}`}
                          className="flex-shrink-0 hover-lift cursor-pointer"
                          onClick={() => handleOpenDetail(category)}
                          style={{
                            width: cardWidth,
                            transform: `scale(${scale})`,
                            opacity,
                            filter: blur,
                            transition: 'transform 0.35s ease, opacity 0.35s ease, filter 0.35s ease',
                          }}
                        >
                          <div
                            className="rounded-t-xl border-b border-border bg-muted/60 flex items-center justify-center text-xs text-muted-foreground"
                            style={{ height: cardImageHeight }}
                          >
                            이미지 영역
                          </div>
                          <CardContent className="p-4">
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                              <CardTitle className="truncate text-base">{category.title}</CardTitle>
                              <div className="flex min-w-0 items-center gap-2 text-xs">
                                {category.uploadedAt && (
                                  <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {formatUploadedDate(category.uploadedAt)}
                                  </span>
                                )}
                                <span
                                  className={[
                                    'inline-flex shrink-0 items-center gap-1',
                                    forkedSharedCategoryMap[category.id]
                                      ? 'text-violet-600'
                                      : 'text-muted-foreground/70',
                                  ].join(' ')}
                                >
                                  <GitFork className="h-3 w-3" />
                                  {category.forkCount}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* UserRequest: 카드 슬라이더 하단에 현재 위치를 표시하는 pagination dots 추가 */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {filteredCategories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    aria-label={`추천 카드 ${index + 1}번으로 이동`}
                    aria-pressed={activeIndex === index}
                    onClick={() => handleSelectRecommend(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      activeIndex === index ? 'bg-primary scale-110' : 'bg-muted-foreground/40 hover:bg-muted-foreground/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

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
