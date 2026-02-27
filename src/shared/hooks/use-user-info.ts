import { useState, useEffect } from 'react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { MESSAGES } from '@/shared/constants/messages';

// UserRequest: ID 기반 사용자 조회 훅을 제거하여 /api/users/{userId} 호출을 노출하지 않는다.

/**
 * 네비게이터(헤더)에 표시할 사용자 닉네임을 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임만 가져옴 (최적화)
 * 백엔드 연동 시: GET /api/me/navigator
 * 
 * 사용 위치: 헤더 네비게이터 (오른쪽 상단 사용자 정보 표시)
 */
export const useUserNickname = () => {
  const token = useAuthStore((state) => state.token);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰이 없으면 조회하지 않음
    if (!token) {
      setNickname(null);
      setLoading(false);
      return;
    }

    // 토큰으로 닉네임 조회
    const fetchNickname = async () => {
      setLoading(true);
      setError(null);

      const response = await authApi.getNavigatorInfo(token);

      if (!response.success || !response.data) {
        setError(response.error?.message || MESSAGES.auth.nicknameLoadFailed);
        setNickname(null);
      } else {
        setNickname(response.data.nickname);
      }

      setLoading(false);
    };

    fetchNickname();
  }, [token]);

  return { nickname, loading, error };
};

/**
 * 드롭다운 메뉴에 표시할 사용자 정보를 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임 + 이메일을 가져옴
 * 백엔드 연동 시: GET /api/me/dropdown
 * 
 * 사용 위치: 사용자 프로필 아이콘 클릭 시 나타나는 드롭다운 메뉴
 */
export const useUserDropdown = () => {
  const token = useAuthStore((state) => state.token);
  const [nickname, setNickname] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰이 없으면 조회하지 않음
    if (!token) {
      setNickname(null);
      setEmail(null);
      setLoading(false);
      return;
    }

    // 토큰으로 드롭다운 정보 조회
    const fetchDropdownInfo = async () => {
      setLoading(true);
      setError(null);

      const response = await authApi.getDropdownInfo(token);

      if (!response.success || !response.data) {
        setError(response.error?.message || MESSAGES.auth.userInfoLoadFailed);
        setNickname(null);
        setEmail(null);
      } else {
        setNickname(response.data.nickname);
        setEmail(response.data.email);
      }

      setLoading(false);
    };

    fetchDropdownInfo();
  }, [token]);

  return { nickname, email, loading, error };
};

/**
 * 마이페이지에 표시할 사용자 프로필 정보를 조회하는 커스텀 훅
 * 토큰을 기반으로 닉네임 + 이메일을 가져옴
 * 백엔드 연동 시: GET /api/me/profile
 * 
 * 사용 위치: 마이페이지 (사용자 정보 페이지)
 */
export const useUserProfile = () => {
  const token = useAuthStore((state) => state.token);
  const [nickname, setNickname] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰이 없으면 조회하지 않음
    if (!token) {
      setNickname(null);
      setEmail(null);
      setLoading(false);
      return;
    }

    // 토큰으로 프로필 정보 조회
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const response = await authApi.getProfileInfo(token);

      if (!response.success || !response.data) {
        setError(response.error?.message || MESSAGES.auth.userInfoLoadFailed);
        setNickname(null);
        setEmail(null);
      } else {
        setNickname(response.data.nickname);
        setEmail(response.data.email);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [token]);

  return { nickname, email, loading, error };
};
