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
import { deleteWorkspace } from '@/mock/edge-functions/workspace';
import { toast } from 'sonner';

interface NavigationDrawerProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  user: User;
}

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
  
  const handleEdit = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditDialogOpen(true);
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
      <SheetContent side="right" className="w-[75vw] md:w-80 p-0 flex flex-col">
        {/* UserRequest: 네비게이션 드로우바 제목을 가운데 정렬 (!text-center) */}
        <SheetHeader className="p-4 pb-3 !text-center">
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>

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
              <h3 className="text-sm font-semibold text-muted-foreground px-1">워크스페이스</h3>
              
              {/* 새 워크스페이스 추가 버튼 */}
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                새 워크스페이스
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
    </Sheet>
  );
};
