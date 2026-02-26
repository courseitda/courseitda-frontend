import {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {Category, Place} from '@/entities/types';
import {useNaverLoader} from '@/shared/hooks/use-naver-loader';
import {useSettingsStore} from '@/shared/stores/settings-store';
import {categoryApi} from '@/services/api';
import {toast} from 'sonner';
import type {WorkspaceCategory} from '@/services/api/category.service';
import {useQueryClient} from '@tanstack/react-query';
import {PlaceInfoWindow} from './place-info-window';
import {Button} from '@/components/ui/button';
import {LocateFixed, Loader2} from 'lucide-react';

// 지도 캔버스 컴포넌트 - Naver Maps SDK를 사용하여 장소 마커와 경로 표시
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
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<naver.maps.Map | null>(null);
    const markersRef = useRef<naver.maps.Marker[]>([]);
    const polylinesRef = useRef<naver.maps.Polyline[]>([]);
    const currentInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
    const hasInitializedBounds = useRef<boolean>(false);
    const prevPlacesCountRef = useRef<number>(0);
    // 장소 ID를 키로 마커와 정보창 열기 함수를 저장 - 장소 클릭 시 InfoWindow 자동 표시에 사용
    const markerMapRef = useRef<Map<string, { marker: naver.maps.Marker; openInfoWindow: () => void }>>(new Map());
    const queryClient = useQueryClient();
    const [mapReady, setMapReady] = useState(false);
    const userLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // 워크스페이스 변경 시 지도 초기화 플래그 리셋하여 새로운 경계값 적용
    useEffect(() => {
        hasInitializedBounds.current = false;
        prevPlacesCountRef.current = 0;
    }, [workspaceId]);

    useEffect(() => {
        // UserRequest: 전체 화면 모드 전환 시 지도 크기를 재조정하여 여백 없이 표시
        if (!mapInstance.current || !window.naver || !window.naver.maps) return;
        const {naver} = window;
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

    // Naver Maps SDK를 사용하여 지도 초기화 및 기본 이벤트 설정
    useEffect(() => {
        // SDK 로드 완료, DOM 준비, 중복 초기화 방지를 위한 전제 조건 확인
        if (!ready || !mapRef.current || !window.naver || !window.naver.maps || mapInstance.current) return;

        const {naver} = window;
        const container = mapRef.current;
        // 서울 시청 기준으로 지도 초기 위치 설정
        const options = {
            center: new naver.maps.LatLng(37.5665, 126.9780),
            zoom: 13,
        };

        // Naver Maps 인스턴스 생성
        mapInstance.current = new naver.maps.Map(container, options);
        setMapReady(true);

        // 지도 클릭 시 열려있는 정보창 닫기 - 사용자 경험 개선
        const handleMapClick = () => {
            if (currentInfoWindowRef.current) {
                currentInfoWindowRef.current.close();
                currentInfoWindowRef.current = null;
            }
        };

        const mapClickListener = naver.maps.Event.addListener(mapInstance.current, 'click', handleMapClick);

        // 브라우저 리사이즈 시 지도 크기 재조정 - 반응형 레이아웃 지원
        const handleResize = () => {
            if (mapInstance.current) {
                naver.maps.Event.trigger(mapInstance.current, 'resize');
            }
        };

        window.addEventListener('resize', handleResize);

        // 초기 렌더링 후 지도 레이아웃 재조정 - 컨테이너 크기 불일치 해결
        setTimeout(() => {
            if (mapInstance.current) {
                naver.maps.Event.trigger(mapInstance.current, 'resize');
            }
        }, 100);

        // 클린업 함수 - 이벤트 리스너 제거 및 정보창 닫기로 메모리 누수 방지
        return () => {
            window.removeEventListener('resize', handleResize);
            naver.maps.Event.removeListener(mapClickListener);
            if (currentInfoWindowRef.current) {
                currentInfoWindowRef.current.close();
                currentInfoWindowRef.current = null;
            }
        };
    }, [ready]);

    // 장소 데이터 변경 시 마커와 경로를 업데이트하여 지도에 실시간 반영
    useEffect(() => {
        // SDK 로드 및 지도 인스턴스 준비 상태 확인
        if (!ready || !mapInstance.current || !window.naver || !window.naver.maps) return;

        const {naver} = window;
        const map = mapInstance.current;

        // 기존 정보창이 열려있으면 닫기 - 데이터 변경 시 혼란 방지
        if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
            currentInfoWindowRef.current = null;
        }

        // 기존 마커 모두 제거 - 새로운 데이터로 전체 재렌더링
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // 기존 경로선 모두 제거 - 대표 장소 변경 시 경로 재계산
        polylinesRef.current.forEach((polyline) => polyline.setMap(null));
        polylinesRef.current = [];

        // 기존 마커 맵 초기화 - 장소 목록 변경 시 새로 구성
        markerMapRef.current.clear();

        // 장소가 없으면 빈 지도 표시
        if (placeEntries.length === 0) {
            prevPlacesCountRef.current = 0;
            return;
        }

        // 모든 마커를 포함하는 경계 영역 계산을 위한 객체
        const bounds = new naver.maps.LatLngBounds();
        const markers: naver.maps.Marker[] = [];

        // 대표 장소에 표시할 순서 번호 매핑 생성 - 카테고리 순서대로 1, 2, 3...
        const representativeMap = new Map<string, number>();
        categories.forEach(({category}, index) => {
            if (category.representativePlaceId) {
                representativeMap.set(category.representativePlaceId, index + 1);
            }
        });

        // 장소 정보를 빠르게 조회하기 위한 Map 구조
        const placesMap = new Map<
            string,
            { category: Category; place: Place; categoryPlaceId: string; isRepresentative: boolean }
        >();

        // 각 장소에 대해 마커 생성 및 지도에 추가
        placeEntries.forEach((entry) => {
            const {category, place, categoryPlaceId, isRepresentative} = entry;

            // 잘못된 좌표 데이터 필터링 - 유효하지 않은 위치는 스킵
            if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
                return;
            }

            placesMap.set(categoryPlaceId, entry);
            const position = new naver.maps.LatLng(place.latitude, place.longitude);
            // 경계 영역에 현재 장소 위치 포함
            bounds.extend(position);

            const categoryOrder = representativeMap.get(categoryPlaceId);

            // 대표 장소는 크고 굵게, 일반 장소는 작게 표시하여 시각적 구분
            const size = isRepresentative && categoryOrder ? 32 : 20;
            const borderWidth = isRepresentative && categoryOrder ? 3 : 2;

            const markerContent = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${category.color};
          border: ${borderWidth}px solid hsl(var(--card));
          border-radius: 50%;
          box-shadow: var(--map-marker-shadow);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: hsl(var(--card));
          font-size: 14px;
          cursor: pointer;
        ">
          ${isRepresentative && categoryOrder ? String(categoryOrder) : ''}
        </div>
      `;

            const marker = new naver.maps.Marker({
                position,
                map,
                icon: {
                    content: markerContent,
                    anchor: new naver.maps.Point(size / 2, size / 2),
                },
                zIndex: isRepresentative ? 100 : 50,
            });

            markers.push(marker);

            // 마커 클릭 시 표시할 정보창 DOM 요소 생성 - React 컴포넌트를 사용하여 일관된 디자인 유지
            // UserRequest: 폼 디자인 일관성을 위해 PlaceInfoWindow React 컴포넌트 사용
            const createInfoWindowElement = () => {
                const currentIsRepresentative = category.representativePlaceId === categoryPlaceId;

                // React 컴포넌트를 렌더링할 DOM 컨테이너 생성
                const container = document.createElement('div');

                // 대표 장소 설정/해제 핸들러 - API 호출 후 지도 정보창 닫기 및 캐시 무효화
                const handleToggleRepresentative = async () => {
                    const {error} = currentIsRepresentative
                        ? await categoryApi.unsetRepresentativePlace(category.id)
                        : await categoryApi.setRepresentativePlace(category.id, categoryPlaceId);

                    if (error) {
                        toast.error(error);
                    } else {
                        // 정보창 닫기 - 대표 장소 변경 시 UI 즉시 업데이트
                        if (currentInfoWindowRef.current) {
                            currentInfoWindowRef.current.close();
                            currentInfoWindowRef.current = null;
                        }
                        // React Query 캐시 무효화하여 최신 데이터 반영
                        queryClient.invalidateQueries({queryKey: ['workspace', workspaceIdentifier, 'categories']});
                    }
                };

                // React 컴포넌트를 동기적으로 렌더링 - InfoWindow에 전달하기 전에 DOM이 완전히 구성되도록 보장
                const root = createRoot(container);
                flushSync(() => {
                    root.render(
                        <PlaceInfoWindow
                            placeName={place.name}
                            isRepresentative={currentIsRepresentative}
                            onToggleRepresentative={handleToggleRepresentative}
                        />
                    );
                });

                return container;
            };

            // 정보창 열기 함수 - 마커 클릭 및 장소 목록 클릭 시 재사용
            const openInfoWindow = () => {
                // 이전 정보창이 열려있으면 닫기
                if (currentInfoWindowRef.current) {
                    currentInfoWindowRef.current.close();
                }

                const infoWindowContent = createInfoWindowElement();
                const infoWindow = new naver.maps.InfoWindow({
                    content: infoWindowContent,
                    disableAnchor: true,
                    borderWidth: 0,
                    backgroundColor: 'transparent',
                    pixelOffset: new naver.maps.Point(0, -18),
                    zIndex: 1000,
                });

                infoWindow.open(map, marker);
                currentInfoWindowRef.current = infoWindow;
            };

            // 마커 클릭 시 정보창 표시
            naver.maps.Event.addListener(marker, 'click', openInfoWindow);

            // 장소 ID를 키로 마커와 정보창 열기 함수 저장 - 장소 목록 클릭 시 사용
            markerMapRef.current.set(place.id, {marker, openInfoWindow});
        });

        // 생성된 마커들을 참조에 저장하여 나중에 제거 가능하도록 관리
        markersRef.current = markers;

        // 대표 장소들을 연결하는 경로선 그리기 - 카테고리 색상으로 그라데이션 적용
        const representativeCategoriesWithPlaces = categories
            .filter(({category}) => category.representativePlaceId)
            .map(({category}) => {
                const data = placesMap.get(category.representativePlaceId!);
                return data ? {category, place: data.place} : null;
            })
            .filter((item) => item !== null);

        // 대표 장소가 2개 이상일 때만 경로선 표시
        if (representativeCategoriesWithPlaces.length >= 2) {
            const polylines: naver.maps.Polyline[] = [];

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
                    const lat1 = current.place.latitude + (next.place.latitude - current.place.latitude) * ratio1;
                    const lng1 = current.place.longitude + (next.place.longitude - current.place.longitude) * ratio1;
                    const lat2 = current.place.latitude + (next.place.latitude - current.place.latitude) * ratio2;
                    const lng2 = current.place.longitude + (next.place.longitude - current.place.longitude) * ratio2;

                    // 각 선분의 색상을 두 카테고리 색상 사이의 보간 값으로 계산
                    const segmentColor = interpolateColor(current.category.color, next.category.color, ratio1);

                    const segmentPath = [
                        new naver.maps.LatLng(lat1, lng1),
                        new naver.maps.LatLng(lat2, lng2),
                    ];

                    // UserRequest: 점선 스타일을 유지하면서 그라데이션 적용하여 경로의 시각적 흐름 강화
                    const polyline = new naver.maps.Polyline({
                        path: segmentPath,
                        strokeWeight: 3,
                        strokeColor: segmentColor,
                        strokeOpacity: 0.7,
                        strokeStyle: 'shortdash',
                    });

                    polyline.setMap(map);
                    polylines.push(polyline);
                }
            }

            // 생성된 경로선들을 참조에 저장하여 나중에 제거 가능하도록 관리
            polylinesRef.current = polylines;
        }

        // UserRequest: 대표장소 변경 시 지도 위치를 유지하고 최초 로딩이나 장소 개수 변경 시에만 bounds 재설정하여 사용자 경험 개선
        const currentPlacesCount = placeEntries.length;
        const shouldUpdateBounds = !hasInitializedBounds.current || prevPlacesCountRef.current !== currentPlacesCount;

        if (markers.length > 0 && shouldUpdateBounds) {
            map.fitBounds(bounds);
            hasInitializedBounds.current = true;
            prevPlacesCountRef.current = currentPlacesCount;
        }
    }, [ready, mapReady, categories, placeEntries, queryClient, workspaceIdentifier]);

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
    }, [ready, mapReady, focusedPlace]);

    // UserRequest: 내 위치 버튼 클릭 시 현재 위치를 가져와 지도 중심으로 이동
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
            return;
        }

        if (!ready || !mapReady || !mapInstance.current || !window.naver || !window.naver.maps) {
            toast.error('지도가 아직 준비되지 않았습니다.');
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
                    toast.error('위치 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.');
                } else {
                    toast.error('현재 위치를 가져오지 못했습니다. 다시 시도해주세요.');
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
                    <p className="text-muted-foreground">지도 로딩 중...</p>
                </div>
            )}
            <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-4 right-4 rounded-full shadow-lg border border-border bg-background/90 backdrop-blur hover:bg-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary z-20 w-11 h-11"
                onClick={handleLocateMe}
                disabled={isLocating || !mapReady}
                aria-label="내 위치로 이동"
            >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            </Button>
        </div>
    );
};
