import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { useLikedSharedCategories } from '@/shared/hooks/use-community';
import { categoryApi, placeApi } from '@/services/api';
import { getCategoryColors, type PaletteMode } from '@/shared/constants/colors';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { Category, SavedCategory, SharedSavedCategory } from '@/entities/types';

type ImportCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceIdentifier: string;
  categories: Category[];
};

type ImportTarget = {
  id: string;
  title: string;
  places: Array<{
    name: string;
    placeUrl: string;
    roadAddressName: string | null;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

const toImportTarget = (category: SavedCategory | SharedSavedCategory): ImportTarget => ({
  id: category.id,
  title: category.title,
  places: category.places.map((place) => ({
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName ?? null,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

// UserRequest: 보관함/찜 카테고리를 워크스페이스로 불러오는 다이얼로그 추가
export const ImportCategoryDialog = ({
  open,
  onOpenChange,
  workspaceIdentifier,
  categories,
}: ImportCategoryDialogProps) => {
  const token = useAuthStore((state) => state.token);
  const { colorPaletteMode } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'saved' | 'liked'>('saved');
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  const {
    data: savedCategories = [],
    isLoading: savedLoading,
    error: savedError,
  } = useMySavedCategories(token);
  const {
    data: likedCategories = [],
    isLoading: likedLoading,
    error: likedError,
  } = useLikedSharedCategories(token);

  useEffect(() => {
    if (savedError) toast.error(savedError.message);
  }, [savedError]);

  useEffect(() => {
    if (likedError) toast.error(likedError.message);
  }, [likedError]);

  const nextColor = useMemo(() => {
    const palette = getCategoryColors(colorPaletteMode as PaletteMode);
    const usedColors = new Set(categories.map((category) => category.color));
    return palette.find((color) => !usedColors.has(color)) ?? palette[0];
  }, [categories, colorPaletteMode]);

  const importMutation = useMutation({
    mutationFn: async (target: ImportTarget) => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }

      const { category, error } = await categoryApi.add({
        workspaceIdentifier,
        name: target.title,
        color: nextColor,
      });
      if (!category || error) {
        throw new Error(error || '카테고리 불러오기에 실패했습니다.');
      }

      if (target.places.length > 0) {
        const results = await Promise.all(
          target.places.map((place) =>
            placeApi.addToCategory(token, category.id, {
              name: place.name,
              placeUrl: place.placeUrl,
              roadAddressName: place.roadAddressName,
              addressName: place.addressName,
              lat: place.latitude,
              lng: place.longitude,
            }),
          ),
        );
        const failed = results.find((result) => !result.success);
        if (failed) {
          throw new Error(failed.error?.message ?? '장소 불러오기에 실패했습니다.');
        }
      }

      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('카테고리를 불러왔습니다.');
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '카테고리 불러오기에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleImport = (category: SavedCategory | SharedSavedCategory) => {
    if (importMutation.isPending) return;
    importMutation.mutate(toImportTarget(category));
  };

  const isBusy = savedLoading || likedLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>카테고리 불러오기</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'saved' | 'liked')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved" className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              내 보관함
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              찜
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-4">
            {isBusy ? (
              <div className="text-sm text-muted-foreground">불러오는 중...</div>
            ) : savedCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">내 보관함에 카테고리가 없습니다.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {savedCategories.map((category) => (
                  <Card key={category.id} className="hover-lift">
                    <CardHeader className="flex flex-row items-center gap-3 py-3">
                      {/* UserRequest: 카테고리 페이지와 동일하게 폴더 아이콘 위에 장소 수 배지 표시 */}
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
                      <Button size="sm" className="h-10 px-4" onClick={() => handleImport(category)} disabled={importMutation.isPending}>
                        불러오기
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            {isBusy ? (
              <div className="text-sm text-muted-foreground">불러오는 중...</div>
            ) : likedCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">찜한 카테고리가 없습니다.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {likedCategories.map((category) => (
                  <Card key={category.id} className="hover-lift">
                    <CardHeader className="flex flex-row items-center gap-3 py-3">
                      {/* UserRequest: 카테고리 페이지와 동일하게 폴더 아이콘 위에 장소 수 배지 표시 */}
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
                      <Button size="sm" className="h-10 px-4" onClick={() => handleImport(category)} disabled={importMutation.isPending}>
                        불러오기
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
