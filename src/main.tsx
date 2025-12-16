import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

const isMswEnabled = (): boolean => (import.meta.env.VITE_ENABLE_MSW ?? "false") === "true";

const enableMocking = async (): Promise<void> => {
  // UserRequest: VITE_ENABLE_MSW로 MSW 모드 토글.
  if (!import.meta.env.DEV) {
    return;
  }

  if (!isMswEnabled()) {
    return;
  }

  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "warn",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
};

const bootstrap = async (): Promise<void> => {
  // React 애플리케이션 진입점 - MSW 초기화(선택) 후 DOM에 앱을 마운트하고 라우터 활성화
  await enableMocking();

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

void bootstrap();
