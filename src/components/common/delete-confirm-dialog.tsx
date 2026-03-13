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
import { UI_COPY } from '@/shared/constants/ui-copy';

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
};

// UserRequest: 삭제 팝업 형식을 공통 컴포넌트로 분리해 모든 삭제 확인 UI를 동일한 구조로 유지한다.
const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = UI_COPY.common.delete,
  cancelLabel = UI_COPY.common.cancel,
  pending = false,
}: DeleteConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {/* UserRequest: 삭제 팝업 버튼은 좌우 2분할로 배치해 왼쪽 취소, 오른쪽 삭제가 동일 너비를 차지하게 한다. */}
      <AlertDialogFooter className="flex-row items-stretch gap-2 space-x-0">
        <AlertDialogCancel className="mt-0 flex-1" disabled={pending}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="flex-1 bg-destructive hover:bg-destructive/90"
          disabled={pending}
        >
          {pending ? UI_COPY.common.deleting : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteConfirmDialog;
