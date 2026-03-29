import { useEffect, useState } from 'react';
import { useBeforeUnload, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/page-header';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import UserMenu from '@/components/header/user-menu';
import { CategoryPlacesSection } from '@/components/my-category/category-places-section';
import { placeApi } from '@/services/api';
import type { SearchedPlace } from '@/entities/types';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useCreateSavedCategory } from '@/shared/hooks/use-my-storage';
import { useAuthStore } from '@/shared/stores/auth-store';
import { PenLine } from 'lucide-react';
import { toast } from 'sonner';
import InfoConfirmDialog from '@/components/common/info-confirm-dialog';
import { useRequireAuthRedirect } from '@/shared/hooks/use-require-auth-redirect';

type MyCategoryCreateLocationState = {
  draftTitle?: string;
};

const MyCategoryCreate = () => {
  const CATEGORY_NAME_MAX_LENGTH = 10;
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
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
  const [highlightedSearchPlaceId, setHighlightedSearchPlaceId] = useState<string | null>(null);
  const [leaveAlertOpen, setLeaveAlertOpen] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const hasUnsavedChanges = categoryTitle.trim().length > 0 || selectedPlaces.length > 0;

  useBeforeUnload((event) => {
    if (!hasUnsavedChanges) return;

    // UserRequest: 생성 전용 페이지 작성 중 브라우저 이탈 시 저장되지 않은 내용 경고를 띄운다.
    event.preventDefault();
    event.returnValue = '';
  });

  // UserRequest: 반복되는 인증 리다이렉트 로직을 공통 훅으로 통합
  useRequireAuthRedirect();

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
      setHighlightedSearchPlaceId(null);
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

  const handleFocusPlace = (placeId: string) => {
    // UserRequest: 생성 페이지 장소 목록 클릭 시 해당 장소로 이동하면서 이름표를 함께 표시한다.
    setHighlightedSearchPlaceId(null);
    setFocusedPlaceId(placeId);
  };

  const handleSelectSearchPlace = (placeId: string) => {
    // UserRequest: 생성 페이지 검색 결과 클릭 시 해당 장소 점만 파란색으로 강조하고 이름표를 표시한다.
    setFocusedPlaceId(null);
    setHighlightedSearchPlaceId(placeId);
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
    <div className="min-h-screen bg-gradient-card md:flex md:h-screen md:flex-col md:overflow-hidden">
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

      <main className="space-y-2.5 pb-4 md:relative md:flex-1 md:min-h-0 md:space-y-0 md:pb-4">
        {/* UserRequest: 카테고리 추가 페이지 데스크톱 화면은 워크스페이스 상세처럼 왼쪽 지도, 오른쪽 편집 영역 2열로 배치한다. */}
        <div className="md:grid md:h-full md:grid-cols-2 md:gap-4 md:px-4">
          <section className="rounded-none bg-card p-0 shadow-sm md:min-h-0 md:overflow-hidden md:rounded-xl md:border md:border-border/50 md:p-4 md:shadow-lg">
            <CategoryPlacesMap
              open
              places={selectedPlaces.map((place) => ({
                id: place.id,
                name: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
              }))}
              focusedPlaceId={focusedPlaceId}
              searchPlaces={placeResults.map((place) => ({
                id: place.id,
                name: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
              }))}
              highlightedSearchPlaceId={highlightedSearchPlaceId}
              mapClassName="md:h-full"
            />
          </section>

          {/* 데스크톱에서는 우측 편집 패널만 스크롤되도록 분리해 지도와 편집 영역을 동시에 크게 유지 */}
          <div className="px-8 pt-3 md:min-h-0 md:overflow-y-auto md:rounded-xl md:border md:border-border/50 md:bg-card md:px-6 md:py-6 md:shadow-lg">
            <CategoryPlacesSection
              sectionTitle={UI_COPY.myCategory.detailDialog.editingPlaceListTitle}
              placeCount={selectedPlaces.length}
              isEditing
              isPending={createSavedCategoryMutation.isPending}
              canSubmit={selectedPlaces.length > 0}
              submitLabel={UI_COPY.myCategory.editorDialog.save}
              pendingSubmitLabel={UI_COPY.myCategory.editorDialog.saving}
              selectedPlaces={selectedPlaces}
              detailPlaces={selectedPlaces}
              placeQuery={placeQuery}
              placeResults={placeResults}
              placeSearchLoading={placeSearchLoading}
              highlightedSearchPlaceId={highlightedSearchPlaceId}
              focusedPlaceId={focusedPlaceId}
              onPlaceQueryChange={setPlaceQuery}
              onSearchPlaces={handleSearchPlaces}
              onAddPlace={handleAddPlace}
              onSelectSearchPlace={handleSelectSearchPlace}
              onRemovePlace={handleRemovePlace}
              onFocusPlace={handleFocusPlace}
              // UserRequest: 생성 전용 페이지에서는 장소를 1개 이상 추가해야 최종 생성 버튼이 활성화된다.
              // UserRequest: 카테고리 생성 전용 페이지의 최종 제출 버튼 텍스트를 저장으로 변경한다.
              onSubmit={handleCreateCategory}
            />
          </div>
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

      {/* UserRequest: 생성 페이지 이탈 안내는 공통 안내 팝업을 사용하고 왼쪽 계속 작성, 오른쪽 이동하기 순서를 유지한다. */}
      <InfoConfirmDialog
        open={leaveAlertOpen}
        onOpenChange={setLeaveAlertOpen}
        title={UI_COPY.myCategory.leaveConfirm.title}
        description={UI_COPY.myCategory.leaveConfirm.description}
        leftLabel={UI_COPY.myCategory.leaveConfirm.stay}
        rightLabel={UI_COPY.myCategory.leaveConfirm.leave}
        onLeftAction={handleStayOnPage}
        onRightAction={handleLeavePage}
      />
    </div>
  );
};

export default MyCategoryCreate;
