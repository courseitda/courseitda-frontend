import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useWorkspacesByOwner } from '@/shared/hooks/use-workspace';
import { Plus, Pencil, Trash2, Clock, LayoutGrid, Heart, ArrowLeft } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { workspaceApi } from '@/services/api';
import type { Workspace } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import UserMenu from '@/components/header/user-menu';

/**
 * 워크스페이스 목록 페이지 컴포넌트
 * 사용자의 모든 워크스페이스를 카드 형태로 표시하며, 생성/수정/삭제 기능 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const Workspaces = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Workspace | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Workspace | null>(null);
  // UserRequest: 내 워크스페이스 진입 시 기본 탭을 워크스페이스로 고정하여 워크스페이스 목록이 바로 노출되도록 관리
  const [activeSection, setActiveSection] = useState<'workspaces' | 'liked'>('workspaces');
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
      toast.error(workspacesError.message);
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
      toast.success('워크스페이스가 삭제되었습니다.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '워크스페이스 삭제에 실패했습니다.';
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

  // 워크스페이스 수정 다이얼로그 열기
  const handleEdit = (workspace: Workspace) => {
    setSelectedForEdit(workspace);
    setEditOpen(true);
  };

  // 워크스페이스 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (workspace: Workspace) => {
    setSelectedForDelete(workspace);
    setDeleteAlertOpen(true);
  };

  // 워크스페이스 삭제 확정 - API 서비스 레이어를 통해 cascade delete 수행
  const handleDeleteConfirm = () => {
    if (!selectedForDelete || deleteWorkspaceMutation.isPending) return;

    deleteWorkspaceMutation.mutate(selectedForDelete.identifier);
  };

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
            <Button variant="outline" onClick={() => window.location.reload()}>새로고침</Button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-card">
        <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 md:py-3">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              {/* UserRequest: 헤더 좌측에 뒤로가기 버튼을 배치해 워크스페이스 상세 페이지와 일관된 네비게이션 제공 */}
              <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    aria-label="뒤로가기"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>

              {/* UserRequest: 헤더 중앙에 현재 위치를 명확히 표시하기 위해 제목을 추가 */}
              <div className="flex justify-center items-center">
                <h1 className="text-lg font-semibold">내 워크스페이스</h1>
              </div>

            <div className="flex items-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

        {/* 모바일 레이아웃 */}
        {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
        <main className="md:hidden container mx-auto px-4 py-6">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'workspaces' | 'liked')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="workspaces" className="flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" />
                워크스페이스
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                찜
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspaces" className="mt-0">
              <div className="grid grid-cols-1 gap-2.5">
                <Card
                    className="border-dashed hover-lift cursor-pointer"
                    onClick={() => setCreateOpen(true)}
                >
                  <CardHeader className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-primary">
                      <Plus className="w-5 h-5" />
                      <CardTitle className="text-base md:text-lg text-primary">새 워크스페이스</CardTitle>
                    </div>
                    {sortedWorkspaces && sortedWorkspaces.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">워크스페이스가 없습니다. 지금 추가해보세요!</p>
                    )}
                  </CardHeader>
                </Card>

                {/* UserRequest: 워크스페이스 간격을 0.3배로 축소하여 공간 효율성 향상 (gap-8 → gap-2.5) */}
                {sortedWorkspaces?.map((workspace) => (
                    <ContextMenu key={workspace.id}>
                      <ContextMenuTrigger asChild>
                        <Card
                            className="hover-lift cursor-pointer"
                            onClick={() => handleSelectWorkspace(workspace.identifier)}
                        >
                          <CardHeader className="flex flex-row items-center gap-3">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            <div className="flex flex-col gap-1">
                              {/* UserRequest: 모바일 폰트 크기를 축소하고 워크스페이스 이름을 왼쪽 정렬하여 가독성 향상 (text-base) */}
                              <CardTitle className="text-base md:text-lg truncate">
                                {workspace.title}
                              </CardTitle>
                              {/* UserRequest: 마지막 수정 시간을 표시하고 Clock 아이콘을 추가하며 "마지막" 멘트를 제거하여 간결하게 표현 */}
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                수정: {new Date(workspace.updatedAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              </p>
                            </div>
                          </CardHeader>
                        </Card>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                            className="gap-2"
                            onClick={() => handleEdit(workspace)}
                        >
                          <Pencil className="w-4 h-4" />
                          이름 바꾸기
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="text-destructive focus:text-destructive gap-2"
                            onClick={() => handleDeleteClick(workspace)}
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              <div className="text-sm text-muted-foreground">찜 목록은 준비 중입니다.</div>
            </TabsContent>
          </Tabs>
        </main>

        {/* 데스크톱 레이아웃 - 3단 구조 */}
        {/* UserRequest: 데스크톱 화면에서 워크스페이스가 적어도 전체 영역 높이를 보장하여 시각적 안정감 제공 (min-h-[calc(100vh-80px)]) */}
        <main className="hidden md:block min-h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
            {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

            {/* 중앙: 워크스페이스 목록 콘텐츠 */}
            <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)]">
              <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'workspaces' | 'liked')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="workspaces" className="flex items-center gap-1.5">
                    <LayoutGrid className="w-4 h-4" />
                    워크스페이스
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    찜
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workspaces" className="mt-0">
                  <div className="space-y-2">
                    <Card
                        className="border-dashed hover-lift cursor-pointer"
                        onClick={() => setCreateOpen(true)}
                    >
                      <CardHeader className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-primary">
                          <Plus className="w-5 h-5" />
                          <CardTitle className="text-base md:text-lg text-primary">새 워크스페이스</CardTitle>
                        </div>
                        {sortedWorkspaces && sortedWorkspaces.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">워크스페이스가 없습니다. 지금 추가해보세요!</p>
                        )}
                      </CardHeader>
                    </Card>

                    {/* UserRequest: 데스크톱 워크스페이스 간격을 space-y-2 (8px)로 설정하여 적절한 여백 제공 */}
                    {sortedWorkspaces?.map((workspace) => (
                        <ContextMenu key={workspace.id}>
                          <ContextMenuTrigger asChild>
                            <Card
                                className="hover-lift cursor-pointer"
                                onClick={() => handleSelectWorkspace(workspace.identifier)}
                            >
                              <CardHeader className="flex flex-row items-center gap-3">
                                <LayoutGrid className="w-5 h-5 text-primary" />
                                <div className="flex flex-col gap-1">
                                  {/* UserRequest: 모바일 폰트 크기를 축소하고 워크스페이스 이름을 왼쪽 정렬하여 가독성 향상 (text-base) */}
                                  <CardTitle className="text-base md:text-lg truncate">
                                    {workspace.title}
                                  </CardTitle>
                                  {/* UserRequest: 마지막 수정 시간을 표시하고 Clock 아이콘을 추가하며 "마지막" 멘트를 제거하여 간결하게 표현 */}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    수정: {new Date(workspace.updatedAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  </p>
                                </div>
                              </CardHeader>
                            </Card>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                                className="gap-2"
                                onClick={() => handleEdit(workspace)}
                            >
                              <Pencil className="w-4 h-4" />
                              이름 바꾸기
                            </ContextMenuItem>
                            <ContextMenuItem
                                className="text-destructive focus:text-destructive gap-2"
                                onClick={() => handleDeleteClick(workspace)}
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="liked" className="mt-0">
                  <div className="text-sm text-muted-foreground">찜 목록은 준비 중입니다.</div>
                </TabsContent>
              </Tabs>
            </div>

            {/* 우측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
            <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>
          </div>
        </main>

        <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />

        {selectedForEdit && (
            <EditWorkspaceDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                workspace={selectedForEdit}
            />
        )}

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>워크스페이스 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedForDelete && (
                    <>
                      "<strong>{selectedForDelete.title}</strong>" 워크스페이스를 정말 삭제하시겠습니까?
                      <br />
                      <span className="text-destructive">이 작업은 되돌릴 수 없으며, 모든 카테고리와 장소 정보가 함께 삭제됩니다.</span>
                    </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deleteWorkspaceMutation.isPending}
              >
                {deleteWorkspaceMutation.isPending ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default Workspaces;
