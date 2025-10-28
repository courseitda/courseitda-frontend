import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
      // .env(.local) 값을 그대로 주입하여 axios baseURL이 백엔드 주소를 사용하도록 보장
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL ?? 'http://localhost:8080'),
      // 디버그 모드
      'import.meta.env.VITE_API_DEBUG': JSON.stringify(env.VITE_API_DEBUG ?? 'true'),
    },
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      reporters: "default",
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"]
      }
    },
  };
});
