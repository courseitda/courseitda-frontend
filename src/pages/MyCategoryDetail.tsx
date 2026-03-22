import { useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/page-header';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import UserMenu from '@/components/header/user-menu';
import { CategoryPlacesSection } from '@/components/my-category/category-places-section';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useSavedCategoryDetail, useUpdateSavedCategory } from '@/shared/hooks/use-my-storage';
import { useAuthStore } from '@/shared/stores/auth-store';
import { PenLine } from 'lucide-react';
import { useRequireAuthRedirect } from '@/shared/hooks/use-require-auth-redirect';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import { useSavedCategoryEditor } from '@/shared/hooks/use-saved-category-editor';

const MyCategoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();

  const {
    data: category = null,
    isLoading: savedCategoryLoading,
    error: savedCategoryError,
  } = useSavedCategoryDetail(token, id);
  const updateSavedCategoryMutation = useUpdateSavedCategory(token);
  // UserRequest: 반복되는 인증 리다이렉트 로직을 공통 훅으로 통합
  useRequireAuthRedirect();

  // UserRequest: 내 카테고리 상세 조회 실패 시 사용자에게 즉시 알림
  useQueryErrorToast(savedCategoryError, MESSAGES.savedCategory.listLoadFailed);

  const {
    focusedPlaceId,
    renameDialogOpen,
    renameTitle,
    isAddingPlace,
    placeQuery,
    placeResults,
    placeSearchLoading,
    selectedPlaces,
    highlightedSearchPlaceId,
    detailPlaces,
    currentPlaces,
    isUnchangedRenameTitle,
    isUnchangedPlaceSelection,
    setRenameDialogOpen,
    setRenameTitle,
    setPlaceQuery,
    handleOpenRenameDialog,
    handleRenameCategory,
    handleOpenAddPlaceMode,
    handleCancelAddPlaceMode,
    handleSearchPlaces,
    handleAddPlace,
    handleSelectSearchPlace,
    handleRemovePlace,
    handleFocusPlace,
    handleSavePlaces,
  } = useSavedCategoryEditor(category, updateSavedCategoryMutation);

  if (savedCategoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-card">
        <PageHeader
          showBackButton
          showBrand={false}
          centerContent={<p className="text-base font-semibold">{UI_COPY.myCategory.pageTitleShort}</p>}
          rightContent={<div className="w-10 h-10" />}
        />
        <div className="container mx-auto px-8 py-10">
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {UI_COPY.myCategory.empty.title}
          </div>
        </div>
      </div>
    );
  }

  // 생성/상세 화면이 같은 편집 섹션을 재사용하도록 공통 props를 한곳에서 조합한다.
  const categoryPlacesSectionProps = {
    sectionTitle: isAddingPlace
      ? UI_COPY.myCategory.detailDialog.editingPlaceListTitle
      : UI_COPY.myCategory.detailDialog.placeListTitle,
    placeCount: currentPlaces.length,
    isEditing: isAddingPlace,
    isPending: updateSavedCategoryMutation.isPending,
    canSubmit: selectedPlaces.length > 0 && !isUnchangedPlaceSelection,
    submitLabel: UI_COPY.myCategory.editorDialog.edit,
    pendingSubmitLabel: UI_COPY.myCategory.editorDialog.editing,
    selectedPlaces,
    detailPlaces,
    placeQuery,
    placeResults,
    placeSearchLoading,
    highlightedSearchPlaceId,
    focusedPlaceId,
    onPlaceQueryChange: setPlaceQuery,
    onSearchPlaces: handleSearchPlaces,
    onAddPlace: handleAddPlace,
    onSelectSearchPlace: handleSelectSearchPlace,
    onRemovePlace: handleRemovePlace,
    onFocusPlace: handleFocusPlace,
    onSubmit: handleSavePlaces,
    onStartEditing: handleOpenAddPlaceMode,
    onCancelEditing: handleCancelAddPlaceMode,
  } as const;

  return (
    <div className="min-h-screen bg-gradient-card md:h-screen md:flex md:flex-col">
      <PageHeader
        showBackButton
        showBrand={false}
        centerContent={(
          <div className="relative flex items-center justify-center min-w-0">
            <p className="max-w-[180px] text-center text-lg font-bold truncate md:max-w-[320px]">
              {category.title}
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
        rightContent={<UserMenu currentMyCategoryLabel={category.title} />}
      />

      <main className="space-y-2.5 pb-4 md:flex-1 md:min-h-0 md:space-y-0 md:pb-0">
        <div className="md:hidden space-y-2.5 pb-4">
          <section className="rounded-none bg-card p-0 shadow-sm md:rounded-xl md:mx-8 md:p-4 md:container md:max-w-2xl">
            <CategoryPlacesMap
              open
              places={currentPlaces.map((place) => ({
                id: place.id,
                name: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
              }))}
              focusedPlaceId={focusedPlaceId}
              searchPlaces={
                isAddingPlace
                  ? placeResults.map((place) => ({
                    id: place.id,
                    name: place.name,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }))
                  : []
              }
              highlightedSearchPlaceId={isAddingPlace ? highlightedSearchPlaceId : null}
            />
          </section>

          <div className="container mx-auto max-w-2xl px-8 pt-3 md:pt-4">
            <CategoryPlacesSection {...categoryPlacesSectionProps} />
          </div>
        </div>

        <div className="hidden h-full md:grid md:grid-cols-2 md:gap-4 md:px-0 md:pb-4">
          <section className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card min-h-0">
            <CategoryPlacesMap
              open
              // UserRequest: 데스크톱 카테고리 상세는 지도가 좌측 칼럼 높이를 채워 워크스페이스 상세와 같은 분할 레이아웃으로 보이게 한다.
              mapClassName="md:h-full md:min-h-[calc(100vh-10rem)] md:rounded-none md:border-0"
              places={currentPlaces.map((place) => ({
                id: place.id,
                name: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
              }))}
              focusedPlaceId={focusedPlaceId}
              searchPlaces={
                isAddingPlace
                  ? placeResults.map((place) => ({
                    id: place.id,
                    name: place.name,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }))
                  : []
              }
              highlightedSearchPlaceId={isAddingPlace ? highlightedSearchPlaceId : null}
            />
          </section>

          <section className="flex min-h-0 flex-col rounded-xl border border-border/50 bg-card p-4 shadow-lg">
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              <CategoryPlacesSection {...categoryPlacesSectionProps} />
            </div>
          </section>
        </div>
      </main>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_COPY.myCategory.editorDialog.editTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.nameLabel}</p>
              <Input
                placeholder={UI_COPY.myCategory.editorDialog.namePlaceholder}
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleRenameCategory();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={updateSavedCategoryMutation.isPending}
              >
                {UI_COPY.myCategory.editorDialog.cancel}
              </Button>
              <Button
                onClick={() => void handleRenameCategory()}
                disabled={updateSavedCategoryMutation.isPending || !renameTitle.trim() || isUnchangedRenameTitle}
              >
                {updateSavedCategoryMutation.isPending
                  ? UI_COPY.myCategory.editorDialog.editing
                  : UI_COPY.myCategory.editorDialog.edit}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCategoryDetail;
