/// <reference types="vite/client" />

// Vite 환경 변수 타입 정의 - TypeScript 자동 완성 및 타입 체크 지원
interface ImportMetaEnv {
  // API 서버 기본 URL
  readonly VITE_API_BASE_URL: string;
  // 개발 모드 플래그
  readonly VITE_DEV_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
