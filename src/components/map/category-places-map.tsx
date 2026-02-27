import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useNaverLoader } from '@/shared/hooks/use-naver-loader';
import { PlaceInfoWindow } from '@/features/map/place-info-window';

type CategoryMapPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type CategoryPlacesMapProps = {
  open: boolean;
  places: CategoryMapPlace[];
  focusedPlaceId: string | null;
};

// UserRequest: 내 카테고리/공유 카테고리 상세 지도 로직을 공통 컴포넌트로 통합
export const CategoryPlacesMap = ({ open, places, focusedPlaceId }: CategoryPlacesMapProps) => {
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const { ready, error } = useNaverLoader(naverMapKeyId);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const markerMapRef = useRef<
    Map<string, { marker: naver.maps.Marker; position: naver.maps.LatLng; openInfoWindow: () => void }>
  >(new Map());
  const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const openInfoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !ready || !mapRef.current || !window.naver || !window.naver.maps || mapInstanceRef.current) {
      return;
    }

    const { naver } = window;
    const firstPlace = places[0];
    const initialCenter = firstPlace
      ? new naver.maps.LatLng(firstPlace.latitude, firstPlace.longitude)
      : new naver.maps.LatLng(37.5665, 126.9780);

    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
    });

    const handleMapClick = () => {
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };

    const clickListener = naver.maps.Event.addListener(mapInstanceRef.current, 'click', handleMapClick);

    return () => {
      naver.maps.Event.removeListener(clickListener);
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
    };
  }, [open, ready, places]);

  useEffect(() => {
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;

    const { naver } = window;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markerMapRef.current.clear();
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
      currentInfoWindowRef.current = null;
    }

    const validPlaces = places.filter(
      (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
    );

    if (validPlaces.length === 0) {
      map.panTo(new naver.maps.LatLng(37.5665, 126.9780));
      map.setZoom(13);
      return;
    }

    const bounds = new naver.maps.LatLngBounds();

    validPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(place.latitude, place.longitude);
      const marker = new naver.maps.Marker({
        position,
        map,
        icon: {
          content: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: hsl(var(--map-marker-drop-bg));
              border: 2px solid hsl(var(--map-marker-drop-border));
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: var(--map-marker-drop-shadow);
            "></div>
          `,
          anchor: new naver.maps.Point(12, 24),
        },
      });
      markersRef.current.push(marker);

      const createInfoWindowElement = () => {
        const container = document.createElement('div');
        const root = createRoot(container);
        flushSync(() => {
          root.render(
            <PlaceInfoWindow
              placeName={place.name}
              isRepresentative={false}
              onToggleRepresentative={() => undefined}
              showRepresentativeAction={false}
            />,
          );
        });
        return container;
      };

      const openInfoWindow = () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }

        const infoWindow = new naver.maps.InfoWindow({
          content: createInfoWindowElement(),
          borderWidth: 0,
          backgroundColor: 'transparent',
          pixelOffset: new naver.maps.Point(0, -26),
          disableAnchor: true,
        });
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
      };

      markerMapRef.current.set(place.id, {
        marker,
        position,
        openInfoWindow,
      });
      bounds.extend(position);
    });

    naver.maps.Event.trigger(map, 'resize');
    map.fitBounds(bounds);
  }, [open, ready, places]);

  useEffect(() => {
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;
    if (!focusedPlaceId) return;

    const target = markerMapRef.current.get(focusedPlaceId);
    if (!target) return;

    const { naver } = window;
    const map = mapInstanceRef.current;
    if (openInfoTimeoutRef.current) {
      window.clearTimeout(openInfoTimeoutRef.current);
      openInfoTimeoutRef.current = null;
    }
    // UserRequest: 장소 클릭 시 안내 메시지가 너무 늦게 뜨지 않도록 짧은 지연 후 표시
    map.panTo(target.position);
    openInfoTimeoutRef.current = window.setTimeout(() => {
      target.openInfoWindow();
      openInfoTimeoutRef.current = null;
    }, 140);
  }, [open, ready, focusedPlaceId]);

  useEffect(() => {
    if (!open) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      markerMapRef.current.clear();
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
      if (openInfoTimeoutRef.current) {
        window.clearTimeout(openInfoTimeoutRef.current);
        openInfoTimeoutRef.current = null;
      }
      mapInstanceRef.current = null;
    }
  }, [open]);

  if (!naverMapKeyId || error) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
        네이버 지도 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        지도 로딩 중...
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-96 rounded-lg border border-border overflow-hidden" />;
};
