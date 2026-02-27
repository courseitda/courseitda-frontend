import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Plus, Trash2, User as UserIcon, Pencil } from 'lucide-react';
import type { Workspace, User } from '@/entities/types';
import { CreateWorkspaceDialog } from '@/features/workspaces/create-workspace-dialog';
import { EditWorkspaceDialog } from '@/features/workspaces/edit-workspace-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { workspaceApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UI_COPY } from '@/shared/constants/ui-copy';

interface NavigationDrawerProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  user: User;
}

// 네비게이션 드로어 컴포넌트 - 워크스페이스 목록과 계정 정보를 표시하는 사이드 메뉴
// 사용 위치: 현재 미사용 (Sheet 기반 네비게이션, 필요 시 복구 가능)
export const NavigationDrawer = ({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  user,
}: NavigationDrawerProps) => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Workspace | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspaces', 'me'];
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const { error } = await workspaceApi.delete(identifier);
      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
  
  // 워크스페이스 수정 다이얼로그 열기
  const handleEdit = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditDialogOpen(true);
  };
  
  // 워크스페이스 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (workspace: Workspace) => {
    setSelectedForDelete(workspace);
    setDeleteAlertOpen(true);
  };
  
  // 워크스페이스 삭제 확인 후 백엔드 API를 호출하여 워크스페이스와 관련 데이터 모두 삭제
  const handleDeleteConfirm = () => {
    if (!selectedForDelete || deleteWorkspaceMutation.isPending) return;

    deleteWorkspaceMutation.mutate(selectedForDelete.identifier);
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      {/* UserRequest: 모바일 뷰에서는 전체 화면 가로길이의 3/4 (75%)로 설정하고, 데스크톱에서는 고정 너비 320px로 설정하여 적절한 너비 제공 */}
      <SheetContent side="right" className="w-[75vw] md:w-80 p-0 flex flex-col">
        {/* UserRequest: 네비게이션 드로어 제목을 가운데 정렬하여 시각적 균형 유지 (!text-center) */}
        <SheetHeader className="p-4 pb-3 !text-center">
          <SheetTitle>{UI_COPY.navigationDrawer.sheetTitle}</SheetTitle>
        </SheetHeader>

        {/* UserRequest: 스크롤 영역을 유연하게 확장하고 내부 여백 설정하여 가독성 향상 (좌우 16px, 아래 16px, 자식 요소 간 세로 간격 16px) */}
        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-4">
            {/* 계정 정보 영역 */}
            <div className="pt-1">
              <button
                onClick={() => navigate('/mypage')}
                className="w-full p-3 rounded-lg bg-card border border-border/50 hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <UserIcon className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.nickname}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* 워크스페이스 목록 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">{UI_COPY.navigationDrawer.workspaceSection}</h3>
              
              {/* 새 워크스페이스 추가 버튼 */}
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                {UI_COPY.navigationDrawer.createWorkspace}
              </Button>
              
              {workspaces.map((workspace) => {
                const isActive = workspace.id === currentWorkspaceId;
                return (
                  <ContextMenu key={workspace.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => onSelectWorkspace(workspace.id)}
                        className={`w-full text-left px-3 py-[18px] rounded-lg border transition-colors ${
                          isActive
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border/50 hover:bg-accent'
                        }`}
                      >
                        <h4 className="font-semibold text-sm truncate">
                          {workspace.title}
                        </h4>
                      </button>
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
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
      
      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      {selectedWorkspace && (
        <EditWorkspaceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          workspace={selectedWorkspace}
        />
      )}
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.myWorkspace.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedForDelete && (
                <>
                  {UI_COPY.myWorkspace.deleteDialog.description(selectedForDelete.title)}
                  <br />
                  <span className="text-destructive">{UI_COPY.myWorkspace.deleteDialog.warning}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{UI_COPY.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteWorkspaceMutation.isPending}
            >
              {deleteWorkspaceMutation.isPending ? UI_COPY.common.deleting : UI_COPY.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
