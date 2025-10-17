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
import type { Workspace } from '@/entities/types';

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

// 워크스페이스 수정 다이얼로그 - 워크스페이스의 제목을 변경
// 사용 위치: features/layout/navigation-drawer, pages/Workspaces
export const EditWorkspaceDialog = ({ open, onOpenChange, workspace }: EditWorkspaceDialogProps) => {
  const [title, setTitle] = useState(workspace.title);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

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

    setLoading(true);

    // API 서비스 레이어를 통해 워크스페이스 정보 업데이트 (백엔드 연동 시 workspaceApi만 수정)
    const { error } = await workspaceApi.update(workspace.id, {
      title,
    });

    // 수정 실패 시 에러 메시지 표시
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    // 수정 성공 후 다이얼로그 닫기
    toast.success('워크스페이스가 수정되었습니다!');
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className="transition-transform duration-200">
        <DialogHeader>
          <DialogTitle>워크스페이스 이름 바꾸기</DialogTitle>
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
            <Button type="submit" disabled={loading}>
              {loading ? '수정 중...' : '확인'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

