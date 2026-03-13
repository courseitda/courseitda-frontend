import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type InfoConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  leftLabel: string;
  rightLabel: string;
  onLeftAction?: () => void;
  onRightAction: () => void;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
};

// UserRequest: 안내 팝업도 삭제 팝업과 동일한 2분할 구조를 사용하고 문구는 호출부에서 주입받도록 공통화한다.
const InfoConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  leftLabel,
  rightLabel,
  onLeftAction,
  onRightAction,
  leftDisabled = false,
  rightDisabled = false,
}: InfoConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {/* UserRequest: 안내 팝업 버튼은 좌우 2분할로 배치하고 오른쪽 버튼은 메인 컬러를 사용한다. */}
      <AlertDialogFooter className="flex-row items-stretch gap-2 space-x-0">
        <AlertDialogCancel
          className="mt-0 flex-1"
          disabled={leftDisabled}
          onClick={onLeftAction}
        >
          {leftLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={rightDisabled}
          onClick={onRightAction}
        >
          {rightLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default InfoConfirmDialog;
