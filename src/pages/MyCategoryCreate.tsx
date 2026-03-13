import { useEffect, useState } from 'react';
import { useBeforeUnload, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/page-header';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import UserMenu from '@/components/header/user-menu';
import { placeApi } from '@/services/api';
import type { SearchedPlace } from '@/entities/types';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useCreateSavedCategory } from '@/shared/hooks/use-my-storage';
import { useAuthStore } from '@/shared/stores/auth-store';
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
import { MapPin, PenLine, Search, X } from 'lucide-react';
import { toast } from 'sonner';

type MyCategoryCreateLocationState = {
  draftTitle?: string;
};

const MyCategoryCreate = () => {
  const CATEGORY_NAME_MAX_LENGTH = 10;
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  const createSavedCategoryMutation = useCreateSavedCategory(token);
  const locationState = (location.state as MyCategoryCreateLocationState | null) ?? null;
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [categoryTitle, setCategoryTitle] = useState(locationState?.draftTitle?.trim() ?? '');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<SearchedPlace[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SearchedPlace[]>([]);
  const [leaveAlertOpen, setLeaveAlertOpen] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const hasUnsavedChanges = categoryTitle.trim().length > 0 || selectedPlaces.length > 0;

  useBeforeUnload((event) => {
    if (!hasUnsavedChanges) return;

    // UserRequest: 생성 전용 페이지 작성 중 브라우저 이탈 시 저장되지 않은 내용 경고를 띄운다.
    event.preventDefault();
    event.returnValue = '';
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (locationState?.draftTitle?.trim()) {
      setCategoryTitle(locationState.draftTitle.trim());
      return;
    }

    toast.error(UI_COPY.myCategory.nameRequired);
    navigate('/my-category', { replace: true });
  }, [locationState?.draftTitle, navigate]);

  const handleChangeRenameTitle = (value: string) => {
    if (value.length > CATEGORY_NAME_MAX_LENGTH) {
      toast.error(UI_COPY.myCategory.nameMaxLength);
      return;
    }

    setRenameTitle(value);
  };

  const handleOpenRenameDialog = () => {
    setRenameTitle(categoryTitle);
    setRenameDialogOpen(true);
  };

  const handleRenameCategory = () => {
    if (!renameTitle.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }
    if (renameTitle.trim().length > CATEGORY_NAME_MAX_LENGTH) {
      toast.error(UI_COPY.myCategory.nameMaxLength);
      return;
    }

    // UserRequest: 생성 전용 페이지에서는 제목 수정도 API 호출 없이 로컬 상태로만 반영한다.
    setCategoryTitle(renameTitle.trim());
    setRenameDialogOpen(false);
  };

  const handleSearchPlaces = async () => {
    if (!placeQuery.trim()) {
      toast.error(UI_COPY.myCategory.placeSearchKeywordRequired);
      return;
    }

    setPlaceSearchLoading(true);
    const { searchedPlaces, error } = await placeApi.search({ keyword: placeQuery.trim() });
    if (error) {
      toast.error(error || MESSAGES.place.searchFailed);
      setPlaceResults([]);
    } else {
      setPlaceResults(searchedPlaces ?? []);
      if (!searchedPlaces || searchedPlaces.length === 0) {
        toast.info(UI_COPY.myCategory.placeSearchNoResult);
      }
    }
    setPlaceSearchLoading(false);
  };

  const handleAddPlace = (place: SearchedPlace) => {
    const exists = selectedPlaces.some((item) => item.id === place.id);
    if (exists) {
      toast.info(UI_COPY.myCategory.placeAlreadyAdded);
      return;
    }

    setSelectedPlaces((previous) => [...previous, place]);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((previous) => previous.filter((place) => place.id !== placeId));
    if (focusedPlaceId === placeId) {
      setFocusedPlaceId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryTitle.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }
    if (categoryTitle.trim().length > CATEGORY_NAME_MAX_LENGTH) {
      toast.error(UI_COPY.myCategory.nameMaxLength);
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error(UI_COPY.myCategory.atLeastOnePlace);
      return;
    }

    try {
      const createdCategory = await createSavedCategoryMutation.mutateAsync({
        title: categoryTitle.trim(),
        places: selectedPlaces,
      });

      navigate(`/my-category/${createdCategory.id}`, { replace: true });
    } catch {
      // UserRequest: 생성 실패 시 작성 중인 생성 전용 페이지를 유지한다.
    }
  };

  const handleAttemptLeave = (proceed: () => void) => {
    if (!hasUnsavedChanges) {
      proceed();
      return;
    }

    // UserRequest: 뒤로가기와 우측 상단 햄버거 메뉴 이동 시 저장되지 않은 내용 경고를 노출한다.
    setPendingNavigationAction(() => proceed);
    setLeaveAlertOpen(true);
  };

  const handleStayOnPage = () => {
    setLeaveAlertOpen(false);
    setPendingNavigationAction(null);
  };

  const handleLeavePage = () => {
    setLeaveAlertOpen(false);
    const action = pendingNavigationAction;
    setPendingNavigationAction(null);
    action?.();
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <PageHeader
        showBackButton
        showBrand={false}
        onBack={() => handleAttemptLeave(() => navigate(-1))}
        centerContent={(
          <div className="relative flex items-center justify-center min-w-0">
            <p className="max-w-[180px] text-center text-lg font-bold truncate md:max-w-[320px]">
              {categoryTitle}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-full ml-1 h-8 w-8 shrink-0"
              aria-label={UI_COPY.myCategory.detailDialog.renameAriaLabel}
              onClick={handleOpenRenameDialog}
            >
              <PenLine className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        )}
        rightContent={<UserMenu onBeforeNavigate={handleAttemptLeave} />}
      />

      <main className="space-y-2.5 pb-4 md:space-y-2.5 md:pb-4">
        <section className="rounded-none bg-card p-0 shadow-sm md:rounded-xl md:mx-4 md:p-4 md:container md:max-w-2xl">
          <CategoryPlacesMap
            open
            places={selectedPlaces.map((place) => ({
              id: place.id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
            }))}
            focusedPlaceId={focusedPlaceId}
          />
        </section>

        <div className="container mx-auto max-w-2xl px-4 pt-3 md:pt-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {UI_COPY.myCategory.detailDialog.editingPlaceListTitle}
                <span className="text-xs text-muted-foreground">
                  ({selectedPlaces.length}곳)
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  // UserRequest: 생성 전용 페이지에서는 장소를 1개 이상 추가해야 최종 생성 버튼이 활성화된다.
                  // UserRequest: 카테고리 생성 전용 페이지의 최종 제출 버튼 텍스트를 저장으로 변경한다.
                  onClick={() => void handleCreateCategory()}
                  disabled={createSavedCategoryMutation.isPending || selectedPlaces.length === 0}
                >
                  {createSavedCategoryMutation.isPending
                    ? UI_COPY.myCategory.editorDialog.saving
                    : UI_COPY.myCategory.editorDialog.save}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="max-h-[24vh] space-y-1 overflow-y-auto pr-1 md:max-h-[220px]">
                  {selectedPlaces.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center rounded-xl border-2 border-dashed border-border px-3 text-sm text-muted-foreground">
                      {UI_COPY.myCategory.editorDialog.noPlacesSelected}
                    </div>
                  ) : (
                    selectedPlaces.map((place) => (
                      <Card key={place.id} className="border-border bg-card shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <CardHeader className="flex-row items-center space-y-0 py-1.5">
                              <CardTitle className="text-base flex flex-1 items-center gap-1.5 truncate">
                                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                                <span className="truncate">{place.name}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-1.5">
                              <p className="text-sm text-muted-foreground truncate">{place.addressName}</p>
                            </CardContent>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="mr-2 shrink-0 self-center"
                            onClick={() => handleRemovePlace(place.id)}
                            aria-label={UI_COPY.myCategory.editorDialog.removePlaceAriaLabel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.placeSearchLabel}</p>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    className="min-w-0 flex-1"
                    placeholder={UI_COPY.myCategory.editorDialog.placeSearchPlaceholder}
                    value={placeQuery}
                    onChange={(event) => setPlaceQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSearchPlaces();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSearchPlaces()}
                    disabled={placeSearchLoading}
                    className="shrink-0 gap-2 px-3"
                  >
                    <Search className="w-4 h-4" />
                    {UI_COPY.myCategory.editorDialog.searchAction}
                  </Button>
                </div>
                {placeSearchLoading && (
                  <div className="text-sm text-muted-foreground">{UI_COPY.myCategory.editorDialog.searching}</div>
                )}
                {!placeSearchLoading && placeResults.length > 0 && (
                  <div className="max-h-[24vh] space-y-1 overflow-y-auto pr-1 md:max-h-[220px]">
                    {placeResults.map((place) => (
                      <Card key={place.id} className="border-border bg-card shadow-sm">
                        <div className="flex items-start gap-2.5 p-3">
                          <div className="mt-0.5 shrink-0 text-primary">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium break-words">{place.name}</p>
                            <p className="text-xs text-muted-foreground break-words">{place.addressName}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedPlaces.some((item) => item.id === place.id) ? 'secondary' : 'outline'}
                            className="shrink-0"
                            onClick={() => handleAddPlace(place)}
                            disabled={selectedPlaces.some((item) => item.id === place.id)}
                          >
                            {selectedPlaces.some((item) => item.id === place.id)
                              ? UI_COPY.myCategory.detailDialog.addCompleted
                              : UI_COPY.myCategory.editorDialog.addPlaceAction}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_COPY.myCategory.editorDialog.createTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.nameLabel}</p>
              <Input
                placeholder={UI_COPY.myCategory.editorDialog.namePlaceholder}
                value={renameTitle}
                onChange={(event) => handleChangeRenameTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleRenameCategory();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={createSavedCategoryMutation.isPending}
              >
                {UI_COPY.myCategory.editorDialog.cancel}
              </Button>
              <Button
                // UserRequest: 카테고리 생성 전용 페이지의 제목 수정 확인 버튼도 저장 문구를 사용한다.
                onClick={handleRenameCategory}
                disabled={createSavedCategoryMutation.isPending || !renameTitle.trim() || renameTitle.trim() === categoryTitle}
              >
                {UI_COPY.myCategory.editorDialog.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.myCategory.leaveConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {UI_COPY.myCategory.leaveConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnPage}>
              {UI_COPY.myCategory.leaveConfirm.stay}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLeavePage}>
              {UI_COPY.myCategory.leaveConfirm.leave}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyCategoryCreate;
