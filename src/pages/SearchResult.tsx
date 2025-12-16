import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo-no-background.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/shared/stores/auth-store';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Search, Folder, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import UserMenu from '@/components/header/user-menu';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/services/api';
import { COMMUNITY_QUERY_KEYS, useSharedCategorySearch } from '@/shared/hooks/use-community';
import type { SharedSavedCategory } from '@/entities/types';

const SearchResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  const keyword = searchParams.get('keyword') || '';
  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  // UserRequest: /community/search 결과는 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
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

  // UserRequest: 공유 카테고리 찜 토글은 service 계층 인터페이스를 통해 서버(또는 MSW)로 위임
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
      const key = COMMUNITY_QUERY_KEYS.search(keyword);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<SharedSavedCategory[]>(key);
      queryClient.setQueryData<SharedSavedCategory[]>(key, (old) =>
        (old ?? []).map((category) =>
          category.id === params.sharedCategoryId ? { ...category, liked: params.nextLiked } : category,
        ),
      );

      setSelectedCategory((previousSelected) =>
        previousSelected && previousSelected.id === params.sharedCategoryId
          ? { ...previousSelected, liked: params.nextLiked }
          : previousSelected,
      );

      return { previous, key };
    },
    onError: (error, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
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
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.search(keyword) });
    },
  });

  const handleToggleLike = (categoryId: string, currentLiked: boolean) => {
    if (!isAuthenticated) {
      toast.error('로그인 후 이용할 수 있는 기능입니다.');
      return;
    }
    if (!token) {
      toast.error('인증 토큰이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    if (toggleLikeMutation.isPending) return;

    toggleLikeMutation.mutate({ sharedCategoryId: categoryId, nextLiked: !currentLiked });

    setLikePulse((prev) => ({ ...prev, [categoryId]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [categoryId]: false }));
    }, 200);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-row gap-3 items-stretch">
              <div className="flex-1 flex gap-2">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={inputKeyword}
                    onChange={(event) => setInputKeyword(event.target.value)}
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

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">검색 결과</h2>
              <span className="text-xs text-muted-foreground">
                {filteredCategories.length}개
              </span>
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
                        if (!isAuthenticated) {
                          toast.error('로그인 후 이용할 수 있는 기능입니다.');
                          return;
                        }
                        handleToggleLike(category.id, category.liked);
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
    </div>
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
            {/* UserRequest: 보관함 카테고리 상세 다이얼로그와 동일한 구조로 지도/장소 목록 표시 (지도는 임시 영역) */}
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

export default SearchResult;
