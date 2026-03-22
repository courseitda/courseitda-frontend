import { useState, useEffect } from 'react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { MESSAGES } from '@/shared/constants/messages';
import type { ApiResponse } from '@/types/api';

// UserRequest: ID 기반 사용자 조회 훅을 제거하여 /api/users/{userId} 호출을 노출하지 않는다.

type UserInfoState<TData> = {
  data: TData | null;
  loading: boolean;
  error: string | null;
};

type UserInfoFetcher<TData> = (token: string) => Promise<ApiResponse<TData>>;

// 반복되는 토큰 기반 사용자 정보 조회 흐름을 공통화하여 훅별 책임을 응답 매핑으로 제한한다.
const useUserInfoQuery = <TData>(fetcher: UserInfoFetcher<TData>, fallbackMessage: string) => {
  const token = useAuthStore((state) => state.token);
  const [state, setState] = useState<UserInfoState<TData>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!token) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    const fetchUserInfo = async () => {
      setState((previousState) => ({
        ...previousState,
        loading: true,
        error: null,
      }));

      const response = await fetcher(token);

      if (!isMounted) {
        return;
      }

      if (!response.success || !response.data) {
        setState({
          data: null,
          loading: false,
          error: response.error?.message || fallbackMessage,
        });
        return;
      }

      setState({
        data: response.data,
        loading: false,
        error: null,
      });
    };

    void fetchUserInfo();

    return () => {
      isMounted = false;
    };
  }, [fallbackMessage, fetcher, token]);

  return state;
};

/**
 * 네비게이터(헤더)에 표시할 사용자 닉네임을 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임만 가져옴 (최적화)
 * 백엔드 연동 시: GET /api/me/navigator
 * 
 * 사용 위치: 헤더 네비게이터 (오른쪽 상단 사용자 정보 표시)
 */
export const useUserNickname = () => {
  const { data, loading, error } = useUserInfoQuery(
    authApi.getNavigatorInfo,
    MESSAGES.auth.nicknameLoadFailed,
  );

  return {
    nickname: data?.nickname ?? null,
    loading,
    error,
  };
};

/**
 * 드롭다운 메뉴에 표시할 사용자 정보를 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임 + 이메일을 가져옴
 * 백엔드 연동 시: GET /api/me/dropdown
 * 
 * 사용 위치: 사용자 프로필 아이콘 클릭 시 나타나는 드롭다운 메뉴
 */
export const useUserDropdown = () => {
  const { data, loading, error } = useUserInfoQuery(
    authApi.getDropdownInfo,
    MESSAGES.auth.userInfoLoadFailed,
  );

  return {
    nickname: data?.nickname ?? null,
    email: data?.email ?? null,
    loading,
    error,
  };
};

/**
 * 마이페이지에 표시할 사용자 프로필 정보를 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임 + 이메일을 가져옴
 * 백엔드 연동 시: GET /api/me/profile
 * 
 * 사용 위치: 마이페이지 (사용자 정보 페이지)
 */
export const useUserProfile = () => {
  const { data, loading, error } = useUserInfoQuery(
    authApi.getProfileInfo,
    MESSAGES.auth.userInfoLoadFailed,
  );

  return {
    nickname: data?.nickname ?? null,
    email: data?.email ?? null,
    loading,
    error,
  };
};
