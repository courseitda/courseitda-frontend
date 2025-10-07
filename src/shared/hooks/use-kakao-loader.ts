import { useEffect, useState } from 'react';
import { loadKakaoMapScript } from '@/shared/lib/kakao';

export const useKakaoLoader = (jsKey: string | null) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!jsKey) {
      setReady(false);
      setError(new Error('Kakao Maps API 키가 설정되지 않았습니다.'));
      return;
    }

    loadKakaoMapScript(jsKey)
      .then(() => {
        setReady(true);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setReady(false);
      });
  }, [jsKey]);

  return { ready, error };
};
