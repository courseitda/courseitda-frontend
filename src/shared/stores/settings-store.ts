import { create } from 'zustand';
import type { PaletteMode } from '@/shared/constants/colors';

interface SettingsState {
  naverMapKeyId: string | null;
  colorPaletteMode: PaletteMode;
  setColorPaletteMode: (mode: PaletteMode) => void;
}

// localStorage 키 정의 - 설정 정보 영속성 보장
const PALETTE_MODE_KEY = 'courseitda_color_palette_mode';

// 설정 전역 스토어 - Naver Maps Key ID와 색상 팔레트 모드를 관리하며 새로고침 시에도 유지
// 사용 위치: pages/Settings, features/map (map-canvas), features/categories (add-category-dialog, edit-category-dialog)
export const useSettingsStore = create<SettingsState>((set) => ({
  // 앱 시작 시 localStorage에서 저장된 설정 복원
  naverMapKeyId: (import.meta.env.VITE_NAVER_MAP_KEY_ID ?? '').trim() || null,
  colorPaletteMode: (localStorage.getItem(PALETTE_MODE_KEY) as PaletteMode) || 'vibrant',
  // 색상 팔레트 모드 저장 - 사용자가 선택한 색상 테마 유지
  setColorPaletteMode: (mode: PaletteMode) => {
    localStorage.setItem(PALETTE_MODE_KEY, mode);
    set({ colorPaletteMode: mode });
  },
}));
