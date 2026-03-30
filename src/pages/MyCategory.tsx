import {type CSSProperties, type ReactNode, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Card, CardHeader, CardTitle} from '@/components/ui/card';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {useAuthStore} from '@/shared/stores/auth-store';
import {Folder, Heart, MoreHorizontal, Plus, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Spinner} from '@/components/ui/spinner';
import {useDeleteSavedCategory, useMySavedCategories,} from '@/shared/hooks/use-my-storage';
import { communityApi } from '@/services/api';
import {MESSAGES} from '@/shared/constants/messages';
import type {SavedCategory, SharedSavedCategory} from '@/entities/types';
import PageHeader from '@/components/layout/page-header';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import {formatRelativeTimeKorean} from '@/shared/utils/relative-time';
import {UI_COPY} from '@/shared/constants/ui-copy';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';
import { useRequireAuthRedirect } from '@/shared/hooks/use-require-auth-redirect';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import SharedCategoryList from '@/components/community/shared-category-list';
import SharedCategoryDetailDialog from '@/components/community/shared-category-detail-dialog';
import { COMMUNITY_QUERY_KEYS, useMyLikedSharedCategories } from '@/shared/hooks/use-community';
import { useSharedCategoryLike } from '@/shared/hooks/use-shared-category-like';

/**
 * 내 카테고리 페이지 컴포넌트
 * 카테고리 목록 생성/수정/삭제와 상세 확인 흐름만 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyCategory = () => {
    const CATEGORY_NAME_MAX_LENGTH = 10;
    const navigate = useNavigate();
    const {token} = useAuthStore();
    const [activeSection, setActiveSection] = useState<'archive' | 'favorite'>('archive');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState<SavedCategory | null>(null);
    const [selectedFavoriteCategory, setSelectedFavoriteCategory] = useState<SharedSavedCategory | null>(null);
    const [favoriteDetailOpen, setFavoriteDetailOpen] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');

    // UserRequest: 내 카테고리 목록은 service 계층 API + React Query로 로딩 (컴포넌트 내부 mock 제거)
    const {
        data: savedCategories = [],
        isLoading: savedCategoriesLoading,
        isFetching: savedCategoriesFetching,
        error: savedCategoriesError,
    } = useMySavedCategories(token);
    const {
        data: likedCategories = [],
        isLoading: likedCategoriesLoading,
        isFetching: likedCategoriesFetching,
        error: likedCategoriesError,
    } = useMyLikedSharedCategories(token);
    const deleteSavedCategoryMutation = useDeleteSavedCategory(token);
    const { toggleLike } = useSharedCategoryLike({
        queryKey: [...COMMUNITY_QUERY_KEYS.liked, token],
        token,
        isAuthenticated: true,
        setSelectedCategory: setSelectedFavoriteCategory,
    });

    // UserRequest: 반복되는 인증 리다이렉트 로직을 공통 훅으로 통합
    useRequireAuthRedirect();

    // UserRequest: 내 카테고리 목록 조회 실패 시 사용자에게 즉시 알림
    useQueryErrorToast(savedCategoriesError, MESSAGES.savedCategory.listLoadFailed);
    // UserRequest: 찜 탭은 내가 찜한 공유 카테고리 목록 API 오류를 즉시 노출한다.
    useQueryErrorToast(likedCategoriesError, MESSAGES.sharedCategory.searchLoadFailed);

    // UserRequest: 카테고리 카드 클릭 시 상세 페이지로 이동하여 이름/지도/장소 목록을 보여줌
    const handleOpenCategory = (categoryId: string) => {
        navigate(`/my-category/${categoryId}`);
    };

    const resetCreateDialog = () => {
        setNewCategoryTitle('');
    };

    const handleOpenCreateDialog = () => {
        // UserRequest: 새 카테고리 추가 버튼 클릭 시 생성 팝업 노출
        resetCreateDialog();
        setCreateDialogOpen(true);
    };

    const handleChangeNewCategoryTitle = (value: string) => {
        if (value.length > CATEGORY_NAME_MAX_LENGTH) {
            toast.error(UI_COPY.myCategory.nameMaxLength);
            return;
        }

        setNewCategoryTitle(value);
    };

    const handleProceedToCreatePage = () => {
        if (!newCategoryTitle.trim()) {
            toast.error(UI_COPY.myCategory.nameRequired);
            return;
        }
        if (newCategoryTitle.trim().length > CATEGORY_NAME_MAX_LENGTH) {
            toast.error(UI_COPY.myCategory.nameMaxLength);
            return;
        }

        // UserRequest: 내 카테고리 상세보기는 유지하고, 동일한 레이아웃의 생성 전용 페이지로 이동한다.
        navigate('/my-category/new', {
            state: {
                draftTitle: newCategoryTitle.trim(),
            },
        });
        setCreateDialogOpen(false);
        resetCreateDialog();
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

    const handleOpenFavoriteCategory = (category: SharedSavedCategory) => {
        // UserRequest: 찜 탭 카드 클릭 시 공유 카테고리 상세 API를 조회한 뒤 동일한 상세 모달을 연다.
        void (async () => {
            const response = await communityApi.getSharedCategoryDetail(category.id);
            if (!response.success || !response.data) {
                toast.error(response.error?.message ?? MESSAGES.sharedCategory.fetchDetailFailed);
                return;
            }

            const shared = response.data.sharedCategories[0];
            if (!shared) {
                toast.error(MESSAGES.sharedCategory.fetchDetailFailed);
                return;
            }

            setSelectedFavoriteCategory({
                id: shared.id,
                title: shared.title,
                uploader: shared.uploaderNickname,
                uploadedAt: shared.uploadedAt,
                isImmutableSnapshot: true,
                liked: category.liked,
                likeCount: shared.likeCount,
                placeCount: shared.placeCount,
                places: shared.places,
            });
            setFavoriteDetailOpen(true);
        })();
    };

    const handleFavoriteToggle = (category: SharedSavedCategory) =>
        toggleLike({ sharedCategoryId: category.id, currentLiked: !!category.liked });

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
                        <div
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                            <Folder className="w-4 h-4"/>
                        </div>
                        <span
                            className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
              {category.placeCount}
            </span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <CardTitle className="min-w-0 truncate text-base">{category.title}</CardTitle>
                        </div>
                        {/* UserRequest: 수정 시간을 주/개월/년 단위까지 포함한 상대시간으로 표시한다. */}
                        <p className="text-xs text-muted-foreground">
                            {UI_COPY.myCategory.updatedPrefix} {formatRelativeTimeKorean(category.updatedAt)}
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
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground"/>
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
                            <Trash2 className="w-4 h-4"/>
                            {UI_COPY.myCategory.deleteAction}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
        </Card>
    );

    // UserRequest: 내 카테고리가 비어 있거나 조회 실패해도 초기 fetch 중일 때만 전체 로딩 스피너를 노출한다.
    if (
        savedCategoriesLoading &&
        savedCategoriesFetching &&
        savedCategories.length === 0 &&
        !savedCategoriesError &&
        likedCategoriesLoading &&
        likedCategoriesFetching &&
        likedCategories.length === 0 &&
        !likedCategoriesError
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner className="w-8 h-8"/>
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

    // UserRequest: 기기별 모바일 화면 끝 직전까지 빈 상태 테두리가 자연스럽게 이어지도록 높이를 유연하게 확장한다.
    const renderEmptyState = (
        icon: ReactNode,
        message: string,
        className = '',
        style?: CSSProperties,
    ) => (
        <div
            style={style}
            className={`border-2 border-dashed border-border rounded-xl p-5 text-center flex flex-col items-center justify-center sm:p-8 md:p-10 ${className}`}>
            {icon}
            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
    );

    // UserRequest: 카테고리 상단에 좌측 보관 탭과 우측 찜 탭을 추가하고 기존 화면은 보관 탭에 연결한다.
    const renderTabHeader = () => (
        <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
            <TabsTrigger value="archive" className="flex items-center gap-1.5">
                <Folder className="w-4 h-4"/>
                {UI_COPY.myCategory.archiveTab}
            </TabsTrigger>
            <TabsTrigger value="favorite" className="flex items-center gap-1.5">
                <Heart className="w-4 h-4"/>
                {UI_COPY.myCategory.favoriteTab}
            </TabsTrigger>
        </TabsList>
    );

    // UserRequest: 보관 탭의 새 카테고리 추가 버튼은 찜 탭 높이 기준에도 사용되므로 동일한 구조로 분리한다.
    const renderCreateCategoryCard = (hidden = false) => (
        <Card
            aria-hidden={hidden}
            className={`hover-lift cursor-pointer border-border bg-card transition-colors ${
                hidden ? 'invisible pointer-events-none' : 'hover:bg-accent/40'
            }`}
            onClick={hidden ? undefined : handleOpenCreateDialog}
        >
            <CardHeader className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-primary">
                    <Plus className="w-5 h-5"/>
                    <CardTitle
                        className="text-base md:text-lg text-primary">{UI_COPY.myCategory.createAction}</CardTitle>
                </div>
            </CardHeader>
        </Card>
    );

    // UserRequest: 현재의 카테고리 생성/목록 화면은 보관 탭 콘텐츠로 유지한다.
    const renderArchiveContent = () => (
        <div className="space-y-3 md:space-y-2">
            {renderCreateCategoryCard()}

            {savedCategories.length === 0
                ? renderEmptyState(
                    <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60"/>,
                    `${UI_COPY.myCategory.empty.title}\n${UI_COPY.myCategory.empty.description}`,
                    'h-[calc(100dvh-18rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-16rem)]',
                )
                : (
                    <div className="space-y-3 md:space-y-2">
                        {savedCategories.map((category) => renderSavedCategoryCard(category))}
                    </div>
                )}
        </div>
    );

    // UserRequest: 찜 탭은 내가 찜한 공유 카테고리 목록 API를 사용해 실제 데이터를 표시한다.
    const renderFavoriteContent = () => (
        <div className="relative">
            {/* UserRequest: 찜 탭은 보관 탭의 시작점/하단과 동일한 영역을 가져야 하므로 보관 구조를 보이지 않게 유지한다. */}
            <div className="pointer-events-none invisible space-y-3 md:space-y-2" aria-hidden="true">
                {renderCreateCategoryCard(true)}
                {renderEmptyState(
                    <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60"/>,
                    `${UI_COPY.myCategory.empty.title}\n${UI_COPY.myCategory.empty.description}`,
                    'h-[calc(100dvh-18rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-16rem)]',
                )}
            </div>
            <div className="absolute inset-0">
                {likedCategories.length === 0
                    ? renderEmptyState(
                        <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60"/>,
                        `${UI_COPY.myCategory.favoriteEmpty.title}\n${UI_COPY.myCategory.favoriteEmpty.description}`,
                        'h-full',
                    )
                    : (
                        <SharedCategoryList
                            categories={likedCategories}
                            onOpenDetail={handleOpenFavoriteCategory}
                            onFavoriteClick={handleFavoriteToggle}
                            viewportClassName="h-full"
                        />
                    )}
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-gradient-card">
            {/* UserRequest: 뒤로가기 버튼은 직전 페이지로 이동 */}
            {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
            <PageHeader title={UI_COPY.myCategory.pageTitle} desktopSideLayout/>

            {/* 모바일 레이아웃 */}
            {/* UserRequest: 모바일 하단 safe area와 동적 viewport를 반영해 빈 상태 영역이 화면 끝 직전까지 이어지게 조정한다. */}
            {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
            <main
                className="container mx-auto px-8 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:hidden">
                <Tabs
                    value={activeSection}
                    onValueChange={(value) => setActiveSection(value as 'archive' | 'favorite')}
                >
                    {renderTabHeader()}
                    <TabsContent value="archive" className="mt-0">
                        {renderArchiveContent()}
                    </TabsContent>
                    <TabsContent value="favorite" className="mt-0">
                        {renderFavoriteContent()}
                    </TabsContent>
                </Tabs>
            </main>

            {/* 데스크톱 레이아웃 */}
            {/* UserRequest: 카테고리 상세를 제외한 데스크톱 화면도 모바일과 동일한 단일 컬럼 흐름으로 동작하게 맞춘다. */}
            <DesktopSideLayout className="hidden min-h-[calc(100vh-80px)] flex-1 md:grid" contentClassName="min-h-[calc(100vh-80px)]">
                <main className="px-8 py-6">
                    <Tabs
                        value={activeSection}
                        onValueChange={(value) => setActiveSection(value as 'archive' | 'favorite')}
                    >
                        {renderTabHeader()}
                        <TabsContent value="archive" className="mt-0">
                            {renderArchiveContent()}
                        </TabsContent>
                        <TabsContent value="favorite" className="mt-0">
                            {renderFavoriteContent()}
                        </TabsContent>
                    </Tabs>
                </main>
            </DesktopSideLayout>

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
                                onChange={(event) => handleChangeNewCategoryTitle(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleProceedToCreatePage();
                                    }
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                            >
                                {UI_COPY.myCategory.editorDialog.cancel}
                            </Button>
                            <Button
                                onClick={handleProceedToCreatePage}
                                disabled={!newCategoryTitle.trim()}
                            >
                                {UI_COPY.myCategory.editorDialog.proceedToPlaceAction}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteAlertOpen}
                onOpenChange={setDeleteAlertOpen}
                title={UI_COPY.myCategory.deleteDialog.title}
                description={
                    <>
                        {selectedForDelete
                            ? UI_COPY.myCategory.deleteDialog.description(selectedForDelete.title)
                            : UI_COPY.myCategory.deleteDialog.description(UI_COPY.common.selectedFallback)}
                        <br/>
                        <span className="text-destructive">{UI_COPY.myCategory.deleteDialog.warning}</span>
                    </>
                }
                onConfirm={handleDeleteConfirm}
                pending={deleteSavedCategoryMutation.isPending}
            />
            <SharedCategoryDetailDialog
                open={favoriteDetailOpen}
                onOpenChange={setFavoriteDetailOpen}
                category={selectedFavoriteCategory}
                onFavoriteClick={handleFavoriteToggle}
            />
        </div>
    );
};

export default MyCategory;
