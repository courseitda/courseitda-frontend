import type { KakaoSearchResponse } from '@/entities/types';

// Kakao API 통신 관련 함수들
// 사용 위치: features/places (place-search-dialog), features/map (map-canvas), shared/hooks (use-kakao-loader)

// Kakao Local API 엔드포인트 - 키워드로 장소 검색
export const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

// Kakao Local API를 통해 장소 검색 수행 - REST API 키를 사용한 키워드 검색
export const searchPlaces = async (
  query: string,
  restApiKey: string
): Promise<KakaoSearchResponse> => {
  // REST API 키를 헤더에 포함하여 검색 요청
  const response = await fetch(`${KAKAO_API_URL}?query=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
  });

  // 요청 실패 시 에러 발생시켜 호출 측에서 처리
  if (!response.ok) {
    throw new Error('장소 검색에 실패했습니다.');
  }

  return await response.json();
};

// Window 객체에 kakao SDK 타입 추가 - TypeScript 타입 에러 방지
declare global {
  interface Window {
    kakao: any;
  }
}

// Kakao Maps SDK 동적 로딩 - 스크립트를 DOM에 추가하여 SDK 초기화
export const loadKakaoMapScript = (jsKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 SDK가 로드되어 있으면 바로 완료 처리하여 중복 로딩 방지
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // script 태그를 동적으로 생성하여 SDK 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false`;
    script.async = true;

    // 스크립트 로드 완료 시 kakao.maps.load를 호출하여 지도 API 초기화
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };

    // 스크립트 로드 실패 시 에러 반환
    script.onerror = () => {
      reject(new Error('Kakao Maps SDK 로딩에 실패했습니다.'));
    };

    // head에 script 추가하여 로딩 시작
    document.head.appendChild(script);
  });
};
