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
