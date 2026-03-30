import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Folder, FolderDown, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth-store';
import {
  MY_STORAGE_QUERY_KEYS,
  useMySavedCategories,
  useSavedCategoryPlaces,
} from '@/shared/hooks/use-my-storage';
import {
  COMMUNITY_QUERY_KEYS,
  useMyLikedSharedCategories,
} from '@/shared/hooks/use-community';
import { categoryApi, communityApi, myStorageApi, placeApi } from '@/services/api';
import { getCategoryColors, type PaletteMode } from '@/shared/constants/colors';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { MESSAGES } from '@/shared/constants/messages';
import type { Category, SavedCategory, SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

type ImportTab = 'archive' | 'favorite';

const toImportTarget = (
  category: SavedCategory,
  places: SavedCategory['places'],
): ImportTarget => ({
  id: category.id,
  title: category.title,
  places: places.map((place) => ({
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName ?? null,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

const toSharedImportTarget = (
  category: SharedSavedCategory,
  places: SharedSavedCategory['places'],
): ImportTarget => ({
  id: category.id,
  title: category.title,
  places: places.map((place) => ({
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName ?? null,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

// UserRequest: 보관함/찜한 컬렉션을 워크스페이스로 불러오는 다이얼로그를 탭 구조로 제공한다.
export const ImportCategoryDialog = ({
  open,
  onOpenChange,
  workspaceIdentifier,
  categories,
}: ImportCategoryDialogProps) => {
  const token = useAuthStore((state) => state.token);
  const { colorPaletteMode } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<ImportTab>('archive');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedLikedCategoryPlaces, setExpandedLikedCategoryPlaces] = useState<SharedSavedCategory['places']>([]);
  const [expandedLikedCategoryPlacesLoading, setExpandedLikedCategoryPlacesLoading] = useState(false);
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
  } = useMyLikedSharedCategories(token);
  const {
    data: expandedSavedCategoryPlaces = [],
    isLoading: expandedSavedCategoryPlacesLoading,
    error: expandedSavedCategoryPlacesError,
  } = useSavedCategoryPlaces(token, activeTab === 'archive' ? expandedCategoryId : null);

  useEffect(() => {
    if (savedError) toast.error(savedError.message);
  }, [savedError]);

  useEffect(() => {
    // UserRequest: 찜한 컬렉션 목록 조회 실패를 즉시 안내한다.
    if (likedError) toast.error(likedError.message);
  }, [likedError]);

  useEffect(() => {
    // UserRequest: 보관 컬렉션 펼침 시 상세 API 조회 실패를 즉시 안내한다.
    if (expandedSavedCategoryPlacesError) toast.error(expandedSavedCategoryPlacesError.message);
  }, [expandedSavedCategoryPlacesError]);

  useEffect(() => {
    if (!open) {
      setActiveTab('archive');
      setExpandedCategoryId(null);
      setExpandedLikedCategoryPlaces([]);
      setExpandedLikedCategoryPlacesLoading(false);
    }
  }, [open]);

  useEffect(() => {
    // UserRequest: 찜 탭에서 컬렉션을 펼치면 공유 카테고리 상세 API로 장소 목록을 조회한다.
    if (activeTab !== 'favorite' || !expandedCategoryId || !token) {
      setExpandedLikedCategoryPlaces([]);
      setExpandedLikedCategoryPlacesLoading(false);
      return;
    }

    let isMounted = true;

    const fetchExpandedLikedCategoryPlaces = async () => {
      setExpandedLikedCategoryPlacesLoading(true);

      try {
        const places = await queryClient.fetchQuery({
          queryKey: [...COMMUNITY_QUERY_KEYS.detail(expandedCategoryId), token],
          queryFn: async () => {
            const response = await communityApi.getSharedCategoryDetail(expandedCategoryId);
            if (!response.success || !response.data) {
              throw new Error(response.error?.message ?? MESSAGES.sharedCategory.fetchDetailFailed);
            }

            return response.data.sharedCategories[0]?.places ?? [];
          },
          staleTime: 1000 * 30,
        });

        if (!isMounted) {
          return;
        }

        setExpandedLikedCategoryPlaces(places);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : MESSAGES.sharedCategory.fetchDetailFailed;
        setExpandedLikedCategoryPlaces([]);
        toast.error(message);
      } finally {
        if (isMounted) {
          setExpandedLikedCategoryPlacesLoading(false);
        }
      }
    };

    void fetchExpandedLikedCategoryPlaces();

    return () => {
      isMounted = false;
    };
  }, [activeTab, expandedCategoryId, queryClient, token]);

  const nextColor = useMemo(() => {
    const palette = getCategoryColors(colorPaletteMode as PaletteMode);
    const usedColors = new Set(categories.map((category) => category.color));
    return palette.find((color) => !usedColors.has(color)) ?? palette[0];
  }, [categories, colorPaletteMode]);

  const importMutation = useMutation({
    // UserRequest: 탭 종류와 관계없이 불러오기 직전 상세 API를 조회해 장소 목록 누락을 방지한다.
    mutationFn: async (categoryToImport: SavedCategory | SharedSavedCategory) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const target = 'uploadedAt' in categoryToImport
        ? toSharedImportTarget(
            categoryToImport,
            await queryClient.fetchQuery({
              queryKey: [...COMMUNITY_QUERY_KEYS.detail(categoryToImport.id), token],
              queryFn: async () => {
                const response = await communityApi.getSharedCategoryDetail(categoryToImport.id);
                if (!response.success || !response.data) {
                  throw new Error(response.error?.message ?? MESSAGES.sharedCategory.fetchDetailFailed);
                }

                return response.data.sharedCategories[0]?.places ?? [];
              },
              staleTime: 1000 * 30,
            }),
          )
        : toImportTarget(
            categoryToImport,
            await queryClient.fetchQuery({
              queryKey: MY_STORAGE_QUERY_KEYS.savedCategoryPlaces(categoryToImport.id),
              queryFn: async () => {
                const response = await myStorageApi.getSavedCategoryDetail(token, categoryToImport.id);
                if (!response.success || !response.data) {
                  throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
                }

                return response.data.category.places;
              },
              staleTime: 1000 * 30,
            }),
          );

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

  const handleTogglePlaces = (categoryId: string) => {
    // UserRequest: 현재 탭의 컬렉션 카드 클릭 시 장소 목록을 펼쳐서 확인할 수 있게 한다.
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleImport = (category: SavedCategory | SharedSavedCategory) => {
    if (importMutation.isPending) return;
    importMutation.mutate(category);
  };

  const renderPlaceList = (
    places: Array<{ id: string; name: string; addressName: string }>,
    loading: boolean,
    emptyMessage: string,
  ) => {
    if (loading) {
      return <div className="py-4 text-sm text-muted-foreground">{UI_COPY.common.loading}</div>;
    }

    if (places.length === 0) {
      return <div className="py-4 text-sm text-muted-foreground">{emptyMessage}</div>;
    }

    return (
      <div className="space-y-2">
        {places.map((place) => (
          <div key={place.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="flex-1 min-w-0 break-words leading-snug">{place.name}</span>
            </div>
            <p className="text-xs text-muted-foreground break-words leading-snug">{place.addressName}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderImportList = (
    items: Array<SavedCategory | SharedSavedCategory>,
    emptyMessage: string,
  ) => {
    if (items.length === 0) {
      return (
        <div className={`${listViewportClassName} flex items-center justify-center text-sm text-muted-foreground`}>
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className={`${listViewportClassName} overflow-y-auto overflow-x-visible space-y-2 px-1 py-1`}>
        {items.map((category) => {
          const isSharedCategory = 'uploadedAt' in category;
          const isExpanded = expandedCategoryId === category.id;

          return (
            <Card key={category.id} className="transition-colors hover:bg-muted/20">
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
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </CardHeader>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border/60">
                  {isSharedCategory
                    ? renderPlaceList(
                        expandedLikedCategoryPlaces.map((place) => ({
                          id: place.id,
                          name: place.name,
                          addressName: place.addressName,
                        })),
                        expandedLikedCategoryPlacesLoading,
                        UI_COPY.importCategoryDialog.favoriteEmpty,
                      )
                    : renderPlaceList(
                        expandedSavedCategoryPlaces.map((place) => ({
                          id: place.id,
                          name: place.name,
                          addressName: place.addressName,
                        })),
                        expandedSavedCategoryPlacesLoading,
                        UI_COPY.importCategoryDialog.savedEmpty,
                      )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // UserRequest: 화면 크기에 따라 비율로 보정되도록 목록 영역 높이를 반응형으로 고정
  const listViewportClassName = 'h-[55vh] min-h-72 max-h-96';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{UI_COPY.importCategoryDialog.title}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as ImportTab);
            setExpandedCategoryId(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archive" className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              {UI_COPY.importCategoryDialog.savedTab}
            </TabsTrigger>
            <TabsTrigger value="favorite" className="flex items-center gap-1.5">
              <Heart className={`w-4 h-4 ${activeTab === 'favorite' ? 'like-heart' : ''}`} />
              {UI_COPY.importCategoryDialog.favoriteTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="archive" className="mt-4">
            {savedLoading
              ? (
                <div className={`${listViewportClassName} flex items-center justify-center text-sm text-muted-foreground`}>
                  {UI_COPY.common.loading}
                </div>
              )
              : renderImportList(savedCategories, UI_COPY.importCategoryDialog.savedEmpty)}
          </TabsContent>

          <TabsContent value="favorite" className="mt-4">
            {likedLoading
              ? (
                <div className={`${listViewportClassName} flex items-center justify-center text-sm text-muted-foreground`}>
                  {UI_COPY.common.loading}
                </div>
              )
              : renderImportList(likedCategories, UI_COPY.importCategoryDialog.favoriteEmpty)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
