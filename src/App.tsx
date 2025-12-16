import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import SearchResult from "./pages/SearchResult";

// React Query 클라이언트 생성 - 서버 상태 관리 및 캐싱 처리
const queryClient = new QueryClient();

// 애플리케이션 루트 컴포넌트 - 라우팅 설정 및 전역 Provider 구성
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* 토스트 알림 컴포넌트 - 사용자 액션 결과 피드백 제공 */}
      <Toaster />
      <Sonner />
      {/* 라우팅 설정 - 페이지별 경로 정의 */}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/search" element={<SearchResult />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspace/:id" element={<WorkspaceDetail />} />
        <Route path="/mypage" element={<MyPage />} />
        {/* 모든 커스텀 라우트는 catch-all 라우트 위에 정의 필요 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
