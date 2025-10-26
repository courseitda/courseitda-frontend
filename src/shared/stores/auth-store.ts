import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// localStorage 키 정의 - 인증 정보 영속성 보장 (토큰만 저장)
const TOKEN_KEY = 'courseitda_token';

// 인증 상태 전역 스토어 - 토큰 기반 인증 관리
// UserRequest: 백엔드 API 연동을 위해 토큰만 저장하고 사용자 정보는 필요할 때마다 API 호출
// 사용 위치: features/auth (login-form, register-form), pages (전체 페이지)
export const useAuthStore = create<AuthState>((set) => {
  // 앱 시작 시 localStorage에서 저장된 토큰 복원하여 자동 로그인
  const storedToken = localStorage.getItem(TOKEN_KEY);

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
    // 로그인 성공 시 토큰만 localStorage와 상태에 저장
    setToken: (token) => {
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, isAuthenticated: true });
    },
    // 로그아웃 시 localStorage와 상태에서 토큰 제거
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, isAuthenticated: false });
    },
  };
});
