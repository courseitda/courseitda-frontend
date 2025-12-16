import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import logo from '@/assets/logo-no-background.png';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Heart, Archive, Search, ArrowLeft, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import UserMenu from '@/components/header/user-menu';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/services/api';
import { COMMUNITY_QUERY_KEYS, useRecommendedSharedCategories } from '@/shared/hooks/use-community';
import type { SharedSavedCategory } from '@/entities/types';

/**
 * 커뮤니티 메인 페이지 - 검색 입력 후 검색 결과 페이지로 이동
 * UserRequest: 메인 섹션 절반을 primary 배경으로 채우고 중앙에 검색창/버튼 배치
 */
const Community = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [keyword, setKeyword] = useState('');
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recommendIndex, setRecommendIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const [sliderWidth, setSliderWidth] = useState(0);
  const queryClient = useQueryClient();

  // UserRequest: Community 페이지의 추천/검색/찜 로직은 service 계층 인터페이스를 통해 실행
  const {
    data: sharedCategories = [],
    isLoading: sharedCategoriesLoading,
    error: sharedCategoriesError,
  } = useRecommendedSharedCategories();

  const filteredCategories = useMemo(() => sharedCategories, [sharedCategories]);
  const CARD_WIDTH = 280;
  const CARD_GAP = 16;

  const toggleLikeMutation = useMutation({
    mutationFn: async (params: { sharedCategoryId: string; nextLiked: boolean }) => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }

      const response = params.nextLiked
        ? await communityApi.likeSharedCategory(token, params.sharedCategoryId)
        : await communityApi.unlikeSharedCategory(token, params.sharedCategoryId);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '찜 처리에 실패했습니다.');
      }

      return response.data;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });

      const previous = queryClient.getQueryData<SharedSavedCategory[]>(COMMUNITY_QUERY_KEYS.recommended);
      queryClient.setQueryData<SharedSavedCategory[]>(COMMUNITY_QUERY_KEYS.recommended, (old) =>
        (old ?? []).map((category) =>
          category.id === params.sharedCategoryId ? { ...category, liked: params.nextLiked } : category,
        ),
      );

      setSelectedCategory((previousSelected) =>
        previousSelected && previousSelected.id === params.sharedCategoryId
          ? { ...previousSelected, liked: params.nextLiked }
          : previousSelected,
      );

      return { previous };
    },
    onError: (error, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(COMMUNITY_QUERY_KEYS.recommended, context.previous);
      }
      const message = error instanceof Error ? error.message : '찜 처리에 실패했습니다.';
      toast.error(message);
    },
    onSuccess: (data) => {
      toast[data.isLiked ? 'success' : 'info'](
        data.isLiked ? '찜했어요. 내 보관함에서 확인할 수 있습니다.' : '찜을 해제했습니다.',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
    },
  });

  const handleToggleLike = (id: string) => {
    if (!isAuthenticated) {
      toast.error('로그인 후 이용할 수 있는 기능입니다.');
      return;
    }
    if (!token) {
      toast.error('인증 토큰이 필요합니다. 다시 로그인해주세요.');
      return;
    }

    const target = filteredCategories.find((category) => category.id === id);
    if (!target || toggleLikeMutation.isPending) return;

    toggleLikeMutation.mutate({ sharedCategoryId: id, nextLiked: !target.liked });
    setLikePulse((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [id]: false }));
    }, 200);
  };

  const handleOpenDetail = (category: SharedSavedCategory) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  useEffect(() => {
    // UserRequest: 추천 목록 조회 실패 시 사용자에게 즉시 알림
    if (sharedCategoriesError) {
      toast.error(sharedCategoriesError.message);
    }
  }, [sharedCategoriesError]);

  // 추천 카드 자동 전환 - 일정 간격으로 다음 카드로 이동
  useEffect(() => {
    if (filteredCategories.length === 0) return;
    const timer = setInterval(() => {
      setRecommendIndex((prev) => (prev + 1) % filteredCategories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [filteredCategories.length]);

  // 슬라이더 너비 측정 - 중앙 정렬 오프셋 계산용
  useEffect(() => {
    const handleResize = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
              <span className="font-bold text-lg whitespace-nowrap text-primary">코스잇다</span>
            </div>
            <div className="flex items-center justify-end">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-72px)] flex flex-col">
        <section className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <section className="space-y-3">
              <form onSubmit={(event) => {
                event.preventDefault();
                const value = keyword.trim();
                navigate(`/community/search${value ? `?keyword=${encodeURIComponent(value)}` : ''}`);
              }} className="flex flex-row gap-3 items-stretch">
                <div className="flex-1 flex gap-2">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="잠실 점심 식당, 건대 카페"
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="gap-2">
                  <Search className="w-4 h-4" />
                  검색
                </Button>
              </form>
            </section>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-6">
            <div className="flex flex-col items-center gap-3 mb-6 text-center">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">★</span>
                <h2 className="text-lg font-bold tracking-tight">코스잇다 추천 카테고리!</h2>
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
                    startX.current = event.clientX;
                    currentTranslate.current = (sliderWidth ? (sliderWidth - CARD_WIDTH) / 2 - recommendIndex * (CARD_WIDTH + CARD_GAP) : 0);
                  }}
                  onPointerMove={(event) => {
                    if (!isDragging.current || !sliderRef.current) return;
                    const delta = event.clientX - startX.current;
                    sliderRef.current.style.setProperty(
                      'transform',
                      `translateX(${currentTranslate.current + delta}px)`
                    );
                  }}
                  onPointerUp={(event) => {
                    if (!isDragging.current || !sliderRef.current) return;
                    isDragging.current = false;
                    const delta = event.clientX - startX.current;
                    const threshold = CARD_WIDTH / 3;
                    sliderRef.current.style.removeProperty('transform');
                    if (delta > threshold) {
                      setRecommendIndex((prev) => (prev - 1 + filteredCategories.length) % filteredCategories.length);
                    } else if (delta < -threshold) {
                      setRecommendIndex((prev) => (prev + 1) % filteredCategories.length);
                    }
                  }}
                  onPointerLeave={() => {
                    if (isDragging.current) {
                      isDragging.current = false;
                      sliderRef.current?.style.removeProperty('transform');
                    }
                  }}
                >
                  <div
                    className="flex items-center gap-4 transition-transform duration-500 ease-out"
                    style={{
                      transform: `translateX(${sliderWidth ? (sliderWidth - CARD_WIDTH) / 2 - recommendIndex * (CARD_WIDTH + CARD_GAP) : 0}px)`,
                    }}
                  >
                    {filteredCategories.map((category, index) => {
                      const diff = Math.abs(index - recommendIndex);
                      const scale = diff === 0 ? 1 : 0.94;
                      const opacity = diff === 0 ? 1 : 0.55;
                      const blur = diff === 0 ? 'blur(0)' : 'blur(2px)';

                      return (
                        <Card
                          key={category.id}
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
                        if (!isAuthenticated) {
                          toast.error('로그인 후 이용할 수 있는 기능입니다.');
                          return;
                        }
                        handleToggleLike(category.id);
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
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">전체 카테고리</h2>
            <span className="text-xs text-muted-foreground">{filteredCategories.length}개</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="hover-lift cursor-pointer"
                onClick={() => handleOpenDetail(category)}
              >
                <CardHeader className="flex flex-row items-center gap-3 py-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                      <Archive className="w-4 h-4" />
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
                      if (!isAuthenticated) {
                        toast.error('로그인 후 이용할 수 있는 기능입니다.');
                        return;
                      }
                      handleToggleLike(category.id);
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
        </section>
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{selectedCategory?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-primary" />
                {selectedCategory?.uploader}
              </span>
              {selectedCategory?.uploadedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(selectedCategory.uploadedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
              지도 영역 (임시)
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                장소 목록
                {selectedCategory?.placeCount !== undefined && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({selectedCategory.placeCount}곳)
                  </span>
                )}
              </p>
              <div className="border border-border rounded-lg divide-y divide-border">
                {selectedCategory?.places.map((place) => (
                  <div key={place.id} className="p-3 flex flex-col gap-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {place.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{place.addressName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
