import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Heart, Folder, User as UserIcon, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useRecommendedSharedCategories } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';
import type { SharedSavedCategory } from '@/entities/types';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';
import PageHeader from '@/components/layout/page-header';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import LoginRequiredDialog from '@/components/common/login-required-dialog';

/**
 * 커뮤니티 메인 페이지 - 검색 입력 후 검색 결과 페이지로 이동
 * UserRequest: 메인 섹션 절반을 primary 배경으로 채우고 중앙에 검색창/버튼 배치
 */
const Community = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [recommendIndex, setRecommendIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const isLoopFixingRef = useRef(false);
  const loopFallbackTimerRef = useRef<number | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const { toggleLike } = useSharedCategoryLike({
    queryKey: COMMUNITY_QUERY_KEYS.recommended,
    token,
    isAuthenticated,
    setSelectedCategory,
    onRequireLogin: () => setLoginDialogOpen(true),
  });

  // UserRequest: Community 페이지의 추천/검색/찜 로직은 service 계층 인터페이스를 통해 실행
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useRecommendedSharedCategories();

  const filteredCategories = useMemo(() => sharedCategories, [sharedCategories]);
  const hasLoop = filteredCategories.length > 1;
  const sliderCategories = useMemo(() => {
    if (filteredCategories.length === 0) return [];
    if (!hasLoop) return filteredCategories;
    const first = filteredCategories[0];
    const last = filteredCategories[filteredCategories.length - 1];
    return [last, ...filteredCategories, first];
  }, [filteredCategories, hasLoop]);
  const CARD_WIDTH = 280;
  const CARD_GAP = 16;
  // UserRequest: 클린 코드 기준 Hook 의존성 경고를 제거하기 위해 계산 함수를 메모이제이션
  const getBaseTranslate = useCallback(
    (index: number) =>
      sliderWidth ? (sliderWidth - CARD_WIDTH) / 2 - index * (CARD_WIDTH + CARD_GAP) : 0,
    [sliderWidth],
  );
  const activeIndex = filteredCategories.length
    ? hasLoop
      ? (recommendIndex - 1 + filteredCategories.length) % filteredCategories.length
      : recommendIndex
    : 0;

  // UserRequest: 공유 카테고리 찜 토글 로직을 공통 훅으로 대체
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

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  // UserRequest: 로그인 필요 안내는 안내창으로 노출되도록 처리
  const handleLoginStart = () => {
    setLoginDialogOpen(false);
    navigate('/auth?tab=register');
  };

  // UserRequest: pagination dots 클릭 시 정상 이동을 보장하도록 드래그 상태를 초기화
  const handleSelectRecommend = (index: number) => {
    isDragging.current = false;
    if (trackRef.current) {
      // UserRequest: 점프 시 transform 제거 대신 목표 위치로 동기화하여 깜빡임 방지
      const nextIndex = hasLoop ? index + 1 : index;
      trackRef.current.style.transform = `translateX(${getBaseTranslate(nextIndex)}px)`;
    }
    // UserRequest: 추천 슬라이더를 무한 루프로 동작하도록 인덱스 보정
    setIsAnimating(true);
    setRecommendIndex(hasLoop ? index + 1 : index);
  };

  useEffect(() => {
    // UserRequest: 추천 목록 조회 실패 시 사용자에게 즉시 알림
    if (sharedCategoriesError) {
      toast.error(sharedCategoriesError.message || MESSAGES.sharedCategory.recommendedLoadFailed);
    }
  }, [sharedCategoriesError]);

  // 추천 카드 자동 전환 - 일정 간격으로 다음 카드로 이동
  useEffect(() => {
    if (filteredCategories.length === 0 || !hasLoop) return;
    if (sliderWidth === 0) return;
    const timer = setInterval(() => {
      setRecommendIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [filteredCategories.length, hasLoop, sliderWidth]);

  useEffect(() => {
    // UserRequest: 초기 렌더/리로드 시 중앙 정렬이 확정된 뒤에 슬라이더 위치를 설정
    if (filteredCategories.length === 0) {
      setRecommendIndex(0);
      return;
    }
    if (sliderWidth === 0) return;
    setIsAnimating(false);
    setRecommendIndex(hasLoop ? 1 : 0);
    requestAnimationFrame(() => setIsAnimating(true));
  }, [filteredCategories.length, hasLoop, sliderWidth]);

  useEffect(() => {
    if (!trackRef.current || sliderWidth === 0) return;
    if (isDragging.current) return;
    // UserRequest: 인덱스 변경 시 DOM 위치와 상태를 강제로 동기화하여 정지 현상 방지
    trackRef.current.style.transform = `translateX(${getBaseTranslate(recommendIndex)}px)`;
  }, [recommendIndex, sliderWidth, getBaseTranslate]);

  useEffect(() => {
    // UserRequest: transitionend 누락 시에만 지연 보정하여 경계 전환이 점프처럼 보이지 않게 처리
    if (!hasLoop) return;
    if (!isAnimating) return;

    const isLoopBoundary = recommendIndex === 0 || recommendIndex === filteredCategories.length + 1;
    if (!isLoopBoundary) {
      if (loopFallbackTimerRef.current) {
        window.clearTimeout(loopFallbackTimerRef.current);
        loopFallbackTimerRef.current = null;
      }
      return;
    }

    if (loopFallbackTimerRef.current) {
      window.clearTimeout(loopFallbackTimerRef.current);
    }

    loopFallbackTimerRef.current = window.setTimeout(() => {
      if (isLoopFixingRef.current) return;
      isLoopFixingRef.current = true;
      setIsAnimating(false);
      requestAnimationFrame(() => {
        const nextIndex = recommendIndex === 0 ? filteredCategories.length : 1;
        setRecommendIndex(nextIndex);
        requestAnimationFrame(() => {
          setIsAnimating(true);
          isLoopFixingRef.current = false;
        });
      });
      loopFallbackTimerRef.current = null;
    }, 560);

    return () => {
      if (loopFallbackTimerRef.current) {
        window.clearTimeout(loopFallbackTimerRef.current);
        loopFallbackTimerRef.current = null;
      }
    };
  }, [recommendIndex, hasLoop, filteredCategories.length, isAnimating]);

  const updateSliderWidth = useCallback(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.getBoundingClientRect().width);
    }
  }, []);

  // UserRequest: 데스크톱에서도 중앙 정렬이 안정적으로 계산되도록 슬라이더 폭을 실시간 측정
  useLayoutEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    updateSliderWidth();
    const observer = new ResizeObserver(() => updateSliderWidth());
    observer.observe(slider);

    return () => observer.disconnect();
  }, [updateSliderWidth]);

  useEffect(() => {
    // UserRequest: 다른 탭에서 복귀 시 애니메이션/중앙 정렬 상태를 즉시 복구
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      updateSliderWidth();
      if (hasLoop) {
        if (recommendIndex === 0) {
          setIsAnimating(false);
          requestAnimationFrame(() => {
            setRecommendIndex(filteredCategories.length);
            requestAnimationFrame(() => setIsAnimating(true));
          });
          return;
        }
        if (recommendIndex === filteredCategories.length + 1) {
          setIsAnimating(false);
          requestAnimationFrame(() => {
            setRecommendIndex(1);
            requestAnimationFrame(() => setIsAnimating(true));
          });
          return;
        }
      }
      setIsAnimating(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateSliderWidth, hasLoop, recommendIndex, filteredCategories.length]);

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
      <PageHeader title="커뮤니티" />

      <main className="min-h-[calc(100vh-72px)] flex flex-col">

        {/* UserRequest: 검색 제거 후 섹션 간 여백 재조정 */}
        <section className="container mx-auto px-4 pb-4 pt-6 md:pt-8">
            <div className="flex flex-col gap-3 mb-6">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold tracking-tight">코스잇다 추천 카테고리</h2>
              </div>
            </div>
          {filteredCategories.length > 0 && (
            <div className="relative">
              <div className="flex items-center justify-center">
                <div
                  ref={sliderRef}
                  className="overflow-hidden w-full max-w-5xl"
                  onPointerDown={(event) => {
                    if (filteredCategories.length === 0) return;
                    isDragging.current = true;
                    // UserRequest: 드래그 중에는 애니메이션을 제거하여 자연스러운 이동 제공
                    setIsAnimating(false);
                    startX.current = event.clientX;
                    // UserRequest: 순차 전환 시 활성 카드가 정중앙에 오도록 기준 위치를 계산
                    currentTranslate.current = getBaseTranslate(recommendIndex);
                  }}
                  onPointerMove={(event) => {
                    if (!isDragging.current || !trackRef.current) return;
                    const delta = event.clientX - startX.current;
                    trackRef.current.style.setProperty(
                      'transform',
                      `translateX(${currentTranslate.current + delta}px)`
                    );
                  }}
                  onPointerUp={(event) => {
                    if (!isDragging.current || !trackRef.current) return;
                    isDragging.current = false;
                    setIsAnimating(true);
                    const delta = event.clientX - startX.current;
                    const threshold = CARD_WIDTH / 3;
                    let nextIndex = recommendIndex;
                    if (delta > threshold) {
                      nextIndex = hasLoop ? recommendIndex - 1 : Math.max(0, recommendIndex - 1);
                    } else if (delta < -threshold) {
                      nextIndex = hasLoop
                        ? recommendIndex + 1
                        : Math.min(filteredCategories.length - 1, recommendIndex + 1);
                    }
                    // UserRequest: 드래그 종료 시 DOM과 상태의 transform을 동일 위치로 맞춤
                    trackRef.current.style.transform = `translateX(${getBaseTranslate(nextIndex)}px)`;
                    setRecommendIndex(nextIndex);
                  }}
                  onPointerLeave={() => {
                    if (isDragging.current) {
                      isDragging.current = false;
                      setIsAnimating(true);
                      if (trackRef.current) {
                        trackRef.current.style.transform = `translateX(${getBaseTranslate(recommendIndex)}px)`;
                      }
                    }
                  }}
                >
                  <div
                    ref={trackRef}
                    className={`flex items-center gap-4 ease-out ${isAnimating ? 'transition-transform duration-500' : 'transition-none'}`}
                    style={{
                      transform: `translateX(${sliderWidth ? (sliderWidth - CARD_WIDTH) / 2 - recommendIndex * (CARD_WIDTH + CARD_GAP) : 0}px)`,
                    }}
                    onTransitionEnd={() => {
                      if (!hasLoop) return;
                      if (recommendIndex === 0) {
                        // UserRequest: 마지막 -> 첫번째 이동 시 역방향 튐을 방지하기 위해 위치를 즉시 보정
                        setIsAnimating(false);
                        requestAnimationFrame(() => {
                          setRecommendIndex(filteredCategories.length);
                          requestAnimationFrame(() => setIsAnimating(true));
                        });
                      }
                      if (recommendIndex === filteredCategories.length + 1) {
                        // UserRequest: 첫번째 -> 마지막 이동 시 자연스러운 무한 루프를 유지
                        setIsAnimating(false);
                        requestAnimationFrame(() => {
                          setRecommendIndex(1);
                          requestAnimationFrame(() => setIsAnimating(true));
                        });
                      }
                    }}
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
                            width: CARD_WIDTH,
                            transform: `scale(${scale})`,
                            opacity,
                            filter: blur,
                            transition: 'transform 0.35s ease, opacity 0.35s ease, filter 0.35s ease',
                          }}
                        >
                          <div className="h-48 rounded-t-xl bg-muted/60 border-b border-border flex items-center justify-center text-sm text-muted-foreground">
                            이미지 영역
                          </div>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg truncate">{category.title}</CardTitle>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleLike(category);
                      }}
                      aria-label={`${category.title} 찜하기`}
                      aria-pressed={category.liked}
                      className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
                    >
                      {likePulse[category.id] && (
                        <span className="absolute inset-0 rounded-full bg-rose-200/70 animate-ping" />
                      )}
                      <Heart
                        className={`w-6 h-6 ${isAuthenticated ? 'like-heart' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                        fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                        strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                      />
                    </button>
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

        <section className="container mx-auto px-4 pt-2 pb-8">
          {/* UserRequest: 섹션 문구를 "카테고리 게시판"으로 변경 */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-base font-semibold pl-1">카테고리 게시판</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {filteredCategories.slice(0, 4).map((category) => (
                <Card
                  key={category.id}
                  className="hover-lift cursor-pointer"
                  onClick={() => handleOpenDetail(category)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 py-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                        {category.placeCount}
                      </span>
                    </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{category.title}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-primary" />
                        {category.uploader}
                        </p>
                      </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleLike(category);
                      }}
                      aria-label={`${category.title} 찜하기`}
                      aria-pressed={category.liked}
                      className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
                    >
                      {likePulse[category.id] && (
                        <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
                      )}
                      <Heart
                        className={`w-7 h-7 ${isAuthenticated ? 'like-heart' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                        fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                        strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                      />
                    </button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* UserRequest: 커뮤니티 페이지에서 커뮤니티 관리 영역 제거 */}
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

export default Community;
