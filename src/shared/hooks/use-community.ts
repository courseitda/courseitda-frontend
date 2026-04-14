import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { communityApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import type { MySharedCategory, SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { fetchAllCursorPages } from '@/shared/utils/cursor-pagination';
import { useAuthStore } from '@/shared/stores/auth-store';

type SharedSavedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  imageUrl?: string;
  isDeleted?: boolean;
  likeCount: number;
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
  imageUrl: payload.imageUrl,
  isDeleted: payload.isDeleted ?? false,
  likeCount: payload.likeCount ?? 0,
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
  liked: ['community', 'shared-categories', 'liked'] as const,
  detail: (sharedCategoryId: string | null) =>
    ['community', 'shared-categories', 'detail', sharedCategoryId] as const,
};

const mergeLikedState = async (
  categories: SharedSavedCategory[],
  token: string | null,
): Promise<SharedSavedCategory[]> => {
  if (categories.length === 0) {
    return [];
  }

  if (!token) {
    return categories.map((category) => ({ ...category, liked: false }));
  }

  const response = await communityApi.getLikedSharedCategoryIds(
    token,
    categories.map((category) => category.id),
  );

  if (!response.success || !response.data) {
    return categories.map((category) => ({ ...category, liked: false }));
  }

  const likedIds = new Set(response.data.likedSharedCategoryIds);
  return categories.map((category) => ({
    ...category,
    liked: likedIds.has(category.id),
  }));
};

type SharedCategoryPageFetcher = (cursor: number | null) => Promise<{
  items: SharedSavedCategory[];
  hasNext: boolean;
  nextCursor: number | null;
}>;

// 커뮤니티 목록/검색의 반복 커서 조회를 공통화하여 종료 조건과 에러 처리를 한곳에서 유지한다.
const fetchSharedCategoryPages = async (
  fetchPage: SharedCategoryPageFetcher,
  fetchAll: boolean,
): Promise<SharedSavedCategory[]> => {
  if (!fetchAll) {
    const firstPage = await fetchPage(null);
    return firstPage.items;
  }

  return fetchAllCursorPages(fetchPage);
};

export const useSharedCategories = (
  size = 20,
  fetchAll = true,
): UseQueryResult<SharedSavedCategory[], Error> => {
  const { token } = useAuthStore();

  return useQuery<SharedSavedCategory[], Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.list(size), fetchAll, token],
    queryFn: async () => {
      const categories = await fetchSharedCategoryPages(async (cursor) => {
        const response = await communityApi.getSharedCategories({ cursor, size });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.searchLoadFailed);
        }

        return {
          items: response.data.sharedCategories.map((category) =>
            toSharedSavedCategoryEntity(category),
          ),
          hasNext: response.data.hasNext,
          nextCursor: response.data.nextCursor,
        };
      }, fetchAll);

      return mergeLikedState(categories, token);
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * 추천 공유 카테고리 목록 조회 커스텀 훅
 * UserRequest: Community 페이지도 React Query + service 계층 호출로 통일
 */
export const useRecommendedSharedCategories = (): UseQueryResult<SharedSavedCategory[], Error> =>
{
  const { token } = useAuthStore();

  return useQuery<SharedSavedCategory[], Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.recommended, token],
    queryFn: async () => {
      const response = await communityApi.getRecommendedSharedCategories();

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.recommendedLoadFailed);
      }

      const categories = response.data.sharedCategories.map((category) =>
        toSharedSavedCategoryEntity(category),
      );

      return mergeLikedState(categories, token);
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * 공유 카테고리 검색 커스텀 훅
 * UserRequest: /community/search/results 페이지도 React Query + service 계층 호출로 통일
 */
export const useSharedCategorySearch = (
  keyword: string,
): UseQueryResult<SharedSavedCategory[], Error> => {
  const { token } = useAuthStore();

  return useQuery<SharedSavedCategory[], Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.search(keyword), token],
    queryFn: async () => {
      const categories = await fetchSharedCategoryPages(async (cursor) => {
        const response = await communityApi.searchSharedCategories(keyword, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.searchLoadFailed);
        }

        return {
          items: response.data.sharedCategories.map((category) =>
            toSharedSavedCategoryEntity(category),
          ),
          hasNext: response.data.hasNext,
          nextCursor: response.data.nextCursor,
        };
      }, true);

      return mergeLikedState(categories, token);
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });
};

type MySharedCategoryPayload = {
  id: string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  likeCount: number;
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
  likeCount: payload.likeCount,
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
    queryKey: [...COMMUNITY_QUERY_KEYS.myShared, token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const categories = await fetchAllCursorPages(async (cursor) => {
        const response = await communityApi.getMySharedCategories(token, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.myPostsLoadFailed);
        }

        return {
          items: response.data.sharedCategories.map((category) => toMySharedCategoryEntity(category)),
          hasNext: response.data.hasNext,
          nextCursor: response.data.nextCursor,
        };
      });

      return mergeLikedState(categories, token) as MySharedCategory[];
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

/**
 * 내가 찜한 공유 카테고리 목록 조회 커스텀 훅
 * UserRequest: 내 컬렉션의 찜 탭은 /api/me/liked-shared-categories 응답을 직접 사용한다.
 */
export const useMyLikedSharedCategories = (
  token: string | null,
): UseQueryResult<SharedSavedCategory[], Error> =>
  useQuery<SharedSavedCategory[], Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.liked, token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      return fetchAllCursorPages(async (cursor) => {
        const response = await communityApi.getLikedSharedCategories(token, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.searchLoadFailed);
        }

        const likedItems = response.data.sharedCategories.map((category) => ({
          ...toSharedSavedCategoryEntity(category),
          liked: true,
        }));

        return {
          items: likedItems,
          hasNext: response.data.hasNext,
          nextCursor: response.data.nextCursor,
        };
      });
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

/**
 * 공유 카테고리 상세 조회 커스텀 훅
 * UserRequest: 공유 카테고리 상세 모달은 열릴 때 상세 API를 호출해 장소 목록/마커를 항상 최신 상태로 표시
 */
export const useSharedCategoryDetail = (
  sharedCategoryId: string | null,
  enabled = true,
): UseQueryResult<SharedSavedCategory | null, Error> => {
  const { token } = useAuthStore();

  return useQuery<SharedSavedCategory | null, Error>({
    queryKey: [...COMMUNITY_QUERY_KEYS.detail(sharedCategoryId), token],
    enabled: enabled && !!sharedCategoryId,
    queryFn: async () => {
      if (!sharedCategoryId) {
        return null;
      }

      const response = await communityApi.getSharedCategoryDetail(sharedCategoryId);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.fetchDetailFailed);
      }

      const detail = response.data.sharedCategories[0];
      if (!detail) {
        throw new Error(MESSAGES.sharedCategory.fetchDetailFailed);
      }

      const category = toSharedSavedCategoryEntity(detail);
      const [merged] = await mergeLikedState([category], token);
      return merged ?? category;
    },
    staleTime: 1000 * 15,
  });
};
