import { useState, useRef } from 'react';
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
import { useAuthStore } from '@/shared/stores/auth-store';
import { MESSAGES } from '@/shared/constants/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useDialogViewportPosition } from '@/shared/hooks/use-dialog-viewport-position';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 워크스페이스 생성 다이얼로그 - 새로운 워크스페이스를 생성
// UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
// 사용 위치: features/layout/navigation-drawer, pages/WorkspaceDetail, pages/Workspaces
export const CreateWorkspaceDialog = ({ open, onOpenChange }: CreateWorkspaceDialogProps) => {
  const token = useAuthStore((state) => state.token); // 인증 토큰 추출
  const [title, setTitle] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  useDialogViewportPosition({ open, mode: 'center', dialogRef, keyboardOpenThreshold: 0.8 });

  // UserRequest: Step 5 — React Query 뮤테이션으로 생성 후 내 워크스페이스 캐시 무효화
  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceTitle: string) => {
      if (!token) {
        throw new Error(UI_COPY.system.loginRequired);
      }

      const response = await workspaceApi.create(token, { title: workspaceTitle });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || MESSAGES.workspace.createFailed);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
      toast.success(MESSAGES.workspace.createSuccess);
      setTitle('');
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.workspace.createFailed;
      toast.error(message);
    },
  });

  // 워크스페이스 생성 요청 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createWorkspaceMutation.isPending) return;

    if (!title.trim()) {
      toast.error(UI_COPY.myWorkspace.titleRequired);
      return;
    }

    if (!token) {
      toast.error(UI_COPY.system.loginRequired);
      return;
    }

    createWorkspaceMutation.mutate(title.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className="max-h-[88vh] overflow-y-auto px-3 py-4 transition-transform duration-200 sm:p-6">
        <DialogHeader>
          <DialogTitle>{UI_COPY.workspaceDialog.create.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{UI_COPY.workspaceDialog.create.fieldLabel}</Label>
            <Input
              id="title"
              placeholder={UI_COPY.workspaceDialog.create.placeholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button className="shrink-0" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {UI_COPY.workspaceDialog.create.cancel}
            </Button>
            {/* UserRequest: 필수 입력값이 없으면 생성 버튼을 비활성화 */}
            <Button className="shrink-0" type="submit" disabled={createWorkspaceMutation.isPending || !title.trim()}>
              {createWorkspaceMutation.isPending ? UI_COPY.workspaceDialog.create.submitting : UI_COPY.workspaceDialog.create.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
