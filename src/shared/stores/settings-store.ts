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

// localStorage 키 정의 - 설정 정보 영속성 보장
const REST_KEY = 'courseitda_kakao_rest_key';
const JS_KEY = 'courseitda_kakao_js_key';
const PALETTE_MODE_KEY = 'courseitda_color_palette_mode';

// 설정 전역 스토어 - Kakao API 키와 색상 팔레트 모드를 관리하며 새로고침 시에도 유지
export const useSettingsStore = create<SettingsState>((set) => ({
  // 앱 시작 시 localStorage에서 저장된 설정 복원
  kakaoRestApiKey: localStorage.getItem(REST_KEY),
  kakaoJsApiKey: localStorage.getItem(JS_KEY),
  colorPaletteMode: (localStorage.getItem(PALETTE_MODE_KEY) as PaletteMode) || 'vibrant',
  // Kakao REST API 키 저장 - 장소 검색에 사용
  setKakaoRestApiKey: (key: string) => {
    localStorage.setItem(REST_KEY, key);
    set({ kakaoRestApiKey: key });
  },
  // Kakao JavaScript API 키 저장 - 지도 표시에 사용
  setKakaoJsApiKey: (key: string) => {
    localStorage.setItem(JS_KEY, key);
    set({ kakaoJsApiKey: key });
  },
  // 색상 팔레트 모드 저장 - 사용자가 선택한 색상 테마 유지
  setColorPaletteMode: (mode: PaletteMode) => {
    localStorage.setItem(PALETTE_MODE_KEY, mode);
    set({ colorPaletteMode: mode });
  },
}));
