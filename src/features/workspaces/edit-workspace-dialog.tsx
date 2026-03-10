import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { workspaceApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import type { Workspace } from '@/entities/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useDialogViewportPosition } from '@/shared/hooks/use-dialog-viewport-position';

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

// 워크스페이스 수정 다이얼로그 - 워크스페이스의 제목을 변경
// 사용 위치: features/layout/navigation-drawer, pages/Workspaces
export const EditWorkspaceDialog = ({ open, onOpenChange, workspace }: EditWorkspaceDialogProps) => {
  const [title, setTitle] = useState(workspace.title);
  const dialogRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isUnchangedTitle = title === workspace.title;
  useDialogViewportPosition({ open, mode: 'center', dialogRef, keyboardOpenThreshold: 0.8 });

  // UserRequest: Step 5 — React Query 뮤테이션으로 수정 후 상세/목록 캐시 동기화
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (nextTitle: string) => {
      const response = await workspaceApi.update(workspace.identifier, { title: nextTitle });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || MESSAGES.workspace.updateFailed);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.identifier] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
      toast.success(MESSAGES.workspace.updateSuccess);
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.workspace.updateFailed;
      toast.error(message);
    },
  });

  // 다이얼로그 열릴 때 폼 데이터를 현재 워크스페이스 정보로 초기화
  useEffect(() => {
    if (open) {
      setTitle(workspace.title);
    }
  }, [open, workspace]);

  // 워크스페이스 수정 요청 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (updateWorkspaceMutation.isPending) return;

    if (!title.trim()) {
      toast.error(UI_COPY.myWorkspace.titleRequired);
      return;
    }

    if (isUnchangedTitle) {
      return;
    }

    updateWorkspaceMutation.mutate(title);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className="transition-transform duration-200">
        <DialogHeader>
          <DialogTitle>{UI_COPY.workspaceDialog.edit.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{UI_COPY.workspaceDialog.edit.fieldLabel}</Label>
            <Input
              id="title"
              placeholder={UI_COPY.workspaceDialog.edit.placeholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {UI_COPY.workspaceDialog.edit.cancel}
            </Button>
            <Button type="submit" disabled={updateWorkspaceMutation.isPending || !title.trim() || isUnchangedTitle}>
              {updateWorkspaceMutation.isPending
                ? UI_COPY.workspaceDialog.edit.submitting
                : UI_COPY.workspaceDialog.edit.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
