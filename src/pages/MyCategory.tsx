import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { Plus, Folder, Search, MapPin, X, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
  useCreateSavedCategory,
  useDeleteSavedCategory,
  useMySavedCategories,
} from '@/shared/hooks/use-my-storage';
import { MESSAGES } from '@/shared/constants/messages';
import type { SavedCategory, SearchedPlace } from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import { placeApi } from '@/services/api';
import { formatRelativeTimeKorean } from '@/shared/utils/relative-time';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리 목록 생성/수정/삭제와 상세 확인 흐름만 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<SavedCategory | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<SearchedPlace[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SearchedPlace[]>([]);

  // UserRequest: 내 카테고리 목록은 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
  const {
    data: savedCategories = [],
    isLoading: savedCategoriesLoading,
    error: savedCategoriesError,
  } = useMySavedCategories(token);
  const createSavedCategoryMutation = useCreateSavedCategory(token);
  const deleteSavedCategoryMutation = useDeleteSavedCategory(token);

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // UserRequest: 내 카테고리 목록 조회 실패 시 사용자에게 즉시 알림
    if (savedCategoriesError) {
      toast.error(savedCategoriesError.message || MESSAGES.savedCategory.listLoadFailed);
    }
  }, [savedCategoriesError]);

  // UserRequest: 카테고리 카드 클릭 시 상세 페이지로 이동하여 이름/지도/장소 목록을 보여줌
  const handleOpenCategory = (categoryId: string) => {
    navigate(`/my-category/${categoryId}`);
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
    setSelectedPlaces((prev) => [...prev, place]);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((place) => place.id !== placeId));
  };

  const resetCreateDialog = () => {
    setNewCategoryTitle('');
    setPlaceQuery('');
    setPlaceResults([]);
    setSelectedPlaces([]);
  };

  const handleOpenCreateDialog = () => {
    // UserRequest: 새 카테고리 추가 버튼 클릭 시 생성 팝업 노출
    resetCreateDialog();
    setCreateDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }
    if (selectedPlaces.length === 0) {
      toast.error(UI_COPY.myCategory.atLeastOnePlace);
      return;
    }
    if (createSavedCategoryMutation.isPending) return;

    try {
      await createSavedCategoryMutation.mutateAsync({
        title: newCategoryTitle.trim(),
        places: selectedPlaces,
      });
      setCreateDialogOpen(false);
      resetCreateDialog();
    } catch {
      // UserRequest: 생성 실패 시 팝업은 유지하여 입력을 보존
    }
  };

  const handleDeleteClick = (category: SavedCategory) => {
    // UserRequest: 길게 누른 카테고리 카드의 "삭제하기"는 워크스페이스와 유사한 확인 팝업으로 진행
    setSelectedForDelete(category);
    setDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedForDelete || deleteSavedCategoryMutation.isPending) return;
    deleteSavedCategoryMutation.mutate(selectedForDelete.id, {
      onSettled: () => {
        setDeleteAlertOpen(false);
        setSelectedForDelete(null);
      },
    });
  };

  // UserRequest: 내 카테고리 카드의 롱프레스를 제거하고 우측 더보기 버튼으로 수정/삭제 메뉴를 노출한다.
  const renderSavedCategoryCard = (category: SavedCategory) => (
    <Card
      key={category.id}
      className="hover-lift cursor-pointer"
      onClick={() => handleOpenCategory(category.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
              <Folder className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
              {category.placeCount}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="text-base truncate">{category.title}</CardTitle>
            {/* UserRequest: 수정 시간을 주/개월/년 단위까지 포함한 상대시간으로 표시한다. */}
            <p className="text-xs text-muted-foreground">
              업데이트 {formatRelativeTimeKorean(category.updatedAt)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={UI_COPY.myCategory.moreActionAriaLabel}
              className="h-8 w-8 shrink-0"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteClick(category);
              }}
            >
              <Trash2 className="w-4 h-4" />
              삭제하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
    </Card>
  );

  if (savedCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (savedCategoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">{MESSAGES.savedCategory.listLoadFailed}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>{UI_COPY.common.retry}</Button>
        </div>
      </div>
    );
  }

  // UserRequest: 빈 탭에서도 경계가 보이도록 공통 빈 상태 박스를 재사용한다.
  const renderEmptyState = (
    icon: ReactNode,
    message: string,
    className = 'h-[50vh]',
  ) => (
    <div className={`border-2 border-dashed border-border rounded-xl p-5 text-center flex flex-col items-center justify-center sm:p-8 md:p-10 ${className}`}>
      {icon}
      <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 뒤로가기 버튼은 직전 페이지로 이동 */}
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader title={UI_COPY.myCategory.pageTitle} />

      {/* 모바일 레이아웃 */}
      {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <main className="md:hidden container mx-auto px-4 py-6 space-y-3">
        {/* UserRequest: 카테고리 페이지에서 생성 버튼과 목록을 동일한 흐름으로 표시 */}
        <Card
          className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
          onClick={handleOpenCreateDialog}
        >
          <CardHeader className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="w-5 h-5" />
              <CardTitle className="text-base md:text-lg text-primary">{UI_COPY.myCategory.createAction}</CardTitle>
            </div>
          </CardHeader>
        </Card>

            {savedCategories.length === 0
              ? renderEmptyState(
              <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
              `${UI_COPY.myCategory.empty.title}\n${UI_COPY.myCategory.empty.description}`,
            )
          : savedCategories.map((category) => renderSavedCategoryCard(category))}
      </main>

      {/* 데스크톱 레이아웃 - 3단 구조 */}
      <main className="hidden md:block min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
          <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

          <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)] space-y-2">
            {/* UserRequest: 카테고리 페이지에서 생성 버튼과 목록을 동일한 흐름으로 표시 */}
            <Card
              className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
              onClick={handleOpenCreateDialog}
            >
              <CardHeader className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-primary">
                  <Plus className="w-5 h-5" />
                  <CardTitle className="text-base md:text-lg text-primary">{UI_COPY.myCategory.createAction}</CardTitle>
                </div>
              </CardHeader>
            </Card>

            {savedCategories.length === 0
              ? renderEmptyState(
              <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
              `${UI_COPY.myCategory.empty.title}\n${UI_COPY.myCategory.empty.description}`,
            )
              : savedCategories.map((category) => renderSavedCategoryCard(category))}
          </div>

          <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
        </div>
      </main>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            resetCreateDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto px-3 py-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{UI_COPY.myCategory.editorDialog.createTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.nameLabel}</p>
              <Input
                placeholder={UI_COPY.myCategory.editorDialog.namePlaceholder}
                value={newCategoryTitle}
                onChange={(event) => setNewCategoryTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.selectedPlacesLabel}</p>
              {/* UserRequest: 검색 결과 영역과 동일한 높이로 고정하고 스크롤로 관리 */}
              <div className="max-h-56 overflow-y-auto overflow-x-hidden border border-border rounded-lg divide-y divide-border">
                {selectedPlaces.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">{UI_COPY.myCategory.editorDialog.noPlacesSelected}</div>
                ) : (
                  selectedPlaces.map((place) => (
                    <div key={place.id} className="flex items-center gap-2.5 p-3">
                      <div className="text-primary shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{place.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => handleRemovePlace(place.id)}
                        aria-label={UI_COPY.myCategory.editorDialog.removePlaceAriaLabel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                      handleSearchPlaces();
                    }
                  }}
                />
                <Button
                  onClick={handleSearchPlaces}
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
                <div className="max-h-56 overflow-y-auto overflow-x-hidden border border-border rounded-lg divide-y divide-border">
                  {placeResults.map((place) => (
                    <div key={place.id} className="flex items-start gap-2.5 p-3">
                      <div className="mt-0.5 shrink-0 text-primary">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium break-words">{place.name}</p>
                        <p className="text-xs text-muted-foreground break-words">{place.addressName}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => handleAddPlace(place)}
                      >
                        {UI_COPY.myCategory.editorDialog.addPlaceAction}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createSavedCategoryMutation.isPending}
              >
                {UI_COPY.myCategory.editorDialog.cancel}
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={createSavedCategoryMutation.isPending}
              >
                {createSavedCategoryMutation.isPending
                  ? UI_COPY.myCategory.editorDialog.creating
                  : UI_COPY.myCategory.editorDialog.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.myCategory.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedForDelete
                ? UI_COPY.myCategory.deleteDialog.description(selectedForDelete.title)
                : UI_COPY.myCategory.deleteDialog.description('선택한')}
              <br />
              <span className="text-destructive">{UI_COPY.myCategory.deleteDialog.warning}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSavedCategoryMutation.isPending}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyCategory;
