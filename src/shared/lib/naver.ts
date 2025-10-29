// Naver Maps SDK 로딩 완료 시 호출될 전역 콜백 함수명
const CALLBACK_NAME = '__NAVER_MAPS_ONLOAD__';

// SDK 중복 로딩 방지를 위한 로딩 Promise 캐싱 - 동시에 여러 컴포넌트에서 로딩 요청 시 하나의 요청만 처리
let loadPromise: Promise<void> | null = null;

// Window 객체에 동적 콜백 함수를 추가하기 위한 타입 확장
type WindowWithCallback = Window & {
  [key in typeof CALLBACK_NAME]?: () => void;
};

/**
 * Naver Maps JavaScript SDK 동적 로딩 - DOM에 스크립트를 추가하여 SDK 초기화
 * 공식 문서: https://api.ncloud-docs.com/docs/en/naveropenapi-map-javascript
 */
export const loadNaverMapScript = (keyId: string): Promise<void> => {
  // 서버 사이드 렌더링 환경 검증 - window 객체가 없는 경우 에러 반환
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Naver Maps SDK는 브라우저 환경에서만 로드할 수 있습니다.'));
  }

  // SDK가 이미 로드된 경우 즉시 완료 처리 - 중복 로딩 방지
  if (window.naver && window.naver.maps) {
    return Promise.resolve();
  }

  // 이미 로딩 중인 경우 기존 Promise 재사용 - 동시 다중 요청 시 하나의 로딩만 실행
  if (loadPromise) {
    return loadPromise;
  }

  // 새로운 SDK 로딩 Promise 생성 및 캐싱
  loadPromise = new Promise((resolve, reject) => {
    const globalWindow = window as WindowWithCallback;

    // 스크립트 로딩 실패 처리 - 콜백 정리 및 캐시 초기화하여 재시도 가능하도록 설정
    const handleError = () => {
      delete globalWindow[CALLBACK_NAME];
      loadPromise = null;
      reject(new Error('Naver Maps SDK 로딩에 실패했습니다.'));
    };

    // SDK 로딩 완료 시 호출될 전역 콜백 함수 등록 - SDK가 로드되면 자동으로 호출됨
    globalWindow[CALLBACK_NAME] = () => {
      // SDK 객체 존재 확인 후 Promise 완료 처리
      if (window.naver && window.naver.maps) {
        delete globalWindow[CALLBACK_NAME];
        resolve();
      } else {
        // SDK 객체가 없는 경우 로딩 실패로 처리
        handleError();
      }
    };

    // 기존 스크립트 태그 제거 - API 키 변경 등의 경우 재로딩을 위해 이전 스크립트 삭제
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps-script="true"]');

    if (existingScript) {
      existingScript.remove();
    }

    // Naver Maps SDK 스크립트 태그 생성 및 설정
    const script = document.createElement('script');
    const url = new URL('https://openapi.map.naver.com/openapi/v3/maps.js');
    url.searchParams.set('ncpKeyId', keyId);
    url.searchParams.set('callback', CALLBACK_NAME);
    script.src = url.toString();
    script.async = true;
    script.defer = true;
    script.dataset.naverMapsScript = 'true';
    script.onerror = handleError;

    // DOM에 스크립트 추가하여 SDK 로딩 시작
    document.head.appendChild(script);
  });

  return loadPromise;
};
