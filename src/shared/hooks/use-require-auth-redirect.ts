import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';

/**
 * 인증이 필요한 화면에서 미인증 접근을 공통적으로 차단하는 훅
 * UserRequest: 반복되는 인증 리다이렉트 로직을 공통 훅으로 통합
 */
export const useRequireAuthRedirect = (redirectPath = '/auth') => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // 인증이 없는 경우 동일한 목적지로 즉시 이동시켜 페이지별 중복 로직을 제거
    if (!isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, redirectPath]);
};
