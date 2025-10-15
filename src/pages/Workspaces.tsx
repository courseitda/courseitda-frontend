import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
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
import { useWorkspaceStore } from '@/shared/stores/workspace-store';
import { db } from '@/mock/db';
import { Plus, LogOut, Settings, Pencil, Trash2, Clock, User as UserIcon, LayoutGrid, MapPin } from 'lucide-react';
import logo from '@/assets/logo-no-background.png';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { toast } from 'sonner';
import { deleteWorkspace } from '@/mock/edge-functions/workspace';
import type { Workspace } from '@/entities/types';

const Workspaces = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Workspace | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const workspaces = useLiveQuery(
    () => (user ? db.workspaces.where('ownerId').equals(user.id).toArray() : []),
    [user]
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSelectWorkspace = (id: string) => {
    setSelectedWorkspace(id);
    navigate(`/workspace/${id}`);
  };
  
  const handleEdit = (workspace: Workspace) => {
    setSelectedForEdit(workspace);
    setEditOpen(true);
  };

  const handleDeleteClick = (workspace: Workspace) => {
    setSelectedForDelete(workspace);
    setDeleteAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;

    const { error } = await deleteWorkspace(selectedForDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('워크스페이스가 삭제되었습니다.');
    }
    
    setDeleteAlertOpen(false);
    setSelectedForDelete(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-card">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* UserRequest: Courseitda 로고 클릭 시 랜딩 페이지로 이동 */}
            {/* UserRequest: Courseitda 텍스트 색상을 더 진한 보라색으로 변경 */}
            <div 
              className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
              <span className="font-bold text-lg whitespace-nowrap text-purple-900">CourseItDa</span>
            </div>
            
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
                  <span className="hidden sm:inline font-medium">{user.nickname}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.nickname}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
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

      {/* Mobile Layout */}
      {/* UserRequest: 모바일 뷰 좌우 여백을 0.5배로 축소 (px-8 → px-4) */}
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
            {/* UserRequest: 워크스페이스 간격을 0.3배로 축소 (gap-8 → gap-2.5) */}
            {workspaces?.map((workspace) => (
              <ContextMenu key={workspace.id}>
                <ContextMenuTrigger asChild>
                  <Card
                    className="hover-lift cursor-pointer"
                    onClick={() => handleSelectWorkspace(workspace.id)}
                  >
                    <CardHeader>
                      <div className="space-y-1">
                        {/* UserRequest: 모바일 폰트 크기 축소 (text-base), 워크스페이스 이름 왼쪽 정렬 */}
                        <CardTitle className="text-base md:text-lg truncate">
                          {workspace.title}
                        </CardTitle>
                        {/* UserRequest: 마지막 수정 시간 표시, Clock 아이콘 추가, "마지막" 멘트 제거 */}
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

      {/* Desktop Layout - 3 Column */}
      {/* UserRequest: 데스크톱 화면에서 워크스페이스가 적어도 전체 영역 높이 보장 (min-h-[calc(100vh-80px)]) */}
      <main className="hidden md:block min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
          {/* Left Side - Light Purple Background */}
          <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

          {/* Center - Workspace List */}
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
                {/* UserRequest: 데스크톱 워크스페이스 간격 space-y-2 (8px) */}
                {workspaces?.map((workspace) => (
                  <ContextMenu key={workspace.id}>
                    <ContextMenuTrigger asChild>
                      <Card
                        className="hover-lift cursor-pointer"
                        onClick={() => handleSelectWorkspace(workspace.id)}
                      >
                        <CardHeader>
                          <div className="space-y-1">
                            {/* UserRequest: 모바일 폰트 크기 축소 (text-base), 워크스페이스 이름 왼쪽 정렬 */}
                            <CardTitle className="text-base md:text-lg truncate">
                              {workspace.title}
                            </CardTitle>
                            {/* UserRequest: 마지막 수정 시간 표시, Clock 아이콘 추가, "마지막" 멘트 제거 */}
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

          {/* Right Side - Light Purple Background */}
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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workspaces;
