// Naver Maps SDK 로딩 완료 시 호출될 전역 콜백 함수명
import { MESSAGES } from '@/shared/constants/messages';

// Naver Maps SDK 로딩 완료 시 호출될 전역 콜백 함수명
const CALLBACK_NAME = '__NAVER_MAPS_ONLOAD__';

// SDK 전역 객체 준비를 위한 폴링 설정 - 콜백 이후에도 객체 준비까지 대기
const READY_CHECK_INTERVAL = 100;
const MAX_READY_CHECK_ATTEMPTS = 50;

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
    return Promise.reject(new Error(MESSAGES.map.browserOnly));
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
    let readyCheckTimer: number | null = null;

    // 스크립트 로딩 실패 처리 - 콜백 정리 및 캐시 초기화하여 재시도 가능하도록 설정
    const handleError = () => {
      // UserRequest: 첫 진입에서도 Naver Maps SDK가 안정적으로 로딩되도록 실패 시 리소스를 정리
      if (readyCheckTimer !== null) {
        window.clearTimeout(readyCheckTimer);
        readyCheckTimer = null;
      }
      delete globalWindow[CALLBACK_NAME];
      loadPromise = null;
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps-script="true"]');
      if (existingScript) {
        existingScript.remove();
      }
      reject(new Error(MESSAGES.map.sdkLoadFailed));
    };

    // SDK 전역 객체가 실제로 준비되었는지 확인 - 콜백 호출 직후 객체가 비어있는 경우가 있어 폴링 처리
    const waitForMapsReady = (attempt: number = 0) => {
      // UserRequest: 콜백 직후 window.naver.maps가 준비될 때까지 확인하여 첫 진입 실패를 방지
      if (window.naver && window.naver.maps) {
        readyCheckTimer = null;
        resolve();
        return;
      }

      if (attempt >= MAX_READY_CHECK_ATTEMPTS) {
        handleError();
        return;
      }

      readyCheckTimer = window.setTimeout(() => waitForMapsReady(attempt + 1), READY_CHECK_INTERVAL);
    };

    // SDK 로딩 완료 시 호출될 전역 콜백 함수 등록 - SDK가 로드되면 자동으로 호출됨
    globalWindow[CALLBACK_NAME] = () => {
      delete globalWindow[CALLBACK_NAME];
      waitForMapsReady();
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
