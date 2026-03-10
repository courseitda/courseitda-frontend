import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Folder, GitFork, MoreHorizontal, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { communityApi } from '@/services/api';
import { Spinner } from '@/components/ui/spinner';
import { COMMUNITY_QUERY_KEYS, useMySharedCategories } from '@/shared/hooks/use-community';
import { useMySavedCategories, useToggleSharedCategoryFork } from '@/shared/hooks/use-my-storage';
import { useUserNickname } from '@/shared/hooks/use-user-info';
import { MESSAGES } from '@/shared/constants/messages';
import PageHeader from '@/components/layout/page-header';
import { UploadCategoryDialog } from '@/features/community/upload-category-dialog';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import SharedCategoryList from '@/components/community/shared-category-list';
import type { SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 커뮤니티 관리 페이지 - 회원만 접근 가능, 보관 카테고리를 공유/삭제 관리
 * UserRequest: 커뮤니티 관리 페이지를 추가하고 보관 카테고리 공유/삭제 동선을 제공
 */
const MyPosts = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: savedCategories = [] } = useMySavedCategories(token);
  const { nickname } = useUserNickname();
  const toggleForkMutation = useToggleSharedCategoryFork(token);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SharedSavedCategory | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<SharedSavedCategory | null>(null);

  const {
    data: mySharedCategories = [],
    isLoading: mySharedCategoriesLoading,
    error: mySharedCategoriesError,
  } = useMySharedCategories(token);

  const forkedSharedCategoryMap = savedCategories.reduce<Record<string, boolean>>(
    (accumulator, savedCategory) => {
      if (savedCategory.forkedFromSharedCategoryId) {
        accumulator[savedCategory.forkedFromSharedCategoryId] = true;
      }
      return accumulator;
    },
    {},
  );

  // 로그인되지 않은 경우 관리 페이지 접근을 차단하고 인증 화면으로 이동
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleOpenDetail = (category: SharedSavedCategory) => {
    // UserRequest: 업로드한 카테고리 클릭 시 카테고리 게시판과 동일한 상세 팝업 표시
    void (async () => {
      const response = await communityApi.getSharedCategoryDetail(category.id);
      if (!response.success || !response.data) {
        toast.error(response.error?.message ?? MESSAGES.sharedCategory.fetchDetailFailed);
        return;
      }

      const shared = response.data.sharedCategories[0];
      if (!shared) {
        toast.error(MESSAGES.sharedCategory.fetchDetailFailed);
        return;
      }

      const uploader =
        shared.uploaderNickname === 'me'
          ? nickname ?? (category.uploader === 'me' ? shared.uploaderNickname : category.uploader)
          : shared.uploaderNickname;

      setSelectedCategory({
        id: shared.id,
        title: shared.title,
        uploader,
        uploadedAt: shared.uploadedAt,
        isImmutableSnapshot: true,
        forkCount: shared.forkCount,
        placeCount: shared.placeCount,
        places: shared.places,
      });
      setDetailOpen(true);
    })();
  };

  useEffect(() => {
    if (!nickname) return;
    setSelectedCategory((current) => {
      if (!current || current.uploader !== 'me') return current;
      return { ...current, uploader: nickname };
    });
  }, [nickname]);

  const deleteMutation = useMutation({
    mutationFn: async (sharedCategoryId: string) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }
      const response = await communityApi.deleteMySharedCategory(token, sharedCategoryId);
      if (!response.success) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.deleteFailed);
      }
      return sharedCategoryId;
    },
    onSuccess: () => {
      toast.success(MESSAGES.sharedCategory.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      setDeleteAlertOpen(false);
      setSelectedForDelete(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.sharedCategory.deleteFailed;
      toast.error(message);
    },
  });

  const handleRequestDelete = (category: SharedSavedCategory) => {
    // UserRequest: 삭제는 즉시 실행하지 않고 확인 다이얼로그를 통해 진행
    setSelectedForDelete(category);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedForDelete || deleteMutation.isPending) return;
    deleteMutation.mutate(selectedForDelete.id);
  };

  const handleFork = async (category: SharedSavedCategory) => {
    // UserRequest: 상세 모달의 fork 아이콘을 누르면 내 카테고리로 복사
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
            {MESSAGES.sharedCategory.myPostsLoadFailed}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>{UI_COPY.common.retry}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title={UI_COPY.myPosts.pageTitle} />

      <main className="min-h-[calc(100vh-72px)] flex flex-col pt-6 pb-6 md:pt-8 md:pb-8">
        <div className="container mx-auto px-4 mt-2">
          {/* UserRequest: 커뮤니티 카테고리 게시판의 회색 박스 영역처럼 컨테이너를 구성 */}
          <div className="relative max-w-6xl mx-auto">
            <section className="relative z-10 rounded-2xl bg-muted/30 border border-border/60 p-3 md:p-4">
              <div className="space-y-3">
                {/* UserRequest: 영역 내부 상단에 '공유한 카테고리' 라벨 표시 */}
                {/* UserRequest: 제목과 공유 버튼을 한 줄로 정렬 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">{UI_COPY.myPosts.sectionTitle}</div>
                  {/* UserRequest: 업로드하기 버튼 클릭 시 업로드 팝업을 노출 */}
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4" />
                    {UI_COPY.myPosts.uploadAction}
                  </Button>
                </div>

                <div className="h-[75vh] overflow-y-auto pr-1">
                  {mySharedCategories.length === 0 ? (
                    <Card className="h-full">
                      <CardContent className="h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground text-center">
                        {/* UserRequest: 공유한 카테고리가 없을 때 공유 아이콘 표시 */}
                        <Upload className="h-[72px] w-[72px] text-muted-foreground/60 md:h-[96px] md:w-[96px] lg:h-[120px] lg:w-[120px]" />
                        <div>
                          {UI_COPY.myPosts.empty.title}
                          <br />
                          {UI_COPY.myPosts.empty.description}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <SharedCategoryList
                      categories={mySharedCategories}
                      forkedSharedCategoryMap={forkedSharedCategoryMap}
                      onOpenDetail={handleOpenDetail}
                      viewportClassName="h-[75vh]"
                      renderTrailingAction={(category) => (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full"
                              onClick={(event) => event.stopPropagation()}
                              aria-label="게시물 더보기"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive gap-2"
                              disabled={deleteMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRequestDelete(category);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      </div>

      <UploadCategoryDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
      <SharedCategoryDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        category={selectedCategory}
        isForked={savedCategories.some((savedCategory) => savedCategory.forkedFromSharedCategoryId === selectedCategory?.id)}
        onToggleFork={handleFork}
        forkPending={toggleForkMutation.isPending}
      />
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.myPosts.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedForDelete && (
                <>
                  {UI_COPY.myPosts.deleteDialog.description(selectedForDelete.title)}
                  <br />
                  <span className="text-destructive">{UI_COPY.myPosts.deleteDialog.warning}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{UI_COPY.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? UI_COPY.common.deleting : UI_COPY.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyPosts;
