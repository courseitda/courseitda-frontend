import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Folder, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { communityApi } from '@/services/api';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useMySharedCategories } from '@/shared/hooks/use-community';
import PageHeader from '@/components/layout/page-header';

/**
 * 커뮤니티 관리 페이지 - 회원만 접근 가능, 보관 카테고리를 공유/삭제 관리
 * UserRequest: 커뮤니티 관리 페이지를 추가하고 보관 카테고리 공유/삭제 동선을 제공
 */
const MyPosts = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const queryClient = useQueryClient();

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

  if (mySharedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (mySharedCategoriesError) {
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
      <PageHeader title="내 게시물" />

      <main className="min-h-[calc(100vh-72px)] flex flex-col pt-6 pb-6 md:pt-8 md:pb-8">
        <div className="container mx-auto px-4 mt-6">
          {/* UserRequest: 커뮤니티 카테고리 게시판의 회색 박스 영역처럼 컨테이너를 구성 */}
          <div className="relative max-w-6xl mx-auto">
            {/* UserRequest: 배지는 영역 뒤에 두고, 겹치는 부분은 회색 영역이 위로 보이도록 처리 */}
            <div className="absolute -top-8 left-3 h-12 w-40 rounded-t-2xl bg-muted border border-border/60 z-0 flex items-start justify-center pt-1 text-sm font-semibold text-foreground">
              공유한 카테고리
            </div>
            <section className="relative z-10 rounded-2xl bg-muted border border-border/60 p-3 md:p-4">
              <div className="space-y-3">
              <div className="h-[75vh] overflow-y-auto pr-1">
                {mySharedCategories.length === 0 ? (
                  <Card className="h-full">
                  <CardContent className="h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground text-center">
                    {/* UserRequest: 공유한 카테고리가 없을 때 공유 아이콘 표시 */}
                    <Upload className="h-[72px] w-[72px] text-muted-foreground/60 md:h-[96px] md:w-[96px] lg:h-[120px] lg:w-[120px]" />
                    <div>
                      공유한 카테고리가 없습니다.
                      <br />
                      내 카테고리를 공유해보세요.
                    </div>
                  </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 items-start auto-rows-min">
                    {mySharedCategories.map((category) => (
                      <Card key={category.id} className="hover-lift">
                        <CardHeader className="flex flex-row items-center gap-3 py-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                              <Folder className="w-4 h-4" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                              {category.placeCount}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{category.title}</CardTitle>
                            <CardDescription className="text-xs">
                              업로드 {new Date(category.uploadedAt).toLocaleDateString('ko-KR')}
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
              </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyPosts;
