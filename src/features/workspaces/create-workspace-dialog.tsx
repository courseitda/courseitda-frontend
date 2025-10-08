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

export const CreateWorkspaceDialog = ({ open, onOpenChange }: CreateWorkspaceDialogProps) => {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle keyboard appearance on mobile
  useEffect(() => {
    if (!open) return;

    const handleViewportResize = () => {
      if (!dialogRef.current) return;
      
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Calculate the available height when keyboard is open
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // If viewport is smaller than window, keyboard is likely open
      if (viewportHeight < windowHeight * 0.8) {
        // Position dialog in the center of visible viewport
        dialogRef.current.style.transform = `translate(-50%, calc(-50% - ${(windowHeight - viewportHeight) / 2}px))`;
      } else {
        // Reset to center of screen
        dialogRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    // Check if visualViewport is supported (modern mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      };
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { workspace, error } = await createWorkspace({
      ownerId: user.id,
      title,
    });

    if (error || !workspace) {
      toast.error(error || '워크스페이스 생성에 실패했습니다.');
      setLoading(false);
      return;
    }

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
