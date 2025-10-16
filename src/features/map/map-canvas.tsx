import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Category, Place } from '@/entities/types';
import { useKakaoLoader } from '@/shared/hooks/use-kakao-loader';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { db } from '@/mock/db';
import { getPlacesByCategory } from '@/mock/edge-functions/place';
import { setRepresentativePlace } from '@/mock/edge-functions/category';
import { toast } from 'sonner';

// 지도 캔버스 컴포넌트 - Kakao Maps SDK를 사용하여 장소 마커와 경로 표시
// 사용 위치: pages/WorkspaceDetail

// 두 색상 간 선형 보간을 통해 그라데이션 색상 생성 - 경로에 부드러운 색상 전환 효과 적용
const interpolateColor = (color1: string, color2: string, ratio: number = 0.5): string => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  // 첫 번째 색상의 RGB 값 추출
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  // 두 번째 색상의 RGB 값 추출
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  // 비율에 따라 RGB 각 채널의 중간 값 계산
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  
  // 계산된 RGB를 다시 HEX 색상 코드로 변환하여 반환
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

interface MapCanvasProps {
  workspaceId: string;
  categories: Category[];
  focusedPlace?: Place | null;
}

// 지도 캔버스 컴포넌트 - Kakao Maps SDK를 사용하여 장소 마커와 경로를 표시
export const MapCanvas = ({ workspaceId, categories, focusedPlace }: MapCanvasProps) => {
  const kakaoJsApiKey = useSettingsStore((state) => state.kakaoJsApiKey);
  const { ready, error } = useKakaoLoader(kakaoJsApiKey);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const currentInfoWindowRef = useRef<any>(null);
  const hasInitializedBounds = useRef<boolean>(false);
  const prevPlacesCountRef = useRef<number>(0);

  // 워크스페이스 변경 시 지도 초기화 플래그 리셋하여 새로운 경계값 적용
  useEffect(() => {
    hasInitializedBounds.current = false;
    prevPlacesCountRef.current = 0;
  }, [workspaceId]);

  // 모든 카테고리의 장소 목록을 실시간으로 조회하여 지도에 표시
  const allPlacesData = useLiveQuery(async () => {
    const placesMap = new Map();
    
    // 각 카테고리의 장소들을 조회하여 Map으로 통합
    for (const category of categories) {
      const places = await getPlacesByCategory(category.id);
      for (const place of places) {
        placesMap.set(place.id, { place, category });
      }
    }
    
    return placesMap;
  }, [categories]);

  // Kakao Maps SDK를 사용하여 지도 초기화 및 기본 이벤트 설정
  useEffect(() => {
    // SDK 로드 대기, DOM 준비 확인, 중복 초기화 방지
    if (!ready || !mapRef.current || !window.kakao || mapInstance.current) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청 기준 초기 위치
      level: 5,
    };

    // Kakao Maps 인스턴스 생성
    mapInstance.current = new window.kakao.maps.Map(container, options);

    // 지도 클릭 시 열려있는 정보창 닫기
    window.kakao.maps.event.addListener(mapInstance.current, 'click', () => {
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.setMap(null);
        currentInfoWindowRef.current = null;
      }
    });

    // 브라우저 리사이즈 시 지도 크기 재조정하여 깨짐 방지
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.relayout();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // 초기 렌더링 후 지도 레이아웃 재조정
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.relayout();
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ready]);

  // 장소 데이터 변경 시 마커와 경로를 업데이트하여 지도에 실시간 반영
  useEffect(() => {
    if (!ready || !mapInstance.current || !allPlacesData) return;

    const kakao = window.kakao;
    const map = mapInstance.current;

    // 기존 마커들을 지도에서 모두 제거하여 중복 방지
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 기존 경로선들을 지도에서 모두 제거
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    const markers: any[] = [];

    // 대표 장소와 카테고리 순서를 매핑하여 마커에 번호 표시
    const representativeMap = new Map<string, number>();
    categories.forEach((cat, index) => {
      if (cat.representativePlaceId) {
        representativeMap.set(cat.representativePlaceId, index + 1);
      }
    });

    // 모든 장소에 대해 마커 생성 - 대표 장소는 크고 번호 표시, 일반 장소는 작은 마커
    allPlacesData.forEach(({ place, category }) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);

      const isRepresentative = category.representativePlaceId === place.id;
      const categoryOrder = representativeMap.get(place.id);

      const markerContent = document.createElement('div');
      
      // 대표 장소 마커는 카테고리 순서 번호를 포함한 큰 원형 마커로 표시
      if (isRepresentative && categoryOrder) {
        markerContent.style.cssText = `
          width: 32px;
          height: 32px;
          background-color: ${category.color};
          border: 3px solid hsl(var(--card));
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: hsl(var(--card));
          font-size: 14px;
          cursor: pointer;
          z-index: 100;
        `;
        markerContent.textContent = String(categoryOrder);
      } else {
        // 일반 장소 마커는 번호 없이 작은 원형 마커로 표시
        markerContent.style.cssText = `
          width: 20px;
          height: 20px;
          background-color: ${category.color};
          border: 2px solid hsl(var(--card));
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 50;
        `;
      }

      // CustomOverlay를 사용하여 커스텀 디자인의 마커 생성
      const customOverlay = new kakao.maps.CustomOverlay({
        position,
        content: markerContent,
        zIndex: isRepresentative ? 100 : 50,
      });

      customOverlay.setMap(map);
      markers.push(customOverlay);

      // 마커 클릭 시 표시할 정보창 DOM 요소 생성 - 장소명과 대표 장소 설정 버튼 포함
      const createInfoWindowElement = () => {
        const currentIsRepresentative = category.representativePlaceId === place.id;
        
        const container = document.createElement('div');
        container.style.cssText = `
          padding: 12px;
          background: hsl(var(--card));
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          min-width: 200px;
          pointer-events: auto;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          pointer-events: auto;
        `;

        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = `
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--foreground));
          flex: 1;
        `;
        nameDiv.textContent = place.name;

        const checkButton = document.createElement('button');
        checkButton.type = 'button';
        checkButton.className = 'check-representative-btn';
        checkButton.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid ${currentIsRepresentative ? 'hsl(var(--primary))' : 'hsl(var(--border))'};
          background: ${currentIsRepresentative ? 'hsl(var(--accent))' : 'hsl(var(--card))'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          pointer-events: auto;
          position: relative;
          z-index: 1000;
          flex-shrink: 0;
        `;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', currentIsRepresentative ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))');
        svg.setAttribute('stroke-width', '2.5');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.style.pointerEvents = 'none';

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '20 6 9 17 4 12');
        polyline.style.pointerEvents = 'none';
        
        svg.appendChild(polyline);
        checkButton.appendChild(svg);

        checkButton.addEventListener('mouseenter', () => {
          checkButton.style.background = currentIsRepresentative ? 'hsl(var(--accent) / 0.8)' : 'hsl(var(--secondary))';
        });
        checkButton.addEventListener('mouseleave', () => {
          checkButton.style.background = currentIsRepresentative ? 'hsl(var(--accent))' : 'hsl(var(--card))';
        });

        // 대표 장소 설정/해제 버튼 클릭 핸들러
        const handleCheckClick = async (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          // 이미 대표 장소면 해제, 아니면 설정
          const newPlaceId = currentIsRepresentative ? null : place.id;
          
          // Edge Function을 통해 대표 장소 변경
          const { error } = await setRepresentativePlace(category.id, newPlaceId);
          
          if (error) {
            toast.error(error);
          } else {
            // UserRequest: 대표장소 설정 시 토스트 메시지를 제거하고 정보창만 닫아 불필요한 알림 방지
            if (currentInfoWindowRef.current) {
              currentInfoWindowRef.current.setMap(null);
              currentInfoWindowRef.current = null;
            }
          }
        };
        
        checkButton.addEventListener('click', handleCheckClick as any);
        checkButton.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });

        content.appendChild(nameDiv);
        content.appendChild(checkButton);
        container.appendChild(content);

        return container;
      };

      // 마커 클릭 시 정보창 표시 - 이전 정보창은 자동으로 닫힘
      markerContent.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 열려있는 정보창이 있으면 먼저 닫기
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.setMap(null);
        }

        // 현재 상태를 반영한 새 정보창 생성
        const infoWindowContent = createInfoWindowElement();
        const infoWindow = new kakao.maps.CustomOverlay({
          position: position,
          content: infoWindowContent,
          yAnchor: 1.5, // 마커 위에 표시
          zIndex: 200,
          clickable: true,
        });

        infoWindow.setMap(map);
        currentInfoWindowRef.current = infoWindow;
      });
    });

    // 생성된 마커들을 참조에 저장하여 나중에 제거 가능하도록 관리
    markersRef.current = markers;

    // 대표 장소들을 연결하는 경로선 그리기 - 카테고리 색상으로 그라데이션 적용
    const representativeCategoriesWithPlaces = categories
      .filter((cat) => cat.representativePlaceId)
      .map((cat) => {
        const data = allPlacesData.get(cat.representativePlaceId!);
        return data ? { category: cat, place: data.place } : null;
      })
      .filter((item) => item !== null);

    // 대표 장소가 2개 이상일 때만 경로선 표시
    if (representativeCategoriesWithPlaces.length >= 2) {
      const polylines: any[] = [];
      
      // 인접한 대표 장소들 간의 경로 세그먼트 생성
      for (let i = 0; i < representativeCategoriesWithPlaces.length - 1; i++) {
        const current = representativeCategoriesWithPlaces[i]!;
        const next = representativeCategoriesWithPlaces[i + 1]!;
        
        // UserRequest: 경로를 20개의 선분으로 분할하여 양 끝 마커 색상으로 부드러운 그라데이션 구현
        const numSegments = 20;
        
        for (let j = 0; j < numSegments; j++) {
          const ratio1 = j / numSegments;
          const ratio2 = (j + 1) / numSegments;
          
          // 선분의 시작점과 끝점 좌표를 비율에 따라 계산
          const lat1 = current.place.lat + (next.place.lat - current.place.lat) * ratio1;
          const lng1 = current.place.lng + (next.place.lng - current.place.lng) * ratio1;
          const lat2 = current.place.lat + (next.place.lat - current.place.lat) * ratio2;
          const lng2 = current.place.lng + (next.place.lng - current.place.lng) * ratio2;
          
          // 각 선분의 색상을 두 카테고리 색상 사이의 보간 값으로 계산
          const segmentColor = interpolateColor(current.category.color, next.category.color, ratio1);
          
          const segmentPath = [
            new kakao.maps.LatLng(lat1, lng1),
            new kakao.maps.LatLng(lat2, lng2),
          ];

          // UserRequest: 점선 스타일을 유지하면서 그라데이션 적용하여 경로의 시각적 흐름 강화
          const polyline = new kakao.maps.Polyline({
            path: segmentPath,
            strokeWeight: 3,
            strokeColor: segmentColor,
            strokeOpacity: 0.7,
            strokeStyle: 'dash',
          });

          polyline.setMap(map);
          polylines.push(polyline);
        }
      }
      
      // 생성된 경로선들을 참조에 저장하여 나중에 제거 가능하도록 관리
      polylinesRef.current = polylines;
    }

    // UserRequest: 대표장소 변경 시 지도 위치를 유지하고 최초 로딩이나 장소 개수 변경 시에만 bounds 재설정하여 사용자 경험 개선
    const currentPlacesCount = allPlacesData.size;
    const shouldUpdateBounds = !hasInitializedBounds.current || prevPlacesCountRef.current !== currentPlacesCount;
    
    if (markers.length > 0 && shouldUpdateBounds) {
      map.setBounds(bounds);
      hasInitializedBounds.current = true;
      prevPlacesCountRef.current = currentPlacesCount;
    }
  }, [ready, allPlacesData, categories]);

  // 사용자가 장소 아이템 클릭 시 해당 장소로 지도를 부드럽게 이동하고 확대
  useEffect(() => {
    if (!ready || !mapInstance.current || !focusedPlace) return;

    const map = mapInstance.current;
    const kakao = window.kakao;

    // panTo를 사용하여 부드러운 애니메이션과 함께 지도 중심 이동
    const moveLatLon = new kakao.maps.LatLng(focusedPlace.lat, focusedPlace.lng);
    map.panTo(moveLatLon);
    
    // 이동 후 줌 레벨을 3으로 설정하여 장소 상세 확인 가능하도록 확대
    setTimeout(() => {
      map.setLevel(3);
    }, 300);
  }, [ready, focusedPlace]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">지도 로딩 중...</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
};
