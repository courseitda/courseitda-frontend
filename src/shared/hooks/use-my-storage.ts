import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { myStorageApi } from '@/services/api';
import type { SavedCategory } from '@/entities/types';

type SavedCategoryPayload = {
  id: string;
  title: string;
  color: string;
  modifiedAt: string;
  placeCount: number;
  places: Array<{
    id: string;
    name: string;
    addressName: string;
  }>;
};

// UserRequest: 내 보관함 API 응답을 화면에서 사용하는 SavedCategory 타입으로 보정
const toSavedCategoryEntity = (payload: SavedCategoryPayload): SavedCategory => ({
  id: payload.id,
  title: payload.title,
  color: payload.color,
  updatedAt: payload.modifiedAt,
  placeCount: payload.placeCount,
  places: payload.places.map((place) => ({
    id: place.id,
    name: place.name,
    addressName: place.addressName,
  })),
});

export const MY_STORAGE_QUERY_KEYS = {
  mySavedCategories: ['my-storage', 'saved-categories', 'me'] as const,
};

/**
 * 내 보관 카테고리 목록 조회 커스텀 훅
 * UserRequest: MyCategory 페이지도 React Query + service 계층 호출로 통일
 */
export const useMySavedCategories = (token: string | null): UseQueryResult<SavedCategory[], Error> =>
  useQuery<SavedCategory[], Error>({
    queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories,
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }

      const response = await myStorageApi.getMySavedCategories(token);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '내 카테고리를 불러올 수 없습니다.');
      }

      return response.data.categories.map((category) => toSavedCategoryEntity(category));
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

