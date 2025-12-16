/// <reference types="vite/client" />

// Vite 환경 변수 타입 정의 - TypeScript 자동 완성 및 타입 체크 지원
interface ImportMetaEnv {
  // API 서버 기본 URL
  readonly VITE_API_BASE_URL: string;
  // API 요청 디버그 모드
  readonly VITE_API_DEBUG?: string;
  // 개발 모드 플래그
  readonly VITE_DEV_MODE: string;
  // MSW(Mock Service Worker) 활성화 플래그
  readonly VITE_ENABLE_MSW?: string;
  // Naver Maps JavaScript SDK Key ID
  readonly VITE_NAVER_MAP_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
