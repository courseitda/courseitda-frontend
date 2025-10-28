import { useEffect, useState } from 'react';
import { loadKakaoMapScript } from '@/shared/lib/kakao';

// Kakao Maps SDK 로딩 상태를 관리하는 훅 - SDK 로딩 완료 여부와 에러 상태를 제공
// 사용 위치: features/map (map-canvas)
export const useKakaoLoader = (jsKey: string | null) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // API 키가 없으면 에러 상태로 설정하여 관리자 문의를 안내
    if (!jsKey) {
      setReady(false);
      setError(new Error('Kakao Maps 환경 변수를 찾을 수 없습니다. 관리자에게 문의해주세요.'));
      return;
    }

    // Kakao Maps SDK 스크립트 로딩 시도
    loadKakaoMapScript(jsKey)
      .then(() => {
        // 로딩 성공 시 ready 상태를 true로 설정하여 지도 렌더링 허용
        setReady(true);
        setError(null);
      })
      .catch((err) => {
        // 로딩 실패 시 에러 상태 설정
        setError(err);
        setReady(false);
      });
  }, [jsKey]);

  return { ready, error };
};
