import { useEffect, useRef, useState } from 'react';

type UseNaverMapInstanceOptions = {
  ready: boolean;
  workspaceId: string;
  isFullscreen: boolean;
};

// 네이버 지도 인스턴스 생성과 리사이즈 동기화를 전담하는 훅
export const useNaverMapInstance = ({
  ready,
  workspaceId,
  isFullscreen,
}: UseNaverMapInstanceOptions) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasInitializedBounds = useRef(false);
  const prevPlacesCountRef = useRef(0);

  // 워크스페이스 변경 시 지도 초기화 플래그를 리셋하여 새로운 경계값 계산을 허용
  useEffect(() => {
    hasInitializedBounds.current = false;
    prevPlacesCountRef.current = 0;
  }, [workspaceId]);

  useEffect(() => {
    // 전체 화면 전환 시 지도 크기를 다시 계산하여 빈 여백을 방지
    if (!mapInstance.current || !window.naver || !window.naver.maps) return;
    const { naver } = window;
    const map = mapInstance.current;

    const triggerResize = () => {
      naver.maps.Event.trigger(map, 'resize');
    };

    triggerResize();
    const timeoutId = window.setTimeout(triggerResize, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFullscreen]);

  useEffect(() => {
    // SDK 로드 완료, DOM 준비, 중복 초기화 방지를 위한 전제 조건 확인
    if (!ready || !mapRef.current || !window.naver || !window.naver.maps || mapInstance.current) return;

    const { naver } = window;
    const container = mapRef.current;
    const options = {
      center: new naver.maps.LatLng(37.5665, 126.9780),
      zoom: 13,
    };

    // 서울 시청 기준으로 지도 인스턴스를 생성하고 준비 상태를 기록
    mapInstance.current = new naver.maps.Map(container, options);
    setMapReady(true);

    const handleResize = () => {
      if (mapInstance.current) {
        naver.maps.Event.trigger(mapInstance.current, 'resize');
      }
    };

    const handleMapClick = () => undefined;
    const mapClickListener = naver.maps.Event.addListener(mapInstance.current, 'click', handleMapClick);
    window.addEventListener('resize', handleResize);

    const timeoutId = window.setTimeout(() => {
      if (mapInstance.current) {
        naver.maps.Event.trigger(mapInstance.current, 'resize');
      }
    }, 100);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      naver.maps.Event.removeListener(mapClickListener);
    };
  }, [ready]);

  return {
    mapRef,
    mapInstance,
    mapReady,
    hasInitializedBounds,
    prevPlacesCountRef,
  };
};
