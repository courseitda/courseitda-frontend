// Naver Maps JavaScript SDK 타입 정의 - TypeScript 지원을 위한 타입 선언
// 공식 문서: https://api.ncloud-docs.com/docs/en/naveropenapi-map-javascript
// UserRequest: naver 네임스페이스 타입이 글로벌에서 인식되도록 재선언

export {};

declare global {
  namespace naver {
    namespace maps {
      // 위도와 경도를 나타내는 좌표 클래스
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      // 지도 영역을 나타내는 경계 박스 클래스 - 여러 마커를 포함하는 영역 계산에 사용
      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng);
        extend(latLng: LatLng): void;
      }

      // 픽셀 좌표를 나타내는 클래스 - 마커 아이콘 위치 조정 등에 사용
      class Point {
        constructor(x: number, y: number);
      }

      // 지도 생성 시 사용할 옵션 인터페이스
      interface MapOptions {
        center?: LatLng;
        zoom?: number;
      }

      // 지도 인스턴스 클래스 - 지도를 생성하고 제어하는 메인 클래스
      class Map {
        constructor(element: HTMLElement, options?: MapOptions);
        fitBounds(bounds: LatLngBounds): void;
        panTo(latLng: LatLng): void;
        setZoom(zoom: number): void;
        getZoom(): number;
        morph(latLng: LatLng, zoom?: number): void;
      }

      // 마커 아이콘 커스터마이징 옵션 - HTML 콘텐츠와 앵커 위치 설정
      interface MarkerIcon {
        content?: string | HTMLElement;
        anchor?: Point;
      }

      // 마커 생성 시 필요한 옵션 인터페이스
      interface MarkerOptions {
        position: LatLng;
        map?: Map | null;
        icon?: MarkerIcon;
        zIndex?: number;
      }

      // 지도에 표시되는 마커 클래스 - 장소 위치 표시에 사용
      class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng): void;
      }

      // 커스텀 오버레이 생성 옵션 - 지도 위에 임의의 HTML 요소 배치 시 사용
      interface CustomOverlayOptions {
        position: LatLng;
        content: string | HTMLElement;
        map?: Map | null;
        xAnchor?: number;
        yAnchor?: number;
        zIndex?: number;
        clickable?: boolean;
      }

      // 지도 위에 커스텀 HTML 요소를 배치하는 클래스
      class CustomOverlay {
        constructor(options: CustomOverlayOptions);
        setMap(map: Map | null): void;
      }

      // 정보창 생성 옵션 - 마커 클릭 시 표시되는 팝업 윈도우 설정
      interface InfoWindowOptions {
        content?: string | HTMLElement;
        disableAnchor?: boolean;
        borderWidth?: number;
        anchorSkew?: boolean;
        backgroundColor?: string;
        pixelOffset?: Point;
        zIndex?: number;
      }

      // 마커에 연결되는 정보창 클래스 - 장소 상세 정보 표시에 사용
      class InfoWindow {
        constructor(options?: InfoWindowOptions);
        open(map: Map, target: Marker | LatLng): void;
        close(): void;
        setContent(content: string | HTMLElement): void;
      }

      // 폴리라인(경로선) 생성 옵션 - 대표 장소 간 경로 표시에 사용
      interface PolylineOptions {
        path: LatLng[];
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeStyle?: string;
        map?: Map | null;
      }

      // 지도에 선을 그리는 클래스 - 장소 간 경로 연결 표시에 사용
      class Polyline {
        constructor(options: PolylineOptions);
        setMap(map: Map | null): void;
      }

      // 지도 이벤트 핸들링을 위한 유틸리티 클래스 - 클릭, 리사이즈 등의 이벤트 처리
      class Event {
        static addListener(
          target: unknown,
          eventName: string,
          listener: (...args: unknown[]) => void,
        ): void;
        static trigger(target: unknown, eventName: string): void;
        static removeListener(listener: unknown): void;
      }
    }
  }

  interface Window {
    naver?: typeof naver;
  }
}
