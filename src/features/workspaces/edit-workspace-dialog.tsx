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

  // UserRequest: 모바일에서 키보드 올라올 때 팝업이 가려지지 않도록 키보드를 제외한 화면 중앙에 위치시켜 입력 편의성 향상
  useEffect(() => {
    if (!open) return;

    const handleViewportResize = () => {
      if (!dialogRef.current) return;
      
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // 키보드 표시 시 보이는 영역 높이 계산
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // 보이는 영역이 80% 미만으로 줄어들면 키보드가 올라온 것으로 판단
      if (viewportHeight < windowHeight * 0.8) {
        // 보이는 영역의 중앙에 다이얼로그 배치
        dialogRef.current.style.transform = `translate(-50%, calc(-50% - ${(windowHeight - viewportHeight) / 2}px))`;
      } else {
        // 키보드가 내려가면 화면 중앙으로 재배치
        dialogRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    // visualViewport API를 지원하는 최신 모바일 브라우저에서만 동작
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      };
    }
  }, [open]);

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
