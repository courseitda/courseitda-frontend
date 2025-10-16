import { useLocation } from "react-router-dom";
import { useEffect } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-card">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <a 
          href="/" 
          className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
};

export default NotFound;
