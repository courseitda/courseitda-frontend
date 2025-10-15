import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Category, Place } from '@/entities/types';
import { useKakaoLoader } from '@/shared/hooks/use-kakao-loader';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { db } from '@/mock/db';
import { getPlacesByCategory } from '@/mock/edge-functions/place';
import { setRepresentativePlace } from '@/mock/edge-functions/category';
import { toast } from 'sonner';

// 두 색상 간 선형 보간 함수
const interpolateColor = (color1: string, color2: string, ratio: number = 0.5): string => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

interface MapCanvasProps {
  workspaceId: string;
  categories: Category[];
  focusedPlace?: Place | null;
}

export const MapCanvas = ({ workspaceId, categories, focusedPlace }: MapCanvasProps) => {
  const kakaoJsApiKey = useSettingsStore((state) => state.kakaoJsApiKey);
  const { ready, error } = useKakaoLoader(kakaoJsApiKey);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const currentInfoWindowRef = useRef<any>(null);

  // Get all places for all categories
  const allPlacesData = useLiveQuery(async () => {
    const placesMap = new Map();
    
    for (const category of categories) {
      const places = await getPlacesByCategory(category.id);
      for (const place of places) {
        placesMap.set(place.id, { place, category });
      }
    }
    
    return placesMap;
  }, [categories]);

  // Initialize map
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao || mapInstance.current) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // Seoul
      level: 5,
    };

    mapInstance.current = new window.kakao.maps.Map(container, options);

    // Close info window when clicking on map
    window.kakao.maps.event.addListener(mapInstance.current, 'click', () => {
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.setMap(null);
        currentInfoWindowRef.current = null;
      }
    });

    // Handle map relayout on window resize
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.relayout();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial relayout
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.relayout();
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ready]);

  // Update markers and route
  useEffect(() => {
    if (!ready || !mapInstance.current || !allPlacesData) return;

    const kakao = window.kakao;
    const map = mapInstance.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    const markers: any[] = [];

    // Create a map to track representative places and their order
    const representativeMap = new Map<string, number>();
    categories.forEach((cat, index) => {
      if (cat.representativePlaceId) {
        representativeMap.set(cat.representativePlaceId, index + 1);
      }
    });

    // Add markers for all places
    allPlacesData.forEach(({ place, category }) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);

      const isRepresentative = category.representativePlaceId === place.id;
      const categoryOrder = representativeMap.get(place.id);

      const markerContent = document.createElement('div');
      
      if (isRepresentative && categoryOrder) {
        // Representative place marker with number
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
        // Regular place marker (smaller, no number)
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

      const customOverlay = new kakao.maps.CustomOverlay({
        position,
        content: markerContent,
        zIndex: isRepresentative ? 100 : 50,
      });

      customOverlay.setMap(map);
      markers.push(customOverlay);

      // Create info window DOM element
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

        const handleCheckClick = async (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const newPlaceId = currentIsRepresentative ? null : place.id;
          
          const { error } = await setRepresentativePlace(category.id, newPlaceId);
          
          if (error) {
            toast.error(error);
          } else {
            // UserRequest: 대표장소 설정 시 토스트 메시지 제거
            // Close info window after successful operation
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

      // Add click event to show info window
      markerContent.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close current info window if exists
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.setMap(null);
        }

        // Create new info window with current state
        const infoWindowContent = createInfoWindowElement();
        const infoWindow = new kakao.maps.CustomOverlay({
          position: position,
          content: infoWindowContent,
          yAnchor: 1.5,
          zIndex: 200,
          clickable: true,
        });

        infoWindow.setMap(map);
        currentInfoWindowRef.current = infoWindow;
      });
    });

    markersRef.current = markers;

    // Draw route connecting representative places with gradient colors
    const representativeCategoriesWithPlaces = categories
      .filter((cat) => cat.representativePlaceId)
      .map((cat) => {
        const data = allPlacesData.get(cat.representativePlaceId!);
        return data ? { category: cat, place: data.place } : null;
      })
      .filter((item) => item !== null);

    if (representativeCategoriesWithPlaces.length >= 2) {
      const polylines: any[] = [];
      
      // Draw individual segments between consecutive representative places
      for (let i = 0; i < representativeCategoriesWithPlaces.length - 1; i++) {
        const current = representativeCategoriesWithPlaces[i]!;
        const next = representativeCategoriesWithPlaces[i + 1]!;
        
        // UserRequest: 경로를 20개의 선분으로 분할하여 양 끝 마커 색상으로 그라데이션 구현
        // Create gradient by dividing the segment into multiple smaller segments
        const numSegments = 20; // Number of sub-segments for smooth gradient
        
        for (let j = 0; j < numSegments; j++) {
          const ratio1 = j / numSegments;
          const ratio2 = (j + 1) / numSegments;
          
          // Calculate intermediate positions
          const lat1 = current.place.lat + (next.place.lat - current.place.lat) * ratio1;
          const lng1 = current.place.lng + (next.place.lng - current.place.lng) * ratio1;
          const lat2 = current.place.lat + (next.place.lat - current.place.lat) * ratio2;
          const lng2 = current.place.lng + (next.place.lng - current.place.lng) * ratio2;
          
          // Calculate color for this sub-segment
          const segmentColor = interpolateColor(current.category.color, next.category.color, ratio1);
          
          const segmentPath = [
            new kakao.maps.LatLng(lat1, lng1),
            new kakao.maps.LatLng(lat2, lng2),
          ];

          // UserRequest: 점선 스타일 유지하면서 그라데이션 적용
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
      
      polylinesRef.current = polylines;
    }

    // Fit bounds
    if (markers.length > 0) {
      map.setBounds(bounds);
    }
  }, [ready, allPlacesData, categories]);

  // Focus on selected place
  useEffect(() => {
    if (!ready || !mapInstance.current || !focusedPlace) return;

    const map = mapInstance.current;
    const kakao = window.kakao;

    // Move to place location with smooth animation
    const moveLatLon = new kakao.maps.LatLng(focusedPlace.lat, focusedPlace.lng);
    map.panTo(moveLatLon);
    
    // Set zoom level
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
