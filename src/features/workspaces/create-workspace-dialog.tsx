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
import { createWorkspace } from '@/mock/edge-functions/workspace';
import { useAuthStore } from '@/shared/stores/auth-store';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 워크스페이스 생성 다이얼로그 - 새로운 워크스페이스를 생성
export const CreateWorkspaceDialog = ({ open, onOpenChange }: CreateWorkspaceDialogProps) => {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // UserRequest: 모바일에서 키보드 올라올 때 팝업이 가려지지 않도록 키보드를 제외한 화면 중앙에 위치
  // 모바일 키보드가 팝업을 가리지 않도록 동적으로 위치 조정
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
    if (!user) return;

    setLoading(true);

    // Edge Function을 통해 새 워크스페이스 생성
    const { workspace, error } = await createWorkspace({
      ownerId: user.id,
      title,
    });

    // 생성 실패 시 에러 메시지 표시
    if (error || !workspace) {
      toast.error(error || '워크스페이스 생성에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 생성 성공 후 입력 필드 초기화 및 다이얼로그 닫기
    toast.success('워크스페이스가 생성되었습니다!');
    setTitle('');
    onOpenChange(false);
    setLoading(false);
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
            <Button type="submit" disabled={loading}>
              {loading ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
