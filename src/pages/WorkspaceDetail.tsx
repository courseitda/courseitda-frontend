import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserNickname, useUserDropdown } from '@/shared/hooks/use-user-info';
import { useWorkspace, useWorkspacesByOwner } from '@/shared/hooks/use-workspace';
import { useWorkspaceCategories } from '@/shared/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { CategoryList } from '@/features/categories/category-list';
import { MapCanvas } from '@/features/map/map-canvas';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, Check, Plus, LayoutGrid, User as UserIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import type { Place } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';

/**
 * 워크스페이스 상세 페이지 - 카테고리 관리 및 지도 표시
 * 지도와 카테고리 목록을 동시에 보여주며, 장소 클릭 시 지도에서 강조 표시
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const WorkspaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { nickname: navNickname } = useUserNickname(); // 네비게이터용 닉네임
  const { nickname: dropdownNickname, email } = useUserDropdown(); // 드롭다운용 닉네임 + 이메일
  const logout = useAuthStore((state) => state.logout);
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  // UserRequest: 모바일 뷰에서 Bottom Sheet 확장/축소 상태를 관리하여 지도/카테고리 높이를 전환
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetDragStartY = useRef(0);

  // UserRequest: Step 4 — 워크스페이스 상세 데이터를 React Query로 가져와 캐싱
  const {
    data: workspace,
    isLoading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace(id);

  // UserRequest: Step 4 — 내 워크스페이스 목록을 React Query로 가져와 전환 드롭다운에 활용
  const token = useAuthStore((state) => state.token);
  const {
    data: workspaces,
    isLoading: workspacesLoading,
    error: workspacesError,
  } = useWorkspacesByOwner(token);

  const {
    data: workspaceCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useWorkspaceCategories(workspace?.identifier);

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // UserRequest: Step 4 — 워크스페이스 조회 실패 시 사용자에게 즉시 안내
    if (workspaceError) {
      toast.error(workspaceError.message);
    }
  }, [workspaceError]);

  useEffect(() => {
    // UserRequest: Step 4 — 워크스페이스 목록 조회 실패 시 사용자에게 즉시 안내
    if (workspacesError) {
      toast.error(workspacesError.message);
    }
  }, [workspacesError]);

  useEffect(() => {
    if (categoriesError) {
      toast.error(categoriesError.message);
    }
  }, [categoriesError]);

  useEffect(() => {
    // UserRequest: 드래그 진행 중에는 전역 포인터 이벤트를 감지하여 Bottom Sheet 높이를 조정
    if (!isSheetDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaY = event.clientY - sheetDragStartY.current;
      if (Math.abs(deltaY) < 25) return;
      setIsSheetExpanded(deltaY < 0);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const deltaY = event.clientY - sheetDragStartY.current;
      if (Math.abs(deltaY) >= 15) {
        setIsSheetExpanded(deltaY < 0);
      } else {
        setIsSheetExpanded((previous) => !previous);
      }
      setIsSheetDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isSheetDragging]);

  // 워크스페이스 전환 - 다른 워크스페이스의 상세 페이지로 이동 (identifier 사용)
  const handleSelectWorkspace = (workspaceIdentifier: string) => {
    navigate(`/workspace/${workspaceIdentifier}`);
  };

  // UserRequest: Bottom Sheet 핸들 드래그 시작 시 기준 좌표를 기록하여 이동 방향 판단
  const handleSheetDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    sheetDragStartY.current = event.clientY;
    setIsSheetDragging(true);
  };

  // 로그아웃 처리 후 인증 상태 초기화 및 랜딩 페이지로 이동
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 데이터 로딩 중에는 스피너를 표시하여 진행 상황 안내
  if (workspaceLoading || workspacesLoading || categoriesLoading) {
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
        <p>워크스페이스를 찾을 수 없습니다.</p>
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
    />
  );

  // UserRequest: half-open / full-open 전환에 따라 지도와 Bottom Sheet 높이를 동적으로 계산
  const collapsedSheetHeight = '45vh';
  const layoutTopPadding = '0.625rem'; // 컨테이너 py-2.5
  // UserRequest: full-open 시 카테고리 영역 상단을 기존 지도 영역과 동일한 위치까지 끌어올림
  const mobileSheetHeight = isSheetExpanded ? `calc(100vh - 64px - ${layoutTopPadding})` : collapsedSheetHeight;
  // UserRequest: 디폴트 상태의 지도·카테고리 간 간격을 기존의 절반으로 줄이기 위해 map height를 재계산
  const collapsedMapHeight = `calc(((100vh - 64px) - ${collapsedSheetHeight} + ((100vh - 64px) * 0.45)) / 2)`;
  const mobileMapHeight = isSheetExpanded ? '0px' : collapsedMapHeight;

  return (
    <div className="h-screen bg-gradient-card flex flex-col overflow-hidden">
      {/* 헤더 */}
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur z-20 shrink-0">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* 좌측: 뒤로가기 버튼 - 워크스페이스 목록으로 이동 */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/workspaces')}
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            
            {/* 중앙: 워크스페이스 제목 드롭다운 - 다른 워크스페이스로 빠르게 전환 가능하도록 UX 개선 (중앙 정렬로 시각적 균형 유지) */}
            <div className="flex justify-center items-center min-w-0 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:opacity-70 transition-opacity">
                    <div className="flex items-center gap-1">
                      <h1 className="text-lg font-bold truncate max-w-[200px] md:max-w-[400px]">
                        {workspace.title}
                      </h1>
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <div className="max-h-[180px] overflow-y-auto">
                    {workspaces?.map((ws) => (
                      <DropdownMenuItem
                        key={ws.id}
                        onClick={() => handleSelectWorkspace(ws.identifier)}
                        className={`cursor-pointer justify-center font-semibold ${
                          ws.id === workspace.id 
                            ? 'bg-primary/10' 
                            : ''
                        }`}
                      >
                        <span className="truncate">{ws.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-1 pb-1">
                    <button
                      onClick={() => setCreateWorkspaceOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm rounded-sm border border-dashed border-border hover:bg-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      새 워크스페이스
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* 우측: 프로필 메뉴 */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-10">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium">{navNickname}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{dropdownNickname}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/mypage')} className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/workspaces')} className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    워크스페이스
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 - 모바일: 지도 상단 + Bottom Sheet, 데스크톱: 좌우 분할 */}
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <main className="flex-1 min-h-0 relative">
        <div className="container mx-auto px-4 h-full">
          <div className="h-full py-2.5 md:py-4 flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4">
            {/* 지도 영역 - Bottom Sheet 상태에 따라 높이 전환 */}
            <div
              className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card shrink-0 transition-all duration-300 ease-out md:!h-full relative z-0"
              style={{ height: mobileMapHeight, opacity: isSheetExpanded ? 0 : 1 }}
            >
              {naverMapKeyId ? (
                <MapCanvas
                  workspaceId={workspace.id}
                  workspaceIdentifier={workspace.identifier}
                  categories={workspaceCategories ?? []}
                  focusedPlace={focusedPlace}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      네이버 지도 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 카테고리 영역 - 데스크톱에서는 기존 카드 유지 */}
            {/* UserRequest: 카테고리 영역 패딩을 0.5배로 축소하여 공간 효율성 향상 (p-8 → p-4) */}
            <div className="hidden md:flex md:flex-col md:h-full md:min-h-0">
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
        <div className="md:hidden absolute inset-x-0 bottom-0 px-4 pb-0 pointer-events-none z-20">
          <div
            className="pointer-events-auto rounded-t-3xl border border-border/60 bg-card shadow-xl flex flex-col transition-[height,transform] duration-300 ease-out"
            style={{ height: mobileSheetHeight }}
          >
            {/* UserRequest: 시각적으로 강조된 Grabber Handle 제공 */}
            <div className="py-3 flex justify-center">
              <div
                className="w-20 h-2 rounded-full bg-muted-foreground/50 cursor-grab active:cursor-grabbing touch-none select-none"
                role="button"
                tabIndex={0}
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

      <CreateWorkspaceDialog 
        open={createWorkspaceOpen} 
        onOpenChange={setCreateWorkspaceOpen} 
      />
    </div>
  );
};

export default WorkspaceDetail;
