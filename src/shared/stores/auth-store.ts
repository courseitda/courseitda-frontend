import { create } from 'zustand';
import type { User } from '@/entities/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'courseitda_token';
const USER_KEY = 'courseitda_user';

export const useAuthStore = create<AuthState>((set) => {
  // Load from localStorage
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!initialUser,
    setAuth: (user, token) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
