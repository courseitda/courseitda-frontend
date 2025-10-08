import { create } from 'zustand';
import type { PaletteMode } from '@/shared/constants/colors';

interface SettingsState {
  kakaoRestApiKey: string | null;
  kakaoJsApiKey: string | null;
  colorPaletteMode: PaletteMode;
  setKakaoRestApiKey: (key: string) => void;
  setKakaoJsApiKey: (key: string) => void;
  setColorPaletteMode: (mode: PaletteMode) => void;
}

const REST_KEY = 'courseitda_kakao_rest_key';
const JS_KEY = 'courseitda_kakao_js_key';
const PALETTE_MODE_KEY = 'courseitda_color_palette_mode';

export const useSettingsStore = create<SettingsState>((set) => ({
  kakaoRestApiKey: localStorage.getItem(REST_KEY),
  kakaoJsApiKey: localStorage.getItem(JS_KEY),
  colorPaletteMode: (localStorage.getItem(PALETTE_MODE_KEY) as PaletteMode) || 'vibrant',
  setKakaoRestApiKey: (key: string) => {
    localStorage.setItem(REST_KEY, key);
    set({ kakaoRestApiKey: key });
  },
  setKakaoJsApiKey: (key: string) => {
    localStorage.setItem(JS_KEY, key);
    set({ kakaoJsApiKey: key });
  },
  setColorPaletteMode: (mode: PaletteMode) => {
    localStorage.setItem(PALETTE_MODE_KEY, mode);
    set({ colorPaletteMode: mode });
  },
}));
