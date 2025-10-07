import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateWorkspace } from '@/mock/edge-functions/workspace';
import type { Workspace } from '@/entities/types';

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

export const EditWorkspaceDialog = ({ open, onOpenChange, workspace }: EditWorkspaceDialogProps) => {
  const [title, setTitle] = useState(workspace.title);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens with new workspace
  useEffect(() => {
    if (open) {
      setTitle(workspace.title);
    }
  }, [open, workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const { error } = await updateWorkspace(workspace.id, {
      title,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success('워크스페이스가 수정되었습니다!');
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>워크스페이스 수정</DialogTitle>
          <DialogDescription>워크스페이스 정보를 수정하세요</DialogDescription>
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

