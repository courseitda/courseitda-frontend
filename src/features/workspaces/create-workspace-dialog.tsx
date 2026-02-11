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
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

  // UserRequest: Step 5 — React Query 뮤테이션으로 생성 후 내 워크스페이스 캐시 무효화
  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceTitle: string) => {
      if (!token) {
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
      }

      const response = await workspaceApi.create(token, { title: workspaceTitle });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '워크스페이스 생성에 실패했습니다.');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
      toast.success('워크스페이스가 생성되었습니다!');
      setTitle('');
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '워크스페이스 생성에 실패했습니다.';
      toast.error(message);
    },
  });

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

  // 워크스페이스 생성 요청 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createWorkspaceMutation.isPending) return;

    if (!title.trim()) {
      toast.error('워크스페이스 제목을 입력해주세요.');
      return;
    }

    if (!token) {
      toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }

    createWorkspaceMutation.mutate(title.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className="transition-transform duration-200">
        <DialogHeader>
          <DialogTitle>새 워크스페이스</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="예: 홍대 데이트 코스"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            {/* UserRequest: 필수 입력값이 없으면 생성 버튼을 비활성화 */}
            <Button type="submit" disabled={createWorkspaceMutation.isPending || !title.trim()}>
              {createWorkspaceMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
