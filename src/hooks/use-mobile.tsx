import * as React from "react";

// 모바일 뷰포트 경계값 - Tailwind의 md 브레이크포인트와 일치
const MOBILE_BREAKPOINT = 768;

// 현재 화면이 모바일인지 감지하는 훅 - 반응형 UI 구현에 사용
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // matchMedia API로 화면 크기 변화 감지
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    // 리사이즈 이벤트 리스너 등록하여 실시간 반응
    mql.addEventListener("change", onChange);
    // 초기 상태 설정
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
