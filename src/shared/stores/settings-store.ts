import { create } from 'zustand';

interface SettingsState {
  kakaoRestApiKey: string | null;
  kakaoJsApiKey: string | null;
  setKakaoRestApiKey: (key: string) => void;
  setKakaoJsApiKey: (key: string) => void;
}

const REST_KEY = 'courseitda_kakao_rest_key';
const JS_KEY = 'courseitda_kakao_js_key';

export const useSettingsStore = create<SettingsState>((set) => ({
  kakaoRestApiKey: localStorage.getItem(REST_KEY),
  kakaoJsApiKey: localStorage.getItem(JS_KEY),
  setKakaoRestApiKey: (key: string) => {
    localStorage.setItem(REST_KEY, key);
    set({ kakaoRestApiKey: key });
  },
  setKakaoJsApiKey: (key: string) => {
    localStorage.setItem(JS_KEY, key);
    set({ kakaoJsApiKey: key });
  },
}));
