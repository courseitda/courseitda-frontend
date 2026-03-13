import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useNaverLoader } from '@/shared/hooks/use-naver-loader';
import { PlaceInfoWindow } from '@/features/map/place-info-window';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { Loader2, LocateFixed } from 'lucide-react';

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
  const userLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
    };
  }, []);

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

      // UserRequest: 내 카테고리 상세 지도도 워크스페이스 상세와 동일하게 마커 클릭 시 장소명을 즉시 표시한다.
      naver.maps.Event.addListener(marker, 'click', openInfoWindow);

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
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
      mapInstanceRef.current = null;
    }
  }, [open]);

  // UserRequest: 내 카테고리 상세/생성 지도에도 현재 위치 바로가기를 제공해 주변 장소 탐색을 빠르게 한다.
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error(UI_COPY.map.browserLocationUnsupported);
      return;
    }

    if (!ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) {
      toast.error(UI_COPY.map.mapNotReady);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const { naver } = window;
        const userLatLng = new naver.maps.LatLng(latitude, longitude);
        const map = mapInstanceRef.current!;

        // 현재 위치 마커를 재사용해 버튼 재클릭 시에도 위치만 갱신한다.
        if (!userLocationMarkerRef.current) {
          userLocationMarkerRef.current = new naver.maps.Marker({
            position: userLatLng,
            map,
            icon: {
              content: `
                <div style="
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  border: 3px solid hsl(var(--map-user-location-border));
                  background: hsl(var(--map-user-location-bg));
                  box-shadow: 0 0 0 8px hsl(var(--map-user-location-ring)), var(--map-user-location-shadow);
                "></div>
              `,
              anchor: new naver.maps.Point(11, 11),
            },
            zIndex: 200,
          });
        } else {
          userLocationMarkerRef.current.setPosition(userLatLng);
          userLocationMarkerRef.current.setMap(map);
        }

        const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 13;
        const targetZoom = Math.max(currentZoom, 15);
        if (typeof map.morph === 'function') {
          map.morph(userLatLng, targetZoom);
        } else {
          map.panTo(userLatLng);
          window.setTimeout(() => {
            if (map.getZoom() < targetZoom) {
              map.setZoom(targetZoom);
            }
          }, 280);
        }
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          toast.error(UI_COPY.map.locationPermissionDenied);
        } else {
          toast.error(UI_COPY.map.locationFetchFailed);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

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

  return (
    <div className="relative">
      <div className="absolute bottom-4 right-4 z-20">
        {/* UserRequest: 내 카테고리 상세/생성 지도에서도 워크스페이스 상세와 같은 내 위치 바로가기 버튼을 노출한다. */}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full border border-border bg-background/90 shadow-lg backdrop-blur hover:bg-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          onClick={handleLocateMe}
          disabled={isLocating || !ready}
          aria-label="내 위치로 이동"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-border overflow-hidden" />
    </div>
  );
};
