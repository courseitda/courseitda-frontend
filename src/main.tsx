import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
// 시드 데이터 비활성화 - 사용자가 직접 회원가입하여 데이터 생성
// import "./mock/seed"; // Disabled - no demo data

// React 애플리케이션 진입점 - DOM에 앱을 마운트하고 라우터 활성화
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
