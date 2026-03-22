import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/page-header';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import UserMenu from '@/components/header/user-menu';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useSavedCategoryDetail, useUpdateSavedCategory } from '@/shared/hooks/use-my-storage';
import { useAuthStore } from '@/shared/stores/auth-store';
import { MapPin, PenLine, Search, X } from 'lucide-react';
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

  const placeSectionHeader = (
    <div className="flex items-center justify-between gap-3">
      <p className="text-lg font-semibold flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-primary" />
        {isAddingPlace ? UI_COPY.myCategory.detailDialog.editingPlaceListTitle : UI_COPY.myCategory.detailDialog.placeListTitle}
        <span className="text-xs text-muted-foreground">
          ({currentPlaces.length}곳)
        </span>
      </p>
      <div className="flex items-center gap-2">
        {isAddingPlace ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelAddPlaceMode}
              disabled={updateSavedCategoryMutation.isPending}
            >
              {UI_COPY.myCategory.editorDialog.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSavePlaces()}
              disabled={
                updateSavedCategoryMutation.isPending
                || selectedPlaces.length === 0
                || isUnchangedPlaceSelection
              }
            >
              {updateSavedCategoryMutation.isPending
                ? UI_COPY.myCategory.editorDialog.editing
                : UI_COPY.myCategory.editorDialog.edit}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleOpenAddPlaceMode}
            className="gap-2 rounded-full"
          >
            <PenLine className="w-4 h-4" />
            {UI_COPY.myCategory.detailDialog.editAction}
          </Button>
        )}
      </div>
    </div>
  );

  const placeSectionContent = isAddingPlace ? (
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
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleFocusPlace(place.id)}
                    >
                      <CardHeader className="flex-row items-center space-y-0 py-1.5">
                        <CardTitle className="text-base flex flex-1 items-center gap-1.5 truncate">
                          <MapPin className="w-4 h-4 shrink-0 text-primary" />
                          <span className="truncate">{place.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-1.5">
                        <p className="text-sm text-muted-foreground truncate">{place.addressName}</p>
                      </CardContent>
                    </button>
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
                <button
                  type="button"
                  className={`flex w-full items-start gap-2.5 p-3 text-left transition-colors ${
                    highlightedSearchPlaceId === place.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectSearchPlace(place.id)}
                >
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
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddPlace(place);
                    }}
                    disabled={selectedPlaces.some((item) => item.id === place.id)}
                  >
                    {selectedPlaces.some((item) => item.id === place.id)
                      ? UI_COPY.myCategory.detailDialog.addCompleted
                      : UI_COPY.myCategory.editorDialog.addPlaceAction}
                  </Button>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="max-h-[42vh] space-y-1 overflow-y-auto pr-1 md:max-h-none">
      {detailPlaces.length === 0 ? (
        <div className="flex min-h-24 items-center justify-center rounded-xl border-2 border-dashed border-border px-3 text-sm text-muted-foreground">
          {UI_COPY.myCategory.detailDialog.noPlacesInDetail}
        </div>
      ) : (
        <>
          {detailPlaces.map((place) => (
            <Card
              key={place.id}
              className={`transition-colors ${
                focusedPlaceId === place.id
                  ? 'border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card shadow-sm hover:bg-accent/20'
              }`}
            >
              <button
                type="button"
                onClick={() => handleFocusPlace(place.id)}
                className="w-full text-left"
              >
                <CardHeader className="flex-row items-center space-y-0 py-1.5 cursor-pointer">
                  <CardTitle className="text-base flex flex-1 items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{place.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-1.5">
                  <p className="text-sm text-muted-foreground break-words">{place.addressName}</p>
                </CardContent>
              </button>
            </Card>
          ))}
        </>
      )}
    </div>
  );

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
            <section className="space-y-3">
              {placeSectionHeader}
              {placeSectionContent}
            </section>
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
            {placeSectionHeader}
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {placeSectionContent}
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
