import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/shared/hooks/use-workspace';
import { useWorkspaceCategories } from '@/shared/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { CategoryList } from '@/features/categories/category-list';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { PenLine } from 'lucide-react';
import type { Place } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';
import PageHeader from '@/components/layout/page-header';
import UserMenu from '@/components/header/user-menu';
import { MESSAGES } from '@/shared/constants/messages';
import { useRequireAuthRedirect } from '@/shared/hooks/use-require-auth-redirect';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import { useWorkspaceDetailLayout } from '@/shared/hooks/use-workspace-detail-layout';
import { WorkspaceDetailMapPane } from '@/features/workspaces/workspace-detail-map-pane';
import { WorkspaceDetailCategoryPanels } from '@/features/workspaces/workspace-detail-category-panels';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 워크스페이스 상세 페이지 - 카테고리 관리 및 지도 표시
 * 지도와 카테고리 목록을 동시에 보여주며, 장소 클릭 시 지도에서 강조 표시
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const WorkspaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [editWorkspaceOpen, setEditWorkspaceOpen] = useState(false);
  const [startInCategoryEditMode] = useState(() => location.state?.startInCategoryEditMode === true);
  const {
    headerRef,
    isSheetExpanded,
    isMapFullscreen,
    fullscreenActive,
    mobileSheetHeight,
    mobileMapHeight,
    setIsSheetExpanded,
    setIsMapFullscreen,
    handleSheetDragStart,
  } = useWorkspaceDetailLayout();

  // UserRequest: Step 4 — 워크스페이스 상세 데이터를 React Query로 가져와 캐싱
  const {
    data: workspace,
    isLoading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace(id);

  const {
    data: workspaceCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useWorkspaceCategories(workspace?.identifier);

  // UserRequest: 반복되는 인증 리다이렉트 로직을 공통 훅으로 통합
  useRequireAuthRedirect();

  // UserRequest: Step 4 — 워크스페이스 조회 실패 시 사용자에게 즉시 안내
  useQueryErrorToast(workspaceError, MESSAGES.workspace.loadFailed);
  useQueryErrorToast(categoriesError, MESSAGES.workspaceCategory.listLoadFailed);

  useEffect(() => {
    // UserRequest: 워크스페이스 생성 직후에만 편집 모드로 진입하고 새로고침/재방문 시에는 기본 보기 모드로 되돌린다.
    if (!startInCategoryEditMode) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, startInCategoryEditMode]);

  // 로그아웃 처리 후 인증 상태 초기화 및 랜딩 페이지로 이동
  // 데이터 로딩 중에는 스피너를 표시하여 진행 상황 안내
  if (workspaceLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // 워크스페이스가 로드되지 않았으면 진입 불가 메시지 출력
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{UI_COPY.workspaceDetail.notFound}</p>
      </div>
    );
  }

  // UserRequest: 동일한 카테고리 목록을 데스크톱/모바일에서 공유하여 UI 일관성 유지
  const categoryListSection = (
    <CategoryList
      workspaceIdentifier={workspace.identifier}
      categories={workspaceCategories ?? []}
      isError={Boolean(categoriesError)}
      onPlaceClick={setFocusedPlace}
      initialIsOrderEditMode={!startInCategoryEditMode}
    />
  );

  // UserRequest: 지도 크게 보기 상태에서 카테고리명과 대표 장소명을 한눈에 볼 수 있는 요약 데이터를 구성한다.
  const categorySummaryItems = (workspaceCategories ?? []).map(({ category, places }, index) => {
    const representativePlace = places.find((item) => item.id === category.representativePlaceId || item.isRepresentative);

    return {
      sequence: index + 1,
      color: category.color,
      categoryName: category.name,
      representativePlace: representativePlace?.place ?? null,
      representativePlaceName: representativePlace?.place.name ?? UI_COPY.system.notSpecified,
    };
  });

  return (
    <div className="h-screen bg-gradient-card flex flex-col overflow-hidden">
      {/* 헤더 */}
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      <PageHeader
        headerRef={headerRef}
        showBackButton
        showBrand={false}
        showBrandText={false}
        className="z-20 shrink-0"
        centerContent={(
          <div className="relative flex items-center justify-center min-w-0">
            <h1 className="max-w-[180px] text-center text-lg font-bold truncate md:max-w-[320px]">
              {workspace.title}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-full ml-1 h-8 w-8 shrink-0"
              aria-label={UI_COPY.workspaceDetail.renameAriaLabel}
              onClick={() => setEditWorkspaceOpen(true)}
            >
              <PenLine className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        )}
        rightContent={<UserMenu currentWorkspaceLabel={workspace.title} />}
      />

      {/* 메인 콘텐츠 - 모바일: 지도 상단 + Bottom Sheet, 데스크톱: 좌우 분할 */}
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <main className="flex-1 min-h-0 relative">
        {/* UserRequest: 지도 영역과 카테고리 영역이 화면 가로폭을 최대한 사용하도록 container 최대폭 제한을 제거한다. */}
        {/* UserRequest: 지도 카드와 카테고리 카드가 화면 양 끝까지 보이도록 메인 래퍼의 좌우 패딩을 제거한다. */}
        <div className="w-full h-full">
          {/* UserRequest: 지도 영역이 헤더 바로 아래에서 시작하도록 상단 패딩을 제거하고 하단 여백만 유지한다. */}
          <div className="h-full pb-2.5 md:pb-4 flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4">
            <WorkspaceDetailMapPane
              workspaceId={workspace.id}
              workspaceIdentifier={workspace.identifier}
              categories={workspaceCategories ?? []}
              categorySummaryItems={categorySummaryItems}
              focusedPlace={focusedPlace}
              fullscreenActive={fullscreenActive}
              isSheetExpanded={isSheetExpanded}
              isMapFullscreen={isMapFullscreen}
              naverMapKeyId={naverMapKeyId}
              mobileMapHeight={mobileMapHeight}
              onToggleFullscreen={() => setIsMapFullscreen((previous) => !previous)}
              onSelectSummaryPlace={setFocusedPlace}
            />

            <WorkspaceDetailCategoryPanels
              categoryListSection={categoryListSection}
              fullscreenActive={fullscreenActive}
              mobileSheetHeight={mobileSheetHeight}
              onSheetDragStart={handleSheetDragStart}
              onToggleSheetExpanded={() => setIsSheetExpanded((previous) => !previous)}
            />
          </div>
        </div>
      </main>
      <EditWorkspaceDialog
        open={editWorkspaceOpen}
        onOpenChange={setEditWorkspaceOpen}
        workspace={workspace}
      />
    </div>
  );
};

export default WorkspaceDetail;
