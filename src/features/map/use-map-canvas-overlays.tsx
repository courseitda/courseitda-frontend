import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { categoryApi } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { PlaceInfoWindow } from '@/features/map/place-info-window';
import type { WorkspaceCategory } from '@/services/api/category.service';
import type { MarkerMapItem, MapPlaceEntry } from '@/features/map/map-canvas.types';
import { interpolateColor } from '@/features/map/map-canvas.utils';
import { MESSAGES } from '@/shared/constants/messages';

type UseMapCanvasOverlaysOptions = {
  ready: boolean;
  mapReady: boolean;
  workspaceIdentifier: string;
  categories: WorkspaceCategory[];
  placeEntries: MapPlaceEntry[];
  mapInstance: React.MutableRefObject<naver.maps.Map | null>;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  polylinesRef: React.MutableRefObject<naver.maps.Polyline[]>;
  currentInfoWindowRef: React.MutableRefObject<naver.maps.InfoWindow | null>;
  markerMapRef: React.MutableRefObject<Map<string, MarkerMapItem>>;
  hasInitializedBounds: React.MutableRefObject<boolean>;
  prevPlacesCountRef: React.MutableRefObject<number>;
};

// 지도 오버레이 렌더링과 InfoWindow 상호작용을 전담하는 훅
export const useMapCanvasOverlays = ({
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
}: UseMapCanvasOverlaysOptions) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // SDK 로드 및 지도 인스턴스 준비 상태 확인
    if (!ready || !mapReady || !mapInstance.current || !window.naver || !window.naver.maps) return;

    const { naver } = window;
    const map = mapInstance.current;

    // 기존 정보창이 열려있으면 닫기 - 데이터 변경 시 혼란 방지
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
      currentInfoWindowRef.current = null;
    }

    // 기존 마커와 경로선을 모두 제거하여 최신 데이터로 다시 구성
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
    markerMapRef.current.clear();

    if (placeEntries.length === 0) {
      prevPlacesCountRef.current = 0;
      return;
    }

    const bounds = new naver.maps.LatLngBounds();
    const markers: naver.maps.Marker[] = [];
    const representativeMap = new Map<string, number>();

    categories.forEach(({ category }, index) => {
      if (category.representativePlaceId) {
        representativeMap.set(category.representativePlaceId, index + 1);
      }
    });

    const placesMap = new Map<string, MapPlaceEntry>();

    placeEntries.forEach((entry) => {
      const { category, place, categoryPlaceId, isRepresentative } = entry;

      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        return;
      }

      placesMap.set(categoryPlaceId, entry);
      const position = new naver.maps.LatLng(place.latitude, place.longitude);
      bounds.extend(position);
      const categoryOrder = representativeMap.get(categoryPlaceId);
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

      const createInfoWindowElement = () => {
        const currentIsRepresentative = category.representativePlaceId === categoryPlaceId;
        const container = document.createElement('div');

        const handleToggleRepresentative = async () => {
          const { error } = currentIsRepresentative
            ? await categoryApi.unsetRepresentativePlace(category.id)
            : await categoryApi.setRepresentativePlace(category.id, categoryPlaceId);

          if (error) {
            toast.error(error || MESSAGES.common.defaultError);
            return;
          }

          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
            currentInfoWindowRef.current = null;
          }

          queryClient.invalidateQueries({ queryKey: ['workspace', workspaceIdentifier, 'categories'] });
        };

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

      const openInfoWindow = () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }

        const infoWindow = new naver.maps.InfoWindow({
          content: createInfoWindowElement(),
          disableAnchor: true,
          borderWidth: 0,
          backgroundColor: 'transparent',
          pixelOffset: new naver.maps.Point(0, -18),
          zIndex: 1000,
        });

        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
      };

      naver.maps.Event.addListener(marker, 'click', openInfoWindow);
      markerMapRef.current.set(place.id, { marker, openInfoWindow });
    });

    markersRef.current = markers;

    const representativeCategoriesWithPlaces = categories
      .filter(({ category }) => category.representativePlaceId)
      .map(({ category }) => {
        const data = placesMap.get(category.representativePlaceId!);
        return data ? { category, place: data.place } : null;
      })
      .filter((item) => item !== null);

    if (representativeCategoriesWithPlaces.length >= 2) {
      const polylines: naver.maps.Polyline[] = [];

      for (let i = 0; i < representativeCategoriesWithPlaces.length - 1; i++) {
        const current = representativeCategoriesWithPlaces[i]!;
        const next = representativeCategoriesWithPlaces[i + 1]!;
        const numSegments = 20;

        for (let j = 0; j < numSegments; j++) {
          const ratio1 = j / numSegments;
          const ratio2 = (j + 1) / numSegments;
          const lat1 = current.place.latitude + (next.place.latitude - current.place.latitude) * ratio1;
          const lng1 = current.place.longitude + (next.place.longitude - current.place.longitude) * ratio1;
          const lat2 = current.place.latitude + (next.place.latitude - current.place.latitude) * ratio2;
          const lng2 = current.place.longitude + (next.place.longitude - current.place.longitude) * ratio2;
          const segmentColor = interpolateColor(current.category.color, next.category.color, ratio1);

          const polyline = new naver.maps.Polyline({
            path: [
              new naver.maps.LatLng(lat1, lng1),
              new naver.maps.LatLng(lat2, lng2),
            ],
            strokeWeight: 3,
            strokeColor: segmentColor,
            strokeOpacity: 0.7,
            strokeStyle: 'shortdash',
          });

          polyline.setMap(map);
          polylines.push(polyline);
        }
      }

      polylinesRef.current = polylines;
    }

    const currentPlacesCount = placeEntries.length;
    const shouldUpdateBounds = !hasInitializedBounds.current || prevPlacesCountRef.current !== currentPlacesCount;

    // 대표장소 변경 시 위치는 유지하고 최초 로딩이나 장소 수 변경 때만 bounds를 다시 맞춤
    if (markers.length > 0 && shouldUpdateBounds) {
      map.fitBounds(bounds);
      hasInitializedBounds.current = true;
      prevPlacesCountRef.current = currentPlacesCount;
    }
  }, [
    categories,
    currentInfoWindowRef,
    hasInitializedBounds,
    mapInstance,
    mapReady,
    markerMapRef,
    markersRef,
    placeEntries,
    polylinesRef,
    prevPlacesCountRef,
    queryClient,
    ready,
    workspaceIdentifier,
  ]);
};
