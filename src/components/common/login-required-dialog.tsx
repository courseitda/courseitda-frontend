import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UI_COPY } from '@/shared/constants/ui-copy';
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
  featureName?: string;
};

// UserRequest: 로그인 필요 안내를 전용 안내창으로 제공
const LoginRequiredDialog = ({ open, onOpenChange, onStart, featureName }: LoginRequiredDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-lg font-semibold">{UI_COPY.loginRequiredDialog.title}</DialogTitle>
          <DialogDescription>
            {featureName
              ? UI_COPY.loginRequiredDialog.featureDescription(featureName)
              : UI_COPY.loginRequiredDialog.description}
          </DialogDescription>
        </DialogHeader>
      </div>
      <Button type="button" className="w-full mt-4" onClick={onStart}>
        {UI_COPY.loginRequiredDialog.action}
      </Button>
    </DialogContent>
  </Dialog>
);

export default LoginRequiredDialog;
