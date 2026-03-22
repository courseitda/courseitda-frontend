import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * 워크스페이스 상세의 모바일 레이아웃 상태와 높이 계산을 관리하는 훅
 * UserRequest: WorkspaceDetail의 바텀시트/전체화면/헤더 높이 계산 로직을 전용 훅으로 분리
 */
export const useWorkspaceDetailLayout = () => {
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetDragStartY = useRef(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState('64px');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.onchange = handleChange as (this: MediaQueryList, ev: MediaQueryListEvent) => unknown;
    return () => {
      mediaQuery.onchange = null;
    };
  }, []);

  useEffect(() => {
    // 실제 헤더 높이를 기준으로 모바일 지도/시트 높이를 계산하여 화면 흔들림을 줄임
    if (!headerRef.current) return;

    const updateHeaderHeight = () => {
      if (!headerRef.current) return;
      setHeaderHeight(`${headerRef.current.getBoundingClientRect().height}px`);
    };

    updateHeaderHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight();
    });
    resizeObserver.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    // 전체 화면 지도 진입 시 바텀시트를 접어 이중 스크롤과 포인터 충돌을 방지
    if (isMobile && isMapFullscreen && isSheetExpanded) {
      setIsSheetExpanded(false);
    }
  }, [isMobile, isMapFullscreen, isSheetExpanded]);

  useEffect(() => {
    // 드래그 중에는 전역 포인터 이벤트를 감지하여 시트 높이를 끊김 없이 전환
    if (!isSheetDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaY = event.clientY - sheetDragStartY.current;
      if (Math.abs(deltaY) < 25) return;
      setIsSheetExpanded(deltaY < 0);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const deltaY = event.clientY - sheetDragStartY.current;
      if (Math.abs(deltaY) >= 15) {
        setIsSheetExpanded(deltaY < 0);
      } else {
        setIsSheetExpanded((previous) => !previous);
      }
      setIsSheetDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isSheetDragging]);

  const handleSheetDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    // 드래그 시작 좌표를 기록하여 위/아래 이동 방향에 따라 시트 상태를 결정
    event.preventDefault();
    sheetDragStartY.current = event.clientY;
    setIsSheetDragging(true);
  };

  const fullscreenActive = isMobile && isMapFullscreen;
  const collapsedSheetHeight = '45vh';
  const layoutTopPadding = '0px';
  const layoutVerticalPadding = '1rem';
  const mobileSheetHeight = isSheetExpanded ? `calc(100vh - ${headerHeight} - ${layoutTopPadding})` : collapsedSheetHeight;
  const collapsedMapHeight = `calc(((100vh - ${headerHeight}) - ${collapsedSheetHeight} + ((100vh - ${headerHeight}) * 0.45)) / 2)`;
  const mobileMapHeight = fullscreenActive
    ? `calc(100vh - ${headerHeight} - ${layoutVerticalPadding})`
    : isSheetExpanded
      ? '0px'
      : collapsedMapHeight;

  return {
    headerRef,
    isSheetExpanded,
    isMapFullscreen,
    fullscreenActive,
    mobileSheetHeight,
    mobileMapHeight,
    setIsSheetExpanded,
    setIsMapFullscreen,
    handleSheetDragStart,
  };
};
