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
    <div className="flex min-h-screen items-center justify-center bg-error-page-bg">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-error-page-text">Oops! Page not found</p>
        <a href="/" className="text-link underline hover:text-link-hover">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
