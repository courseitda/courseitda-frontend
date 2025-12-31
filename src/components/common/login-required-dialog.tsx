import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LoginRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
};

// UserRequest: 로그인 필요 안내를 전용 안내창으로 제공
const LoginRequiredDialog = ({ open, onOpenChange, onStart }: LoginRequiredDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-lg font-semibold">로그인이 필요해요</DialogTitle>
          <DialogDescription>해당 기능을 이용하시려면 먼저 로그인해주세요.</DialogDescription>
        </DialogHeader>
      </div>
      <Button type="button" className="w-full mt-4" onClick={onStart}>
        코스잇다 시작하기
      </Button>
    </DialogContent>
  </Dialog>
);

export default LoginRequiredDialog;
