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
import { useAuthStore } from '@/shared/stores/auth-store';
import { useWorkspaceStore } from '@/shared/stores/workspace-store';
import { db } from '@/mock/db';
import { Plus, LogOut, Settings, Pencil, Trash2 } from 'lucide-react';
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
    navigate('/auth');
  };

  const handleSelectWorkspace = (id: string) => {
    setSelectedWorkspace(id);
    navigate(`/workspace/${id}`);
  };
  
  const handleEdit = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForEdit(workspace);
    setEditOpen(true);
  };

  const handleDeleteClick = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
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
        <div className="container mx-auto px-8 md:px-4 py-6 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">코스잇다</h1>
              <p className="text-sm text-muted-foreground">{user.nickname}님, 환영합니다!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Layout */}
      <main className="md:hidden container mx-auto px-8 py-12">
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
          <div className="grid grid-cols-1 gap-8">
            {workspaces?.map((workspace) => (
              <Card
                key={workspace.id}
                className="hover-lift cursor-pointer"
                onClick={() => handleSelectWorkspace(workspace.id)}
              >
                <CardHeader>
                  <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <div className="w-16" />
                    <span className="truncate text-center">{workspace.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleEdit(workspace, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(workspace, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Desktop Layout - 3 Column */}
      <main className="hidden md:block min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-80px)]">
          {/* Left Side - Light Purple Background */}
          <div className="bg-primary/5 min-h-[calc(100vh-80px)]"></div>

          {/* Center - Workspace List */}
          <div className="px-4 py-8 overflow-y-auto min-h-[calc(100vh-80px)]">
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
              <div className="space-y-4">
                {workspaces?.map((workspace) => (
                  <Card
                    key={workspace.id}
                    className="hover-lift cursor-pointer"
                    onClick={() => handleSelectWorkspace(workspace.id)}
                  >
                    <CardHeader>
                      <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <div className="w-16" />
                        <span className="truncate text-center">{workspace.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEdit(workspace, e)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(workspace, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
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
