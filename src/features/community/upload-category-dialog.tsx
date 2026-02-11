import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Folder, MapPin, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';
import { communityApi } from '@/services/api';
import type { SavedCategory } from '@/entities/types';

type UploadCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// UserRequest: 내 게시물 업로드 팝업은 보관 카테고리만 노출하고 찜 카테고리는 제외
export const UploadCategoryDialog = ({ open, onOpenChange }: UploadCategoryDialogProps) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const {
    data: savedCategories = [],
    isLoading,
    error,
  } = useMySavedCategories(token);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const shareMutation = useMutation({
    mutationFn: async (savedCategoryId: string) => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }
      const response = await communityApi.shareSavedCategory(token, savedCategoryId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '카테고리 업로드에 실패했습니다.');
      }
      return response.data.sharedCategory;
    },
    onSuccess: () => {
      toast.success('커뮤니티에 업로드했어요.');
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      onOpenChange(false);
    },
    onError: (uploadError) => {
      const message = uploadError instanceof Error ? uploadError.message : '카테고리 업로드에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleTogglePlaces = (categoryId: string) => {
    // UserRequest: 카테고리 클릭 시 포함된 장소 목록을 펼쳐서 확인 가능하도록 처리
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleUpload = (category: SavedCategory) => {
    if (shareMutation.isPending) return;
    shareMutation.mutate(category.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[65vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>카테고리 업로드</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-visible pr-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중...</div>
          ) : savedCategories.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              업로드할 카테고리가 없습니다. 내 카테고리에서 먼저 만들어주세요.
            </div>
          ) : (
            <div className="space-y-2 px-1">
              {savedCategories.map((category) => (
                <Card key={category.id} className="hover-lift">
                  <CardHeader
                    className="flex flex-row items-center gap-3 py-3 cursor-pointer"
                    onClick={() => handleTogglePlaces(category.id)}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                        {category.placeCount}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{category.title}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-4 border-primary text-primary hover:bg-primary/5 gap-1.5"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleUpload(category);
                      }}
                      disabled={shareMutation.isPending}
                    >
                      <Upload className="w-4 h-4" />
                      업로드
                    </Button>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedCategoryId === category.id ? 'rotate-180' : ''}`}
                    />
                  </CardHeader>
                  {expandedCategoryId === category.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/60">
                      <div className="space-y-2">
                        {category.places.map((place) => (
                          <div key={place.id} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="truncate">{place.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                          </div>
                        ))}
                      </div>
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
