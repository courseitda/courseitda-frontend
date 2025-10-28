import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserNickname, useUserDropdown } from '@/shared/hooks/use-user-info';
import { useWorkspacesByOwner } from '@/shared/hooks/use-workspace';
import { Plus, LogOut, Settings, Pencil, Trash2, Clock, User as UserIcon, LayoutGrid, MapPin } from 'lucide-react';
import logo from '@/assets/logo-no-background.png';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { workspaceApi } from '@/services/api';
import type { Workspace } from '@/entities/types';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 워크스페이스 목록 페이지 컴포넌트
 * 사용자의 모든 워크스페이스를 카드 형태로 표시하며, 생성/수정/삭제 기능 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const Workspaces = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();
  const { nickname: navNickname } = useUserNickname(); // 네비게이터용 닉네임
  const { nickname: dropdownNickname, email } = useUserDropdown(); // 드롭다운용 닉네임 + 이메일
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Workspace | null>(null);
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

  // 로그아웃 처리 후 인증 상태 초기화 및 랜딩 페이지로 이동
  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-gradient-card">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* UserRequest: Courseitda 로고 클릭 시 랜딩 페이지로 이동하여 홈으로 빠르게 돌아가기 기능 제공 */}
            {/* UserRequest: 코스잇다 텍스트 색상을 primary 색상으로 변경하여 브랜드 아이덴티티 강화 */}
            <div 
              className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
              <span className="font-bold text-lg whitespace-nowrap text-primary">코스잇다</span>
            </div>
            
            {/* 중앙: 3열 그리드 레이아웃의 중앙 공간 (타이틀 없음) */}
            <div></div>
            
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
                <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
                  <Settings className="w-4 h-4" />
                  설정
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

      {/* 모바일 레이아웃 */}
      {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <main className="md:hidden container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">워크스페이스</h2>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            새 워크스페이스
          </Button>
        </div>

        {workspaces && workspaces.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">아직 워크스페이스가 없습니다</p>
              <Button onClick={() => setCreateOpen(true)}>첫 워크스페이스 만들기</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {/* UserRequest: 워크스페이스 간격을 0.3배로 축소하여 공간 효율성 향상 (gap-8 → gap-2.5) */}
            {workspaces?.map((workspace) => (
              <ContextMenu key={workspace.id}>
                <ContextMenuTrigger asChild>
                  <Card
                    className="hover-lift cursor-pointer"
                    onClick={() => handleSelectWorkspace(workspace.identifier)}
                  >
                    <CardHeader>
                      <div className="space-y-1">
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
        )}
      </main>

      {/* 데스크톱 레이아웃 - 3단 구조 */}
      {/* UserRequest: 데스크톱 화면에서 워크스페이스가 적어도 전체 영역 높이를 보장하여 시각적 안정감 제공 (min-h-[calc(100vh-80px)]) */}
      <main className="hidden md:block min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
          {/* 좌측: 배경 영역 (primary/5 색상으로 시각적 여유 제공) */}
          <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

          {/* 중앙: 워크스페이스 목록 콘텐츠 */}
          <div className="px-4 py-4 overflow-y-auto min-h-[calc(100vh-80px)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">워크스페이스</h2>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                새 워크스페이스
              </Button>
            </div>

            {workspaces && workspaces.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">아직 워크스페이스가 없습니다</p>
                  <Button onClick={() => setCreateOpen(true)}>첫 워크스페이스 만들기</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* UserRequest: 데스크톱 워크스페이스 간격을 space-y-2 (8px)로 설정하여 적절한 여백 제공 */}
                {workspaces?.map((workspace) => (
                  <ContextMenu key={workspace.id}>
                    <ContextMenuTrigger asChild>
                      <Card
                        className="hover-lift cursor-pointer"
                        onClick={() => handleSelectWorkspace(workspace.identifier)}
                      >
                        <CardHeader>
                          <div className="space-y-1">
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
            )}
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
