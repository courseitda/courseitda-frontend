import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

type DialogViewportMode = 'center' | 'bottom';

interface UseDialogViewportPositionOptions {
  open: boolean;
  mode: DialogViewportMode;
  dialogRef?: RefObject<HTMLDivElement | null>;
  keyboardOpenThreshold?: number;
}

// UserRequest: 다이얼로그별 모바일 키보드 대응 로직을 공통 훅으로 통일하여 기존 동작은 유지하고 수정 지점을 줄인다.
// 모바일 가상 키보드로 줄어든 viewport를 기준으로 다이얼로그 위치를 보정하는 훅
export const useDialogViewportPosition = ({
  open,
  mode,
  dialogRef,
  keyboardOpenThreshold = 0.85,
}: UseDialogViewportPositionOptions): CSSProperties | undefined => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const dialogElement = dialogRef?.current ?? null;

    if (!open) {
      setKeyboardOffset(0);

      // 중앙 정렬 모드는 닫힐 때 기본 transform으로 복원하여 다음 열림 상태를 안정화한다.
      if (mode === 'center' && dialogElement) {
        dialogElement.style.transform = 'translate(-50%, -50%)';
      }

      return;
    }

    const handleViewportResize = () => {
      const visualViewport = window.visualViewport;

      if (!visualViewport) {
        if (mode === 'bottom') {
          setKeyboardOffset(0);
        }

        if (mode === 'center' && dialogElement) {
          dialogElement.style.transform = 'translate(-50%, -50%)';
        }

        return;
      }

      // 현재 보이는 높이와 전체 높이를 비교해 키보드 노출 여부를 판단한다.
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      const isKeyboardOpen = viewportHeight < windowHeight * keyboardOpenThreshold;

      if (mode === 'bottom') {
        setKeyboardOffset(isKeyboardOpen ? windowHeight - viewportHeight : 0);
        return;
      }

      // 중앙 정렬 모드는 키보드 높이의 절반만큼 위로 이동시켜 입력창 가림을 줄인다.
      if (!dialogElement) {
        return;
      }

      dialogElement.style.transform = isKeyboardOpen
        ? `translate(-50%, calc(-50% - ${(windowHeight - viewportHeight) / 2}px))`
        : 'translate(-50%, -50%)';
    };

    handleViewportResize();

    if (!window.visualViewport) {
      return;
    }

    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);

      if (mode === 'center' && dialogElement) {
        dialogElement.style.transform = 'translate(-50%, -50%)';
      }
    };
  }, [dialogRef, keyboardOpenThreshold, mode, open]);

  if (mode !== 'bottom') {
    return undefined;
  }

  return {
    top: keyboardOffset > 0 ? 'auto' : '50%',
    bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 'auto',
    transform: keyboardOffset > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)',
  };
};
