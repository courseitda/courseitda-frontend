import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ArrowRight, Plus, Folder, Heart, Search, MapPin, X, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import {
  useCreateSavedCategory,
  useDeleteSavedCategory,
  useMySavedCategories,
  useUpdateSavedCategory,
} from '@/shared/hooks/use-my-storage';
import { COMMUNITY_QUERY_KEYS, useLikedSharedCategories } from '@/shared/hooks/use-community';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';
import { MESSAGES } from '@/shared/constants/messages';
import type { SavedCategory, SearchedPlace, SharedSavedCategory } from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import { placeApi } from '@/services/api';
import { formatRelativeTimeKorean } from '@/shared/utils/relative-time';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { LikedCategoryList } from '@/features/my-category/liked-category-list';


/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리/찜 탭만 제공하며 워크스페이스 탭을 노출하지 않음
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  // UserRequest: 내 카테고리 페이지에서는 카테고리/찜 탭만 제공하고 카테고리 탭을 기본값으로 설정
  const [activeSection, setActiveSection] = useState<'categories' | 'liked'>('categories');
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SavedCategory | null>(null);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
  const [removingLikedIds, setRemovingLikedIds] = useState<Record<string, boolean>>({});
  const [unlikeDialogOpen, setUnlikeDialogOpen] = useState(false);
  const [pendingUnlike, setPendingUnlike] = useState<{ id: string; title: string } | null>(null);
  const [likedDetailOpen, setLikedDetailOpen] = useState(false);
  const [selectedLikedCategory, setSelectedLikedCategory] = useState<SharedSavedCategory | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
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
  const {
    data: likedCategories = [],
    isLoading: likedCategoriesLoading,
    error: likedCategoriesError,
  } = useLikedSharedCategories(token);
  const createSavedCategoryMutation = useCreateSavedCategory(token);
  const updateSavedCategoryMutation = useUpdateSavedCategory(token);
  const deleteSavedCategoryMutation = useDeleteSavedCategory(token);

  // UserRequest: 내 카테고리 찜 탭에서도 찜 해제를 지원
  const { toggleLike } = useSharedCategoryLike({
    queryKey: COMMUNITY_QUERY_KEYS.liked,
    token,
    isAuthenticated,
  });

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // UserRequest: 카테고리 카드 클릭 시 상세 팝업을 표시하여 이름/지도(임시)/장소 목록을 보여줌
  const handleOpenCategory = (categoryId: string) => {
    const target = savedCategories.find((category) => category.id === categoryId);
    if (!target) return;
    setSelectedCategory(target);
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    setFocusedPlaceId(null);
    setCategoryDetailOpen(true);
  };

  useEffect(() => {
    // UserRequest: 내 카테고리 목록 조회 실패 시 사용자에게 즉시 알림
    if (savedCategoriesError) {
      toast.error(savedCategoriesError.message || MESSAGES.savedCategory.listLoadFailed);
    }
  }, [savedCategoriesError]);

  useEffect(() => {
    // UserRequest: 찜 목록 조회 실패 시 사용자에게 즉시 알림
    if (likedCategoriesError) {
      toast.error(likedCategoriesError.message || MESSAGES.likedCategory.listLoadFailed);
    }
  }, [likedCategoriesError]);

  const handleSearchPlaces = async () => {
    if (!placeQuery.trim()) {
      toast.error(MESSAGES.savedCategory.searchKeywordRequired);
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
        toast.info(MESSAGES.savedCategory.searchNoResult);
      }
    }
    setPlaceSearchLoading(false);
  };

  const handleAddPlace = (place: SearchedPlace) => {
    const exists = selectedPlaces.some((item) => item.id === place.id);
    if (exists) {
      toast.info(MESSAGES.savedCategory.placeAlreadyAdded);
      return;
    }
    setSelectedPlaces((prev) => [...prev, place]);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((place) => place.id !== placeId));
  };

  const handleOpenCreateDialog = () => {
    // UserRequest: 새 카테고리 추가 버튼 클릭 시 생성 팝업 노출
    setCategoryDialogMode('create');
    setEditingCategoryId(null);
    resetCreateDialog();
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (category: SavedCategory) => {
    // UserRequest: 길게 누른 카테고리 카드의 "수정하기"는 생성 팝업을 재사용하되 기존 값을 초기값으로 채운다.
    setCategoryDialogMode('edit');
    setEditingCategoryId(category.id);
    setNewCategoryTitle(category.title);
    setPlaceQuery('');
    setPlaceResults([]);
    setSelectedPlaces(
      category.places.map((place) => ({
        id: place.id,
        name: place.name,
        placeUrl: place.placeUrl,
        roadAddressName: place.roadAddressName,
        addressName: place.addressName,
        latitude: place.latitude,
        longitude: place.longitude,
      })),
    );
    setCreateDialogOpen(true);
  };

  const resetCreateDialog = () => {
    setNewCategoryTitle('');
    setPlaceQuery('');
    setPlaceResults([]);
    setSelectedPlaces([]);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      toast.error(MESSAGES.savedCategory.nameRequired);
      return;
    }
    if (selectedPlaces.length === 0) {
      toast.error(MESSAGES.savedCategory.atLeastOnePlace);
      return;
    }
    if (createSavedCategoryMutation.isPending || updateSavedCategoryMutation.isPending) return;

    try {
      // UserRequest: 수정하기에서는 기존 카테고리 ID를 사용해 덮어쓰기 저장
      if (categoryDialogMode === 'edit' && editingCategoryId) {
        await updateSavedCategoryMutation.mutateAsync({
          id: editingCategoryId,
          title: newCategoryTitle.trim(),
          places: selectedPlaces,
        });
      } else {
        await createSavedCategoryMutation.mutateAsync({
          title: newCategoryTitle.trim(),
          places: selectedPlaces,
        });
      }
      setCreateDialogOpen(false);
      resetCreateDialog();
      setCategoryDialogMode('create');
      setEditingCategoryId(null);
    } catch {
      // UserRequest: 생성 실패 시 팝업은 유지하여 입력을 보존
    }
  };

  const handleDeleteClick = (category: SavedCategory) => {
    // UserRequest: 길게 누른 카테고리 카드의 "삭제하기"는 워크스페이스와 유사한 확인 팝업으로 진행
    setSelectedForDelete(category);
    setDeleteAlertOpen(true);
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
              aria-label="카테고리 더보기"
              className="h-8 w-8 shrink-0"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenEditDialog(category);
              }}
            >
              <Pencil className="w-4 h-4" />
              수정하기
            </DropdownMenuItem>
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

  const handleDeleteConfirm = () => {
    if (!selectedForDelete || deleteSavedCategoryMutation.isPending) return;
    deleteSavedCategoryMutation.mutate(selectedForDelete.id, {
      onSuccess: () => {
        if (selectedCategory?.id === selectedForDelete.id) {
          setCategoryDetailOpen(false);
          setSelectedCategory(null);
        }
      },
      onSettled: () => {
        setDeleteAlertOpen(false);
        setSelectedForDelete(null);
      },
    });
  };

  const triggerLikePulse = (categoryId: string) => {
    setLikePulse((prev) => ({ ...prev, [categoryId]: true }));
    setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [categoryId]: false }));
    }, 200);
  };

  const handleToggleLikedCategory = (categoryId: string, currentLiked: boolean) => {
    if (currentLiked) {
      // UserRequest: 찜 해제 시 카드가 자연스럽게 사라지는 전환 애니메이션 적용
      setRemovingLikedIds((prev) => ({ ...prev, [categoryId]: true }));
      setTimeout(() => {
        setRemovingLikedIds((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });
      }, 220);
    }
    const didToggle = toggleLike({ sharedCategoryId: categoryId, currentLiked });
    if (!didToggle) return;
    triggerLikePulse(categoryId);
  };

  const requestUnlike = (categoryId: string, title: string) => {
    // UserRequest: 찜 해제 시 안내 팝업을 띄워 확인 후 해제 처리
    setPendingUnlike({ id: categoryId, title });
    setUnlikeDialogOpen(true);
  };

  const confirmUnlike = () => {
    if (!pendingUnlike) return;
    handleToggleLikedCategory(pendingUnlike.id, true);
    setUnlikeDialogOpen(false);
    setPendingUnlike(null);
  };

  const handleOpenLikedDetail = (category: SharedSavedCategory) => {
    // UserRequest: 찜 카드 클릭 시 카테고리 게시판과 동일한 상세 팝업을 표시
    setSelectedLikedCategory(category);
    setLikedDetailOpen(true);
  };

  // UserRequest: 상세보기 장소 목록은 최소 3행 슬롯을 유지해 항목 수가 적어도 구분선이 보이도록 처리
  const detailPlaces = selectedCategory?.places ?? [];
  const detailMinRows = 3;
  const detailEmptyRows = Math.max(0, detailMinRows - detailPlaces.length);

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
          <Button variant="outline" onClick={() => window.location.reload()}>{MESSAGES.common.retry}</Button>
        </div>
      </div>
    );
  }

  // UserRequest: 빈 탭에서도 경계가 보이도록 공통 빈 상태 박스를 재사용한다.
  const renderEmptyState = (
    icon: ReactNode,
    message: string,
    className = 'h-[50vh]',
    action?: ReactNode,
  ) => (
    <div className={`border-2 border-dashed border-border rounded-xl p-8 md:p-10 text-center flex flex-col items-center justify-center ${className}`}>
      {icon}
      <p className="whitespace-pre-line text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );

  const handleMoveToCommunity = () => {
    // UserRequest: 찜 카테고리 빈 상태에서 커뮤니티로 바로 이동할 수 있게 연결한다.
    navigate('/community');
  };

  return (
      <div className="min-h-screen bg-gradient-card">
        {/* UserRequest: 뒤로가기 버튼은 직전 페이지로 이동 */}
        {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
        <PageHeader title="내 카테고리" />

        {/* 모바일 레이아웃 */}
        {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
        <main className="md:hidden container mx-auto px-4 py-6">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              {/* UserRequest: 워크스페이스 탭을 제거하고 카테고리/찜 탭만 노출 */}
              <TabsTrigger value="categories" className="flex items-center gap-1.5">
                <Folder className="w-4 h-4" />
                카테고리
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                찜
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-0 space-y-3">
              {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
              <Card
                  className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
                  onClick={handleOpenCreateDialog}
              >
                <CardHeader className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="w-5 h-5" />
                    <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                  </div>
                </CardHeader>
              </Card>

              {savedCategories.length === 0
                ? renderEmptyState(
                  <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
                  '카테고리가 없습니다.\n지금 추가해보세요!',
                )
                : savedCategories.map((category) => renderSavedCategoryCard(category))}
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              {likedCategoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : likedCategories.length === 0 ? (
                renderEmptyState(
                  <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
                  '아직 찜한 카테고리가 없습니다.\n커뮤니티에서 마음에 드는 카테고리를 찾아보세요.',
                  'h-[calc(50vh+5rem)]',
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 inline-flex h-auto items-center gap-1 p-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={handleMoveToCommunity}
                  >
                    <ArrowRight className="h-4 w-4" />
                    찜하러 가기
                  </Button>,
                )
              ) : (
                <LikedCategoryList
                  categories={likedCategories}
                  isAuthenticated={isAuthenticated}
                  likePulse={likePulse}
                  removingLikedIds={removingLikedIds}
                  onOpenDetail={handleOpenLikedDetail}
                  onRequestUnlike={requestUnlike}
                />
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* 데스크톱 레이아웃 - 3단 구조 */}
        {/* UserRequest: 데스크톱 화면에서도 카테고리/찜 탭만 제공하여 정보 구조를 단순화 */}
        <main className="hidden md:block min-h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
            {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

            {/* 중앙: 카테고리/찜 목록 콘텐츠 */}
            <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)]">
              <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'categories' | 'liked')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="categories" className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4" />
                    카테고리
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    찜
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="mt-0 space-y-2">
                  {/* UserRequest: 카테고리 탭에서도 생성 버튼과 목록을 워크스페이스와 동일한 형태로 표시 */}
                  <Card
                      className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
                      onClick={handleOpenCreateDialog}
                  >
                    <CardHeader className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="w-5 h-5" />
                        <CardTitle className="text-base md:text-lg text-primary">새 카테고리</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  {savedCategories.length === 0
                    ? renderEmptyState(
                      <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
                      '카테고리가 없습니다.\n지금 추가해보세요!',
                    )
                    : savedCategories.map((category) => renderSavedCategoryCard(category))}
                </TabsContent>

                <TabsContent value="liked" className="mt-0">
                  {likedCategoriesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner className="w-6 h-6" />
                    </div>
                  ) : likedCategories.length === 0 ? (
                    renderEmptyState(
                      <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />,
                      '아직 찜한 카테고리가 없습니다.\n커뮤니티에서 마음에 드는 카테고리를 찾아보세요.',
                      'h-[calc(50vh+5rem)]',
                      <Button
                        type="button"
                        variant="link"
                        className="mt-2 inline-flex h-auto items-center gap-1 p-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={handleMoveToCommunity}
                      >
                        <ArrowRight className="h-4 w-4" />
                        찜하러 가기
                      </Button>,
                    )
                  ) : (
                    <LikedCategoryList
                      categories={likedCategories}
                      isAuthenticated={isAuthenticated}
                      likePulse={likePulse}
                      removingLikedIds={removingLikedIds}
                      onOpenDetail={handleOpenLikedDetail}
                      onRequestUnlike={requestUnlike}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* 우측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
          </div>
        </main>

        <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">{selectedCategory?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <CategoryPlacesMap
                open={categoryDetailOpen}
                places={(selectedCategory?.places ?? []).map((place) => ({
                  id: place.id,
                  name: place.name,
                  latitude: place.latitude,
                  longitude: place.longitude,
                }))}
                focusedPlaceId={focusedPlaceId}
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 목록</p>
                {/* UserRequest: 장소 개수와 무관하게 상세보기 목록 영역 높이를 고정하고 최소 행 슬롯으로 구분선 유지 */}
                <div className="h-48 border border-border rounded-lg divide-y divide-border overflow-y-auto bg-muted/20">
                  {detailPlaces.length === 0 ? (
                    <>
                      <div className="h-14 px-3 flex items-center text-sm text-muted-foreground">
                        {MESSAGES.savedCategory.noPlacesInDetail}
                      </div>
                      {Array.from({ length: detailMinRows - 1 }).map((_, index) => (
                        <div key={`detail-empty-initial-${index}`} className="h-14" />
                      ))}
                    </>
                  ) : (
                    <>
                      {detailPlaces.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setFocusedPlaceId(place.id)}
                        className="w-full min-h-14 text-left p-3 flex flex-col justify-center gap-1 hover:bg-accent/40 transition-colors"
                      >
                        <span className="text-sm font-medium">{place.name}</span>
                        <span className="text-xs text-muted-foreground">{place.addressName}</span>
                      </button>
                      ))}
                      {Array.from({ length: detailEmptyRows }).map((_, index) => (
                        <div key={`detail-empty-tail-${index}`} className="h-14" />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={unlikeDialogOpen} onOpenChange={setUnlikeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{MESSAGES.likedCategory.unlikeConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingUnlike?.title
                  ? MESSAGES.likedCategory.unlikeConfirmDescription(pendingUnlike.title)
                  : MESSAGES.likedCategory.unlikeConfirmDescription('선택한 카테고리')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnlike}>해제하기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SharedCategoryDetailDialog
          open={likedDetailOpen}
          onOpenChange={setLikedDetailOpen}
          category={selectedLikedCategory}
        />

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              resetCreateDialog();
              setCategoryDialogMode('create');
              setEditingCategoryId(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{categoryDialogMode === 'edit' ? '카테고리 수정' : '새 카테고리 추가'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">카테고리 이름</p>
                <Input
                  placeholder="예: 맛집 투어"
                  value={newCategoryTitle}
                  onChange={(event) => setNewCategoryTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">추가된 장소</p>
                {/* UserRequest: 검색 결과 영역과 동일한 높이로 고정하고 스크롤로 관리 */}
                <div className="max-h-56 overflow-y-auto overflow-x-hidden border border-border rounded-lg divide-y divide-border">
                  {selectedPlaces.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">{MESSAGES.savedCategory.noPlacesSelected}</div>
                  ) : (
                    selectedPlaces.map((place) => (
                      <div key={place.id} className="p-3 flex items-center gap-3">
                        <div className="text-primary">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePlace(place.id)}
                          aria-label="장소 제거"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">장소 검색</p>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    className="flex-1 min-w-0"
                    placeholder="장소 이름이나 주소 검색"
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
                    className="shrink-0 gap-2"
                  >
                    <Search className="w-4 h-4" />
                    검색
                  </Button>
                </div>
                {placeSearchLoading && (
                  <div className="text-sm text-muted-foreground">{MESSAGES.workspaceCategory.searching}</div>
                )}
                {!placeSearchLoading && placeResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto overflow-x-hidden border border-border rounded-lg divide-y divide-border">
                    {placeResults.map((place) => (
                      <div key={place.id} className="p-3 flex items-start gap-3">
                        <div className="mt-1 text-primary">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddPlace(place)}>
                          추가
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  취소
                </Button>
                {/* UserRequest: 필수 입력값이 없으면 생성 버튼을 비활성화 */}
                <Button
                  onClick={handleCreateCategory}
                  disabled={
                    createSavedCategoryMutation.isPending ||
                    updateSavedCategoryMutation.isPending ||
                    !newCategoryTitle.trim() ||
                    selectedPlaces.length === 0
                  }
                >
                  {createSavedCategoryMutation.isPending || updateSavedCategoryMutation.isPending
                    ? categoryDialogMode === 'edit'
                      ? '수정 중...'
                      : '생성 중...'
                    : categoryDialogMode === 'edit'
                      ? '수정'
                      : '생성'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{MESSAGES.savedCategory.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedForDelete && (
                  <>
                    {MESSAGES.savedCategory.deleteConfirmDescription(selectedForDelete.title)}
                    <br />
                    <span className="text-destructive">{MESSAGES.savedCategory.deleteConfirmWarning}</span>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteSavedCategoryMutation.isPending}
              >
                {deleteSavedCategoryMutation.isPending ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default MyCategory;
