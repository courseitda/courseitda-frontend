import { useEffect, useState } from 'react';
import { loadNaverMapScript } from '@/shared/lib/naver';

// Naver Maps SDK 로딩 상태를 관리하는 훅 - SDK 로딩 완료 여부와 에러 상태 제공
// 참고 문서: https://api.ncloud-docs.com/docs/en/naveropenapi-map-javascript
export const useNaverLoader = (keyId: string | null) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 컴포넌트 언마운트 시 비동기 작업 취소를 위한 플래그 - 메모리 누수 방지
    let cancelled = false;

    // API 키 검증 - 키가 없으면 에러 상태로 설정하고 SDK 로딩 시도 중단
    if (!keyId) {
      setReady(false);
      setError(new Error('Naver Maps 환경 변수를 찾을 수 없습니다. 관리자에게 문의해주세요.'));
      return () => {
        cancelled = true;
      };
    }

    // 새로운 로딩 시작 전 상태 초기화 - 이전 에러 상태 제거
    setReady(false);
    setError(null);

    // Naver Maps SDK 스크립트 동적 로딩 시작
    loadNaverMapScript(keyId)
      .then(() => {
        // 컴포넌트가 언마운트되지 않은 경우에만 상태 업데이트하여 메모리 누수 방지
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((err) => {
        // SDK 로딩 실패 시 에러 상태 설정 - 컴포넌트가 마운트된 상태에서만 처리
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Naver Maps SDK 로딩에 실패했습니다.'));
          setReady(false);
        }
      });

    // 클린업 함수 - 컴포넌트 언마운트 시 비동기 작업 취소 플래그 설정
    return () => {
      cancelled = true;
    };
  }, [keyId]);

  return { ready, error };
};
