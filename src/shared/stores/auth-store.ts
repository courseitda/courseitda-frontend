import { create } from 'zustand';
import type { User } from '@/entities/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// localStorage 키 정의 - 인증 정보 영속성 보장
const TOKEN_KEY = 'courseitda_token';
const USER_KEY = 'courseitda_user';

// 인증 상태 전역 스토어 - 로그인 상태와 사용자 정보를 관리하며 새로고침 시에도 유지
// 사용 위치: features/auth (login-form, register-form), features/workspaces (create-workspace-dialog), pages (전체 페이지)
export const useAuthStore = create<AuthState>((set) => {
  // 앱 시작 시 localStorage에서 저장된 인증 정보 복원하여 자동 로그인
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!initialUser,
    // 로그인 성공 시 사용자 정보와 토큰을 localStorage와 상태에 저장
    setAuth: (user, token) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    // 로그아웃 시 localStorage와 상태에서 인증 정보 제거
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
