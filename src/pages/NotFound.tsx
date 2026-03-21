import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageHeader from '@/components/layout/page-header';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 존재하지 않는 경로 접근 시 표시되는 404 에러 페이지
 * 잘못된 경로 접근을 콘솔에 로깅하여 디버깅 정보 제공
 */
const NotFound = () => {
  const location = useLocation();

  // 사용자가 접근하려 한 잘못된 경로를 콘솔에 기록하여 디버깅 지원
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 404 페이지도 공통 헤더를 사용해 전 페이지 헤더 구조 통일 */}
      <PageHeader title={UI_COPY.notFound.pageTitle} desktopSideLayout />
      <DesktopSideLayout className="min-h-[calc(100vh-72px)]">
        <main className="flex items-center justify-center px-8 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <p className="text-xl text-muted-foreground">{UI_COPY.notFound.title}</p>
            <p className="text-sm text-muted-foreground">{UI_COPY.notFound.description}</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {UI_COPY.notFound.action}
            </a>
          </div>
        </main>
      </DesktopSideLayout>
    </div>
  );
};

export default NotFound;
