import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 조회성 에러를 동일한 방식으로 토스트 안내하는 훅
 * UserRequest: 반복되는 조회 실패 토스트 로직을 공통 훅으로 통합
 */
export const useQueryErrorToast = (
  error: Error | null,
  fallbackMessage: string,
  enabled = true,
) => {
  useEffect(() => {
    // 동일한 조회 실패 피드백 정책을 재사용하여 페이지별 중복 useEffect를 제거
    if (!enabled || !error) {
      return;
    }

    toast.error(error.message || fallbackMessage);
  }, [enabled, error, fallbackMessage]);
};
