import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Folder, FolderDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMySavedCategories } from '@/shared/hooks/use-my-storage';
import { categoryApi, placeApi } from '@/services/api';
import { getCategoryColors, type PaletteMode } from '@/shared/constants/colors';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { MESSAGES } from '@/shared/constants/messages';
import type { Category, SavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

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

const toImportTarget = (category: SavedCategory): ImportTarget => ({
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

// UserRequest: 보관함 카테고리를 워크스페이스로 불러오는 다이얼로그 추가
export const ImportCategoryDialog = ({
  open,
  onOpenChange,
  workspaceIdentifier,
  categories,
}: ImportCategoryDialogProps) => {
  const token = useAuthStore((state) => state.token);
  const { colorPaletteMode } = useSettingsStore();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  const {
    data: savedCategories = [],
    isLoading: savedLoading,
    error: savedError,
  } = useMySavedCategories(token);

  useEffect(() => {
    if (savedError) toast.error(savedError.message);
  }, [savedError]);

  const nextColor = useMemo(() => {
    const palette = getCategoryColors(colorPaletteMode as PaletteMode);
    const usedColors = new Set(categories.map((category) => category.color));
    return palette.find((color) => !usedColors.has(color)) ?? palette[0];
  }, [categories, colorPaletteMode]);

  const importMutation = useMutation({
    mutationFn: async (target: ImportTarget) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const { category, error } = await categoryApi.add({
        workspaceIdentifier,
        name: target.title,
        color: nextColor,
      });
      if (!category || error) {
        throw new Error(error || MESSAGES.workspaceCategory.importFailed);
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
          throw new Error(failed.error?.message ?? MESSAGES.workspaceCategory.placeImportFailed);
        }
      }

      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(MESSAGES.workspaceCategory.importSuccess);
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.workspaceCategory.importFailed;
      toast.error(message);
    },
  });

  const handleImport = (category: SavedCategory) => {
    if (importMutation.isPending) return;
    importMutation.mutate(toImportTarget(category));
  };

  const handleTogglePlaces = (categoryId: string) => {
    // UserRequest: 카테고리 클릭 시 포함된 장소 목록을 펼쳐서 확인 가능하도록 처리
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  // UserRequest: 화면 크기에 따라 비율로 보정되도록 목록 영역 높이를 반응형으로 고정
  const listViewportClassName = 'h-[55vh] min-h-72 max-h-96';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{UI_COPY.importCategoryDialog.title}</DialogTitle>
        </DialogHeader>

        {savedLoading ? (
          <div className={`${listViewportClassName} flex items-center justify-center text-sm text-muted-foreground`}>
            {UI_COPY.common.loading}
          </div>
        ) : savedCategories.length === 0 ? (
          <div className={`${listViewportClassName} flex items-center justify-center text-sm text-muted-foreground`}>
            {UI_COPY.importCategoryDialog.savedEmpty}
          </div>
        ) : (
          <div className={`${listViewportClassName} overflow-y-auto overflow-x-visible space-y-2 px-1 py-1`}>
            {savedCategories.map((category) => (
              <Card key={category.id} className="transition-colors hover:bg-muted/20">
                <CardHeader
                  className="flex flex-row items-center gap-3 py-3 cursor-pointer"
                  onClick={() => handleTogglePlaces(category.id)}
                >
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs font-medium text-muted-foreground border border-border rounded-md bg-muted/20 hover:bg-muted/40 hover:text-foreground hover:underline underline-offset-4 inline-flex items-center gap-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleImport(category);
                    }}
                    disabled={importMutation.isPending}
                  >
                    <FolderDown className="h-3.5 w-3.5" />
                    {UI_COPY.common.add}
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
                            <span className="flex-1 min-w-0 break-words leading-snug">{place.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground break-words leading-snug">{place.addressName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
