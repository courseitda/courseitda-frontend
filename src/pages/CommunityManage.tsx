import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Folder, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { communityApi } from '@/services/api';
import { Spinner } from '@/components/ui/spinner';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { COMMUNITY_QUERY_KEYS, useMySharedCategories } from '@/shared/hooks/use-community';
import PageHeader from '@/components/layout/page-header';

/**
 * 커뮤니티 관리 페이지 - 회원만 접근 가능, 보관 카테고리를 공유/삭제 관리
 * UserRequest: 커뮤니티 관리 페이지를 추가하고 보관 카테고리 공유/삭제 동선을 제공
 */
const CommunityManage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: savedCategories = [],
    isLoading: savedCategoriesLoading,
    error: savedCategoriesError,
  } = useMySavedCategories(token);

  const {
    data: mySharedCategories = [],
    isLoading: mySharedCategoriesLoading,
    error: mySharedCategoriesError,
  } = useMySharedCategories(token);

  // 로그인되지 않은 경우 관리 페이지 접근을 차단하고 인증 화면으로 이동
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const sharedBySavedId = useMemo(
    () => new Set(mySharedCategories.map((category) => category.savedCategoryId)),
    [mySharedCategories],
  );

  const shareMutation = useMutation({
    mutationFn: async (savedCategoryId: string) => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }
      const response = await communityApi.shareSavedCategory(token, savedCategoryId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '카테고리 공유에 실패했습니다.');
      }
      return response.data.sharedCategory;
    },
    onSuccess: (sharedCategory) => {
      toast.success('커뮤니티에 공유했어요.');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      return sharedCategory;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '카테고리 공유에 실패했습니다.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sharedCategoryId: string) => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }
      const response = await communityApi.deleteMySharedCategory(token, sharedCategoryId);
      if (!response.success) {
        throw new Error(response.error?.message ?? '공유 카테고리 삭제에 실패했습니다.');
      }
      return sharedCategoryId;
    },
    onSuccess: () => {
      toast.success('공유 카테고리를 삭제했어요.');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '공유 카테고리 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  if (savedCategoriesLoading || mySharedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (savedCategoriesError || mySharedCategoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            커뮤니티 관리 정보를 불러오지 못했습니다.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title="커뮤니티 관리" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">보관 카테고리 공유</h2>
          </div>
          {savedCategories.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                공유할 보관 카테고리가 없습니다. 워크스페이스에서 카테고리를 먼저 만들어주세요.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedCategories.map((category) => {
                const alreadyShared = sharedBySavedId.has(category.id);
                return (
                  <Card key={category.id} className="hover-lift">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{category.title}</CardTitle>
                        <CardDescription className="text-xs">
                          장소 {category.placeCount}개 · 최근 수정{' '}
                          {new Date(category.updatedAt).toLocaleDateString('ko-KR')}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyShared ? 'outline' : 'default'}
                        disabled={alreadyShared || shareMutation.isPending}
                        onClick={() => shareMutation.mutate(category.id)}
                        className="gap-1"
                      >
                        <Upload className="w-4 h-4" />
                        {alreadyShared ? '공유됨' : '공유하기'}
                      </Button>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">내가 공유한 카테고리</h2>
          </div>
          {mySharedCategories.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                공유한 카테고리가 없습니다. 보관 카테고리를 먼저 공유해보세요.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySharedCategories.map((category) => (
                <Card key={category.id} className="hover-lift">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{category.title}</CardTitle>
                      <CardDescription className="text-xs">
                        장소 {category.placeCount}개 · 업로드{' '}
                        {new Date(category.uploadedAt).toLocaleDateString('ko-KR')}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CommunityManage;
