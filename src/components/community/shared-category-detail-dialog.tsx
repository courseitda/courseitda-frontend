import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useNaverLoader } from '@/shared/hooks/use-naver-loader';
import { PlaceInfoWindow } from '@/features/map/place-info-window';

type SharedCategoryDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SharedSavedCategory | null;
};

type SharedCategoryMapProps = {
  open: boolean;
  places: SharedSavedCategory['places'];
  focusedPlaceId: string | null;
};

// UserRequest: 공유 카테고리 팝업 지도에 장소 좌표를 표시하는 지도 컴포넌트 추가
const SharedCategoryMap = ({ open, places, focusedPlaceId }: SharedCategoryMapProps) => {
  const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
  const { ready, error } = useNaverLoader(naverMapKeyId);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const markerMapRef = useRef<
    Map<
      string,
      { marker: naver.maps.Marker; position: naver.maps.LatLng; name: string; openInfoWindow: () => void }
    >
  >(new Map());
  const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  useEffect(() => {
    // UserRequest: 팝업이 열리고 SDK 로딩 완료 시에만 지도 초기화
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

    // 지도 클릭 시 열려있는 정보창 닫기 - 사용자 경험 개선
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
    // UserRequest: 공유 카테고리 장소 좌표를 지도 마커로 반영
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
      // UserRequest: 좌표가 없을 때 기본 중심 좌표로 이동
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
        // UserRequest: 공유 카테고리 팝업 지도 마커를 붉은 물방울 형태로 표시
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

      // UserRequest: 워크스페이스 상세보기와 동일한 스타일의 InfoWindow 사용
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
          // UserRequest: InfoWindow와 마커 간격을 좁혀 시각적 연결감 강화
          pixelOffset: new naver.maps.Point(0, -26),
          disableAnchor: true,
        });
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
      };

      markerMapRef.current.set(place.id, {
        marker,
        position,
        name: place.name,
        openInfoWindow,
      });
      bounds.extend(position);
    });

    // UserRequest: 팝업 진입 시 지도 레이아웃을 먼저 갱신한 후 모든 마커가 보이도록 bounds 적용
    naver.maps.Event.trigger(map, 'resize');
    map.fitBounds(bounds);
  }, [open, ready, places]);

  useEffect(() => {
    // UserRequest: 장소 클릭 시 해당 마커를 중앙으로 이동하고 이름 라벨을 표시
    if (!open || !ready || !mapInstanceRef.current || !window.naver || !window.naver.maps) return;
    if (!focusedPlaceId) return;

    const target = markerMapRef.current.get(focusedPlaceId);
    if (!target) return;

    const { naver } = window;
    const map = mapInstanceRef.current;

    // UserRequest: 장소 클릭 시 지도 중심 이동 + 줌 인 + InfoWindow 표시
    map.panTo(target.position);
    setTimeout(() => {
      map.setZoom(14);
    }, 300);
    setTimeout(() => {
      target.openInfoWindow();
    }, 350);
  }, [open, ready, focusedPlaceId]);

  useEffect(() => {
    // 팝업 닫힘 시 지도 인스턴스와 마커 참조를 정리하여 누수 방지
    if (!open) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      markerMapRef.current.clear();
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
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

// UserRequest: 공유 카테고리 상세 다이얼로그를 공통 컴포넌트로 분리
const SharedCategoryDetailDialog = ({
  open,
  onOpenChange,
  category,
}: SharedCategoryDetailDialogProps) => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    if (open) {
      setFocusedPlaceId(null);
    }
  }, [open, category?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">{category?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-primary" />
              {category?.uploader}
            </span>
            {category?.uploadedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {new Date(category.uploadedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          <SharedCategoryMap open={open} places={category?.places ?? []} focusedPlaceId={focusedPlaceId} />
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              장소 목록
              {category?.placeCount !== undefined && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({category.placeCount}곳)
                </span>
              )}
            </p>
            {/* UserRequest: 장소 목록은 3개까지만 보이고 이후는 스크롤로 확인 */}
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {category?.places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setFocusedPlaceId(place.id)}
                  className="w-full text-left p-3 flex flex-col gap-1 hover:bg-accent/40 transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {place.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{place.addressName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharedCategoryDetailDialog;
