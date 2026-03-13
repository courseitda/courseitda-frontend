import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { communityApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import type { MySharedCategory, SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

type SharedSavedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  forkCount: number;
  placeCount: number;
  places: Array<{
    id: string;
    // UserRequest: 공유 카테고리 장소 응답에 위치/주소/URL 필드 포함
    name: string;
    placeUrl: string;
    roadAddressName: string;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

// UserRequest: Community 관련 API 응답을 화면에서 사용하는 SharedSavedCategory 타입으로 보정
const toSharedSavedCategoryEntity = (payload: SharedSavedCategoryPayload): SharedSavedCategory => ({
  id: payload.id,
  title: payload.title,
  uploader: payload.uploaderNickname,
  uploadedAt: payload.uploadedAt,
  isImmutableSnapshot: true,
  forkCount: payload.forkCount,
  placeCount: payload.placeCount,
  places: payload.places.map((place) => ({
    id: place.id,
    name: place.name,
    addressName: place.addressName,
    // UserRequest: 공유 카테고리 장소 응답 필드 확장 반영
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

export const COMMUNITY_QUERY_KEYS = {
  recommended: ['community', 'shared-categories', 'recommended'] as const,
  list: (size: number) => ['community', 'shared-categories', 'list', size] as const,
  search: (keyword: string) => ['community', 'shared-categories', 'search', keyword] as const,
  myShared: ['community', 'shared-categories', 'me'] as const,
};

export const useSharedCategories = (
  size = 20,
  fetchAll = true,
): UseQueryResult<SharedSavedCategory[], Error> =>
  useQuery<SharedSavedCategory[], Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.list(size), fetchAll],
    queryFn: async () => {
      const categories: SharedSavedCategory[] = [];
      let cursor: number | null | undefined = null;
      let hasNext = true;

      while (hasNext) {
        const response = await communityApi.getSharedCategories({ cursor, size });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.searchLoadFailed);
        }

        categories.push(
          ...response.data.sharedCategories.map((category) =>
            toSharedSavedCategoryEntity(category),
          ),
        );

        hasNext = response.data.hasNext;
        cursor = response.data.nextCursor;

        if (!fetchAll) {
          break;
        }
      }

      return categories;
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

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
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.recommendedLoadFailed);
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
      const categories: SharedSavedCategory[] = [];
      let cursor: number | null | undefined = null;
      let hasNext = true;

      while (hasNext) {
        const response = await communityApi.searchSharedCategories(keyword, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.searchLoadFailed);
        }

        categories.push(
          ...response.data.sharedCategories.map((category) =>
            toSharedSavedCategoryEntity(category),
          ),
        );

        hasNext = response.data.hasNext;
        cursor = response.data.nextCursor;
      }

      return categories;
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

type MySharedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  forkCount: number;
  placeCount: number;
  publishedFromSavedCategoryId: string;
};

// UserRequest: 내가 공유한 카테고리 목록도 service 계층 + React Query로 관리
const toMySharedCategoryEntity = (payload: MySharedCategoryPayload): MySharedCategory => ({
  id: payload.id,
  title: payload.title,
  uploader: payload.uploaderNickname,
  uploadedAt: payload.uploadedAt,
  isImmutableSnapshot: true,
  forkCount: payload.forkCount,
  placeCount: payload.placeCount,
  places: [],
  publishedFromSavedCategoryId: payload.publishedFromSavedCategoryId,
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
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const categories: MySharedCategory[] = [];
      let cursor: number | null | undefined = null;
      let hasNext = true;

      while (hasNext) {
        const response = await communityApi.getMySharedCategories(token, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.myPostsLoadFailed);
        }

        categories.push(
          ...response.data.sharedCategories.map((category) => toMySharedCategoryEntity(category)),
        );

        hasNext = response.data.hasNext;
        cursor = response.data.nextCursor;
      }

      return categories;
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });
