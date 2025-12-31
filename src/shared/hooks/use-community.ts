import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { communityApi } from '@/services/api';
import type { MySharedCategory, SharedSavedCategory } from '@/entities/types';

type SharedSavedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isLiked: boolean;
  placeCount: number;
  places: Array<{
    id: string;
    name: string;
    addressName: string;
  }>;
};

// UserRequest: Community 관련 API 응답을 화면에서 사용하는 SharedSavedCategory 타입으로 보정
const toSharedSavedCategoryEntity = (payload: SharedSavedCategoryPayload): SharedSavedCategory => ({
  id: payload.id,
  title: payload.title,
  uploader: payload.uploaderNickname,
  uploadedAt: payload.uploadedAt,
  liked: payload.isLiked,
  placeCount: payload.placeCount,
  places: payload.places.map((place) => ({
    id: place.id,
    name: place.name,
    addressName: place.addressName,
  })),
});

export const COMMUNITY_QUERY_KEYS = {
  recommended: ['community', 'shared-categories', 'recommended'] as const,
  search: (keyword: string) => ['community', 'shared-categories', 'search', keyword] as const,
  myShared: ['community', 'shared-categories', 'me'] as const,
};

/**
 * 추천 공유 카테고리 목록 조회 커스텀 훅
 * UserRequest: Community 페이지도 React Query + service 계층 호출로 통일
 */
export const useRecommendedSharedCategories = (): UseQueryResult<SharedSavedCategory[], Error> =>
  useQuery<SharedSavedCategory[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.recommended,
    queryFn: async () => {
      const response = await communityApi.getRecommendedSharedCategories();

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '추천 카테고리를 불러올 수 없습니다.');
      }

      return response.data.sharedCategories.map((category) =>
        toSharedSavedCategoryEntity(category),
      );
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

/**
 * 공유 카테고리 검색 커스텀 훅
 * UserRequest: /community/search/results 페이지도 React Query + service 계층 호출로 통일
 */
export const useSharedCategorySearch = (
  keyword: string,
): UseQueryResult<SharedSavedCategory[], Error> =>
  useQuery<SharedSavedCategory[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.search(keyword),
    queryFn: async () => {
      const response = await communityApi.searchSharedCategories(keyword);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '검색 결과를 불러올 수 없습니다.');
      }

      return response.data.sharedCategories.map((category) =>
        toSharedSavedCategoryEntity(category),
      );
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

type MySharedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  placeCount: number;
  savedCategoryId: string;
};

// UserRequest: 내가 공유한 카테고리 목록도 service 계층 + React Query로 관리
const toMySharedCategoryEntity = (payload: MySharedCategoryPayload): MySharedCategory => ({
  id: payload.id,
  title: payload.title,
  uploader: payload.uploaderNickname,
  uploadedAt: payload.uploadedAt,
  liked: false,
  placeCount: payload.placeCount,
  places: [],
  savedCategoryId: payload.savedCategoryId,
});

/**
 * 내 공유 카테고리 목록 조회 커스텀 훅
 * UserRequest: 커뮤니티 관리 페이지에서도 service 계층 API를 사용해 상태를 동기화
 */
export const useMySharedCategories = (
  token: string | null,
): UseQueryResult<MySharedCategory[], Error> =>
  useQuery<MySharedCategory[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.myShared,
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error('인증 토큰이 필요합니다.');
      }

      const response = await communityApi.getMySharedCategories(token);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '내 공유 카테고리를 불러올 수 없습니다.');
      }

      return response.data.sharedCategories.map((category) => toMySharedCategoryEntity(category));
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });
