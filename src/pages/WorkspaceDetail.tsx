import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/shared/hooks/use-workspace';
import { useWorkspaceCategories } from '@/shared/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { CategoryList } from '@/features/categories/category-list';
import { MapCanvas } from '@/features/map/map-canvas';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { toast } from 'sonner';
import { Check, Maximize2, Minimize2, PenLine } from 'lucide-react';
import type { Place } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';
import PageHeader from '@/components/layout/page-header';
import UserMenu from '@/components/header/user-menu';
import { MESSAGES } from '@/shared/constants/messages';
import { useRequireAuthRedirect } from '@/shared/hooks/use-require-auth-redirect';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';
import { useWorkspaceDetailLayout } from '@/shared/hooks/use-workspace-detail-layout';

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
      representativePlaceName: representativePlace?.place.name ?? '미지정',
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
              aria-label="워크스페이스 이름 변경"
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
            {/* 지도 영역 - Bottom Sheet 상태에 따라 높이 전환 */}
            <div
              className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card shrink-0 transition-all duration-300 ease-out relative z-0 md:!h-full"
              style={{ height: mobileMapHeight, opacity: fullscreenActive ? 1 : isSheetExpanded ? 0 : 1 }}
            >
              {fullscreenActive && (
                <div className="absolute bottom-3 left-3 z-20 w-[min(14rem,calc(100%-5rem))] rounded-xl border border-border/60 bg-background/88 p-2 shadow-xl backdrop-blur-sm">
                  {/* UserRequest: 지도 크게 보기에서는 좌상단 요약 창을 더 작게 유지하고 불필요한 제목 문구는 제거한다. */}
                  <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                    {categorySummaryItems.map((item) => (
                      <button
                        type="button"
                        key={item.categoryName}
                        className={`flex w-full items-center gap-2 rounded-lg border border-border/50 bg-card/85 px-2 py-1.5 text-left transition-colors ${
                          item.representativePlace
                            ? 'hover:bg-accent/70 active:bg-accent'
                            : 'cursor-default opacity-70'
                        }`}
                        onClick={() => {
                          if (!item.representativePlace) return;
                          setFocusedPlace(item.representativePlace);
                        }}
                        disabled={!item.representativePlace}
                      >
                        {/* UserRequest: 지도 요약 창에도 카테고리 목록과 같은 색상 원형 배지와 순번을 함께 표시한다. */}
                        <div
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.sequence}
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-xs font-semibold">{item.categoryName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{item.representativePlaceName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* UserRequest: 지도 전체 화면 토글 버튼을 아이콘 형태로 배치 */}
              <div className="absolute top-3 right-3 z-20 flex gap-2 md:hidden">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/70 text-foreground border border-transparent hover:bg-background/60 active:bg-background/50 focus-visible:outline-none focus-visible:ring-0 rounded-full"
                  onClick={() => setIsMapFullscreen((previous) => !previous)}
                  aria-label={isMapFullscreen ? '지도 일반 보기' : '지도 전체 화면 보기'}
                >
                  {isMapFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {naverMapKeyId ? (
                <MapCanvas
                  workspaceId={workspace.id}
                  workspaceIdentifier={workspace.identifier}
                  categories={workspaceCategories ?? []}
                  focusedPlace={focusedPlace}
                  isFullscreen={fullscreenActive}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {UI_COPY.workspaceDetail.mapNotReady}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 카테고리 영역 - 데스크톱에서는 기존 카드 유지 */}
            {/* UserRequest: 카테고리 영역 패딩을 0.5배로 축소하여 공간 효율성 향상 (p-8 → p-4) */}
            {/* UserRequest: 전체 화면에서도 카테고리 칼럼 폭은 유지하되 콘텐츠만 숨겨 지도 폭이 변하지 않도록 처리 */}
            <div
              className={`hidden md:flex md:flex-col md:h-full md:min-h-0 transition-opacity duration-300 ${
                fullscreenActive ? 'md:opacity-0 md:pointer-events-none' : 'md:opacity-100'
              }`}
              aria-hidden={fullscreenActive}
            >
              {/* UserRequest: 데스크톱에서도 사용자가 카테고리 목록을 드래그(스크롤)할 수 있도록 min-height 제약을 적용 */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto rounded-xl border border-border/50 bg-card p-4 min-h-0">
                  {categoryListSection}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sheet - 모바일에서만 노출 */}
        {/* UserRequest: Bottom Sheet가 네이버 지도 로고/워터마크보다 위에 렌더되도록 z-index 보정 */}
        {/* UserRequest: 모바일에서는 시트가 화면 하단과 바로 맞닿도록 바깥 여백 제거 */}
        <div className="md:hidden absolute inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)] pointer-events-none z-20">
          <div
            // UserRequest: 모바일에서 지도 전체보기 전환 시에도 카테고리 영역을 언마운트하지 않고 접어서 모드 상태를 유지한다.
            className={`rounded-t-3xl border border-border/60 bg-card shadow-xl flex flex-col transition-[height,transform,opacity] duration-300 ease-out overflow-hidden ${
              fullscreenActive ? 'pointer-events-none opacity-0 translate-y-full' : 'pointer-events-auto opacity-100 translate-y-0'
            }`}
            style={{ height: fullscreenActive ? '0px' : mobileSheetHeight }}
          >
            {/* UserRequest: 시각적으로 강조된 Grabber Handle 제공 */}
            <div className="py-3 flex justify-center">
              <div
                className="w-20 h-2 rounded-full bg-muted-foreground/50 cursor-grab active:cursor-grabbing touch-none select-none"
                role="button"
                tabIndex={fullscreenActive ? -1 : 0}
                aria-label="카테고리 패널 높이 조절"
                onPointerDown={handleSheetDragStart}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsSheetExpanded((previous) => !previous);
                  }
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {categoryListSection}
            </div>
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
