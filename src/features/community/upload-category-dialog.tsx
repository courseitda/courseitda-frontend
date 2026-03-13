import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, ChevronDown, Folder, MapPin, Megaphone, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { useSavedCategoryDetail } from '@/shared/hooks/use-my-storage';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { communityApi } from '@/services/api';
import type { SavedCategory } from '@/entities/types';

type UploadCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// UserRequest: 내 게시물 업로드 팝업은 보관 카테고리만 노출
export const UploadCategoryDialog = ({ open, onOpenChange }: UploadCategoryDialogProps) => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const {
    data: savedCategories = [],
    isLoading,
    error,
  } = useMySavedCategories(token, 15);
  const {
    data: expandedCategoryDetail,
    isLoading: isExpandedCategoryLoading,
    error: expandedCategoryError,
  } = useSavedCategoryDetail(token, expandedCategoryId ?? undefined);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (expandedCategoryError) {
      toast.error(expandedCategoryError.message);
    }
  }, [expandedCategoryError]);

  const shareMutation = useMutation({
    mutationFn: async (savedCategoryId: string) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }
      const response = await communityApi.shareSavedCategory(token, savedCategoryId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.uploadFailed);
      }
      return response.data.sharedCategory;
    },
    onSuccess: () => {
      toast.success(MESSAGES.sharedCategory.uploadSuccess);
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      onOpenChange(false);
    },
    onError: (uploadError) => {
      const message = uploadError instanceof Error ? uploadError.message : MESSAGES.sharedCategory.uploadFailed;
      toast.error(message);
    },
  });

  const handleTogglePlaces = (categoryId: string) => {
    // UserRequest: 카테고리 클릭 시 상세 조회 API를 기준으로 내부 장소를 확인하도록 처리
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleUpload = (category: SavedCategory) => {
    if (shareMutation.isPending) return;
    if (!category.canPublish) {
      toast.error('공유 카테고리를 복사한 직후에는 다시 게시할 수 없습니다.');
      return;
    }
    shareMutation.mutate(category.id);
  };

  const handleMoveToMyCategory = () => {
    // UserRequest: 업로드 가능한 카테고리가 없을 때 내 카테고리 페이지로 바로 이동할 수 있게 연결한다.
    onOpenChange(false);
    navigate('/my-category');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[65vh] flex flex-col px-4 py-5 sm:p-6">
        <DialogHeader className="space-y-6">
          <DialogTitle>{UI_COPY.uploadCategoryDialog.title}</DialogTitle>
          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Megaphone className="h-3.5 w-3.5" />
              안내
            </span>
            <p className="text-sm text-muted-foreground">
              복사한 카테고리는 수정 후 업로드할 수 있어요!
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-visible pr-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">{UI_COPY.common.loading}</div>
          ) : savedCategories.length === 0 ? (
            <div className="flex h-[90%] min-h-[90%] items-center justify-center px-1 py-1">
              {/* UserRequest: 업로드 가능한 보관 카테고리가 없을 때도 다이얼로그 안에 빈 상태 영역과 안내 문구를 표시한다. */}
              <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-5 text-center sm:p-8">
                <Folder className="mb-3 h-9 w-9 text-muted-foreground/60 sm:h-10 sm:w-10" />
                {/* UserRequest: 업로드 불가 안내 문구를 3줄 구조와 내 카테고리 바로가기 액션으로 교체한다. */}
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm">업로드 할 카테고리가 없습니다.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">내 카테고리에서 먼저 만들어보세요.</p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 inline-flex h-auto max-w-full flex-wrap items-center justify-center gap-1 whitespace-normal p-0 text-center text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"
                  onClick={handleMoveToMyCategory}
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  내 카테고리 만들러 가기
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 px-1 py-1">
              {savedCategories.map((category) => (
                <Card key={category.id} className="transition-colors hover:bg-muted/20">
                  {/* UserRequest: 카테고리 업로드 카드에서 아이콘, 제목, 업로드 버튼을 모바일 포함 가로 1열로 정렬한다. */}
                  <CardHeader
                    className="flex flex-row cursor-pointer items-center gap-3 space-y-0 py-3"
                    onClick={() => handleTogglePlaces(category.id)}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                        {category.placeCount}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm sm:text-base">{category.title}</CardTitle>
                      {!category.canPublish && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          수정 필요
                        </p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs font-medium text-muted-foreground border border-border rounded-md bg-muted/20 hover:bg-muted/40 hover:text-foreground hover:underline underline-offset-4 inline-flex items-center gap-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpload(category);
                        }}
                        disabled={shareMutation.isPending || !category.canPublish}
                      >
                        <Upload className="w-4 h-4" />
                        {UI_COPY.common.upload}
                      </Button>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expandedCategoryId === category.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CardHeader>
                  {expandedCategoryId === category.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/60">
                      {isExpandedCategoryLoading ? (
                        // 상세 조회 API 응답 대기 중에는 확장 영역에서 즉시 로딩 상태를 보여준다.
                        <div className="text-sm text-muted-foreground">{UI_COPY.common.loading}</div>
                      ) : (
                        <div className="space-y-2">
                          {(expandedCategoryDetail?.places ?? []).map((place) => (
                            <div key={place.id} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="truncate">{place.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
