import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useWorkspacesByOwner } from '@/shared/hooks/use-workspace';
import { Plus, Trash2, LayoutGrid, MoreHorizontal } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { workspaceApi } from '@/services/api';
import type { Workspace } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/layout/page-header';
import { formatRelativeTimeKorean } from '@/shared/utils/relative-time';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

/**
 * 워크스페이스 목록 페이지 컴포넌트
 * 사용자의 모든 워크스페이스를 카드 형태로 표시하며, 생성/수정/삭제 기능 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyWorkspace = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Workspace | null>(null);
  const queryClient = useQueryClient();

  // 미인증 사용자 접근 차단 - 로그인 페이지로 리다이렉트하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // UserRequest: Step 4 — React Query로 내 워크스페이스 목록을 불러와 카드 리스트에 적용
  const token = useAuthStore((state) => state.token);
  const {
    data: workspaces = [],
    isLoading: workspacesLoading,
    error: workspacesError,
  } = useWorkspacesByOwner(token);
  // 최신 업데이트 순으로 정렬해 가장 최근 수정 워크스페이스를 우선 노출
  const sortedWorkspaces = [...workspaces].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  useEffect(() => {
    // UserRequest: Step 4 — 워크스페이스 목록 조회 실패 시 사용자에게 즉시 알림
    if (workspacesError) {
      toast.error(workspacesError.message || MESSAGES.workspace.loadFailed);
    }
  }, [workspacesError]);

  // UserRequest: Step 5 — React Query 뮤테이션으로 삭제 후 내 워크스페이스 캐시 무효화
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const { error } = await workspaceApi.delete(identifier);
      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
      toast.success(MESSAGES.workspace.deleteSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.workspace.deleteFailed;
      toast.error(message);
    },
    onSettled: () => {
      setDeleteAlertOpen(false);
      setSelectedForDelete(null);
    },
  });

  // 워크스페이스 선택 - identifier 기반으로 상세 페이지 이동
  const handleSelectWorkspace = (identifier: string) => {
    navigate(`/workspace/${identifier}`);
  };

  // 워크스페이스 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (workspace: Workspace) => {
    setSelectedForDelete(workspace);
    setDeleteAlertOpen(true);
  };

  // UserRequest: 롱프레스 대신 카드 우측 더보기 버튼으로 이름 바꾸기/삭제 메뉴를 노출한다.
  const renderWorkspaceCard = (workspace: Workspace) => (
    <Card
      key={workspace.id}
      className="hover-lift cursor-pointer"
      onClick={() => handleSelectWorkspace(workspace.identifier)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LayoutGrid className="w-5 h-5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-col gap-1">
            {/* UserRequest: 모바일 폰트 크기를 축소하고 워크스페이스 이름을 왼쪽 정렬하여 가독성 향상 (text-base) */}
            <CardTitle className="text-base md:text-lg truncate">
              {workspace.title}
            </CardTitle>
            {/* UserRequest: 수정 시간을 주/개월/년 단위까지 포함한 상대시간으로 표시한다. */}
            <p className="text-xs text-muted-foreground">
              업데이트 {formatRelativeTimeKorean(workspace.updatedAt)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="워크스페이스 더보기"
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
                handleDeleteClick(workspace);
              }}
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
    </Card>
  );

  // 워크스페이스 삭제 확정 - API 서비스 레이어를 통해 cascade delete 수행
  const handleDeleteConfirm = () => {
    if (!selectedForDelete || deleteWorkspaceMutation.isPending) return;

    deleteWorkspaceMutation.mutate(selectedForDelete.identifier);
  };

  // UserRequest: 기기별 모바일 화면 끝 직전까지 빈 상태 테두리가 자연스럽게 이어지도록 높이를 유연하게 확장한다.
  const renderEmptyState = (className: string) => (
    <div className={`border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center ${className}`}>
      <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">
        워크스페이스가 없습니다.
        <br />
        지금 추가해보세요!
      </p>
    </div>
  );

  // 데이터 로딩 중에는 중앙에 스피너를 표시하여 진행 상황 안내
  if (workspacesLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
    );
  }

  if (!workspaces) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">워크스페이스를 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>{UI_COPY.common.retry}</Button>
          </div>
        </div>
    );
  }

  return (
      <div className="flex min-h-dvh flex-col bg-gradient-card">
        {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
        <PageHeader title={UI_COPY.myWorkspace.pageTitle} />

        {/* 모바일 레이아웃 */}
        {/* UserRequest: 모바일 하단 safe area와 동적 viewport를 반영해 빈 상태 영역이 화면 끝 직전까지 이어지게 조정한다. */}
        {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
        <main className="container mx-auto flex flex-1 flex-col px-8 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:hidden">
          {/* UserRequest: 워크스페이스 목록 페이지에서 Tabs 제거 */}
          <div className="flex flex-1 flex-col">
            {/* UserRequest: 내 워크스페이스 페이지의 생성 진입 버튼을 이전 카드형 새 워크스페이스 UI로 되돌린다. */}
            <Card
                className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
                onClick={() => setCreateOpen(true)}
            >
              <CardHeader className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-primary">
                  <Plus className="w-5 h-5" />
                  <CardTitle className="text-base md:text-lg text-primary">{UI_COPY.myWorkspace.createAction}</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <div className="mt-2.5 flex flex-1 flex-col">
              {sortedWorkspaces.length === 0
                ? renderEmptyState('flex-1 min-h-[clamp(18rem,calc(100dvh-12rem),40rem)]')
                : (
                  <div className="space-y-2.5">
                    {/* UserRequest: 워크스페이스 간격을 0.3배로 축소하여 공간 효율성 향상 (gap-8 → gap-2.5) */}
                    {sortedWorkspaces?.map((workspace) => (
                      renderWorkspaceCard(workspace)
                    ))}
                  </div>
                )}
            </div>
          </div>
        </main>

        {/* 데스크톱 레이아웃 - 3단 구조 */}
        {/* UserRequest: 데스크톱 화면에서 워크스페이스가 적어도 전체 영역 높이를 보장하여 시각적 안정감 제공 (min-h-[calc(100vh-80px)]) */}
        <main className="hidden flex-1 md:block min-h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
            {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

            {/* 중앙: 워크스페이스 목록 콘텐츠 */}
            <div className="flex min-h-[calc(100vh-80px)] flex-col overflow-y-auto px-8 py-4">
              {/* UserRequest: 워크스페이스 목록 페이지에서 Tabs 제거 */}
              <div className="flex flex-1 flex-col">
                {/* UserRequest: 내 워크스페이스 페이지의 생성 진입 버튼을 이전 카드형 새 워크스페이스 UI로 되돌린다. */}
                <Card
                    className="hover-lift cursor-pointer border-border bg-card hover:bg-accent/40 transition-colors"
                    onClick={() => setCreateOpen(true)}
                >
                  <CardHeader className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-primary">
                      <Plus className="w-5 h-5" />
                      <CardTitle className="text-base md:text-lg text-primary">{UI_COPY.myWorkspace.createAction}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
                <div className="mt-2 flex flex-1 flex-col">
                  {sortedWorkspaces.length === 0
                    ? renderEmptyState('flex-1 min-h-[clamp(20rem,calc(100vh-14rem),42rem)] p-10')
                    : (
                      <div className="space-y-2">
                        {/* UserRequest: 데스크톱 워크스페이스 간격을 space-y-2 (8px)로 설정하여 적절한 여백 제공 */}
                        {sortedWorkspaces?.map((workspace) => (
                          renderWorkspaceCard(workspace)
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* 우측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
          </div>
        </main>

        <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />

        <DeleteConfirmDialog
          open={deleteAlertOpen}
          onOpenChange={setDeleteAlertOpen}
          title={UI_COPY.myWorkspace.deleteDialog.title}
          description={
            selectedForDelete ? (
              <>
                {UI_COPY.myWorkspace.deleteDialog.description(selectedForDelete.title)}
                <br />
                <span className="text-destructive">{UI_COPY.myWorkspace.deleteDialog.warning}</span>
              </>
            ) : null
          }
          onConfirm={handleDeleteConfirm}
          pending={deleteWorkspaceMutation.isPending}
        />
      </div>
  );
};

export default MyWorkspace;
