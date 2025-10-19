import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 환경 변수 설정 - 백엔드 API 연동을 위한 설정
  define: {
    // API Base URL - 백엔드 서버 주소 (기본값: 프론트엔드와 같은 서버)
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000'),
    // 디버그 모드
    'import.meta.env.VITE_API_DEBUG': JSON.stringify(process.env.VITE_API_DEBUG || 'true'),
  },
}));
