import type { KakaoSearchResponse } from '@/entities/types';

export const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export const searchPlaces = async (
  query: string,
  restApiKey: string
): Promise<KakaoSearchResponse> => {
  const response = await fetch(`${KAKAO_API_URL}?query=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('장소 검색에 실패했습니다.');
  }

  return await response.json();
};

declare global {
  interface Window {
    kakao: any;
  }
}

export const loadKakaoMapScript = (jsKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };

    script.onerror = () => {
      reject(new Error('Kakao Maps SDK 로딩에 실패했습니다.'));
    };

    document.head.appendChild(script);
  });
};
