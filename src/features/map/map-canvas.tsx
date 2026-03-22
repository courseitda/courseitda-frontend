import {useEffect, useMemo, useRef, useState} from 'react';
import type {Place} from '@/entities/types';
import {useNaverLoader} from '@/shared/hooks/use-naver-loader';
import {useSettingsStore} from '@/shared/stores/settings-store';
import {toast} from 'sonner';
import type {WorkspaceCategory} from '@/services/api/category.service';
import {Button} from '@/components/ui/button';
import {LocateFixed, Loader2} from 'lucide-react';
import {UI_COPY} from '@/shared/constants/ui-copy';
import {useNaverMapInstance} from './use-naver-map-instance';
import {useMapCanvasOverlays} from './use-map-canvas-overlays';
import type {MarkerMapItem} from './map-canvas.types';

interface MapCanvasProps {
    workspaceId: string;
    workspaceIdentifier: string;
    categories: WorkspaceCategory[];
    focusedPlace?: Place | null;
    isFullscreen?: boolean;
}

// 지도 캔버스 컴포넌트 - Naver Maps SDK를 사용하여 장소 마커와 경로를 표시
export const MapCanvas = ({
    workspaceId,
    workspaceIdentifier,
    categories,
    focusedPlace,
    isFullscreen = false,
}: MapCanvasProps) => {
    const naverMapKeyId = useSettingsStore((state) => state.naverMapKeyId);
    const {ready, error} = useNaverLoader(naverMapKeyId);
    const {
        mapRef,
        mapInstance,
        mapReady,
        hasInitializedBounds,
        prevPlacesCountRef,
    } = useNaverMapInstance({
        ready,
        workspaceId,
        isFullscreen,
    });
    const markersRef = useRef<naver.maps.Marker[]>([]);
    const polylinesRef = useRef<naver.maps.Polyline[]>([]);
    const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
    // 장소 ID를 키로 마커와 정보창 열기 함수를 저장 - 장소 클릭 시 InfoWindow 자동 표시에 사용
    const markerMapRef = useRef<Map<string, MarkerMapItem>>(new Map());
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

    const placeEntries = useMemo(
        () =>
            categories.flatMap(({category, places}) =>
                places.map((item) => ({
                    category,
                    place: item.place,
                    categoryPlaceId: item.id,
                    isRepresentative: item.isRepresentative,
                })),
            ),
        [categories],
    );
    useMapCanvasOverlays({
        ready,
        mapReady,
        workspaceIdentifier,
        categories,
        placeEntries,
        mapInstance,
        markersRef,
        polylinesRef,
        currentInfoWindowRef,
        markerMapRef,
        hasInitializedBounds,
        prevPlacesCountRef,
    });

    // 사용자가 장소 아이템 클릭 시 해당 장소로 지도를 부드럽게 이동하고 확대
    // UserRequest: 장소 목록 클릭 시 InfoWindow도 자동으로 표시
    useEffect(() => {
        if (!ready || !mapReady || !mapInstance.current || !focusedPlace || !window.naver || !window.naver.maps) return;

        const map = mapInstance.current;
        const {naver} = window;

        // 지도 중심을 해당 장소로 이동
        const moveLatLon = new naver.maps.LatLng(focusedPlace.latitude, focusedPlace.longitude);
        map.panTo(moveLatLon);

        // 이동 후 줌 레벨을 조정하여 장소 상세 확인 가능하도록 확대
        setTimeout(() => {
            map.setZoom(14);
        }, 300);

        // 해당 장소의 InfoWindow 자동으로 열기 - 장소 목록 클릭 시 사용자 경험 개선
        const markerData = markerMapRef.current.get(focusedPlace.id);
        if (markerData) {
            // 지도 이동 후 정보창 표시
            setTimeout(() => {
                markerData.openInfoWindow();
            }, 350);
        }
    }, [ready, mapInstance, mapReady, focusedPlace]);

    // UserRequest: 내 위치 버튼 클릭 시 현재 위치를 가져와 지도 중심으로 이동
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error(UI_COPY.map.browserLocationUnsupported);
            return;
        }

        if (!ready || !mapReady || !mapInstance.current || !window.naver || !window.naver.maps) {
            toast.error(UI_COPY.map.mapNotReady);
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                const {latitude, longitude} = position.coords;
                const {naver} = window;
                const userLatLng = new naver.maps.LatLng(latitude, longitude);
                const map = mapInstance.current!;

                // UserRequest: 현재 위치에 파란 원형 마커를 그려 위치를 강조
                if (!userLocationMarkerRef.current) {
                    const marker = new naver.maps.Marker({
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
                    userLocationMarkerRef.current = marker;
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
                    setTimeout(() => {
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

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <p className="text-destructive">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            {(!ready || !mapReady) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <p className="text-muted-foreground">{UI_COPY.map.loading}</p>
                </div>
            )}
            <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-4 right-4 rounded-full shadow-lg border border-border bg-background/90 backdrop-blur hover:bg-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary z-20 w-11 h-11"
                onClick={handleLocateMe}
                disabled={isLocating || !mapReady}
                aria-label={UI_COPY.map.locateMeAriaLabel}
            >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            </Button>
        </div>
    );
};
