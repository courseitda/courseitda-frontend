import { create } from 'zustand';

interface AuthState {
  token: string | null;
  tokenType: string | null;
  setToken: (token: string, tokenType?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// localStorage 키 정의 - 인증 정보 영속성 보장 (토큰 및 토큰 타입 저장)
const TOKEN_KEY = 'courseitda_token';
const TOKEN_TYPE_KEY = 'courseitda_token_type';

const normalizeTokenValue = (token: string): string => token.replace(/^Bearer\s+/i, '').trim();

// 인증 상태 전역 스토어 - 토큰 기반 인증 관리
// UserRequest: 백엔드 API 연동을 위해 토큰만 저장하고 사용자 정보는 필요할 때마다 API 호출
// 사용 위치: features/auth (login-form, register-form), pages (전체 페이지)
export const useAuthStore = create<AuthState>((set) => {
  // 앱 시작 시 localStorage에서 저장된 토큰 복원하여 자동 로그인
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedTokenType = localStorage.getItem(TOKEN_TYPE_KEY);

  return {
    token: storedToken,
    tokenType: storedTokenType,
    isAuthenticated: !!storedToken,
    // UserRequest: Step 3 — axios 인터셉터가 Authorization 헤더를 생성할 수 있도록 토큰 타입을 함께 저장
    setToken: (token, tokenType = 'Bearer') => {
      // UserRequest: 실제 API 연동 시 accessToken 값에 Bearer 접두사가 포함돼도 중복 저장을 방지한다.
      const normalizedToken = normalizeTokenValue(token);
      const normalizedTokenType = tokenType.replace(/\s+/g, ' ').trim() || 'Bearer';

      localStorage.setItem(TOKEN_KEY, normalizedToken);
      localStorage.setItem(TOKEN_TYPE_KEY, normalizedTokenType);
      set({ token: normalizedToken, tokenType: normalizedTokenType, isAuthenticated: true });
    },
    // UserRequest: Step 3 — 백엔드 연동 시 로그아웃 과정에서 토큰 타입까지 제거하여 재인증 강제
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_TYPE_KEY);
      set({ token: null, tokenType: null, isAuthenticated: false });
    },
  };
});
