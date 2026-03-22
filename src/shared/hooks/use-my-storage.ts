import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { myStorageApi } from '@/services/api';
import type { SavedCategory, SearchedPlace, SharedSavedCategory } from '@/entities/types';
import { MESSAGES } from '@/shared/constants/messages';
import { toast } from 'sonner';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { fetchAllCursorPages } from '@/shared/utils/cursor-pagination';
import { MY_STORAGE_QUERY_KEYS } from '@/shared/hooks/my-storage/query-keys';
import { toSavedCategoryEntity } from '@/shared/hooks/my-storage/mappers';
import { syncSharedCategoryForkCount } from '@/shared/hooks/my-storage/cache-sync';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';

export { MY_STORAGE_QUERY_KEYS } from '@/shared/hooks/my-storage/query-keys';

const MY_STORAGE_CONTAINS_QUERY_KEY = ['my-storage', 'saved-categories', 'contains'] as const;
const MY_STORAGE_ALL_SAVED_CATEGORIES_QUERY_KEY = ['my-storage', 'saved-categories'] as const;

// 반복되는 인증 토큰 검증을 공통화하여 각 query/mutation이 도메인 로직에만 집중하도록 정리한다.
const requireAuthToken = (token: string | null): string => {
  if (!token) {
    throw new Error(UI_COPY.system.authTokenRequired);
  }

  return token;
};

// 상세 조회 기반 훅이 같은 API 호출/에러 처리 규칙을 공유하도록 공통 helper로 묶는다.
const fetchSavedCategoryDetailOrThrow = async (
  token: string | null,
  savedCategoryId: string | null | undefined,
): Promise<SavedCategory> => {
  const authToken = requireAuthToken(token);

  if (!savedCategoryId) {
    throw new Error(UI_COPY.myCategory.empty.title);
  }

  const response = await myStorageApi.getSavedCategoryDetail(authToken, savedCategoryId);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
  }

  return toSavedCategoryEntity(response.data.category);
};

const getMutationErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error.message : fallbackMessage;

const invalidateMySavedCategories = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });

const invalidateForkedSharedCategoryIds = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: MY_STORAGE_CONTAINS_QUERY_KEY });

/**
 * 내 보관 카테고리 목록 조회 커스텀 훅
 * UserRequest: MyCategory 페이지도 React Query + service 계층 호출로 통일
 */
export const useMySavedCategories = (
  token: string | null,
  pageSize = 20,
): UseQueryResult<SavedCategory[], Error> =>
  useQuery<SavedCategory[], Error>({
    queryKey: [...MY_STORAGE_QUERY_KEYS.mySavedCategories, pageSize],
    enabled: !!token,
    queryFn: async () => {
      const authToken = requireAuthToken(token);

      return fetchAllCursorPages(async (cursor) => {
        const response = await myStorageApi.getMySavedCategories(authToken, { cursor, size: pageSize });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
        }

        return {
          items: response.data.categories.map((category) => toSavedCategoryEntity(category)),
          hasNext: response.data.hasNext,
          nextCursor: response.data.nextCursor,
        };
      });
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

// UserRequest: 내 카테고리 상세 페이지는 목록 응답이 아닌 상세 API를 기준으로 데이터를 로드한다.
export const useSavedCategoryDetail = (
  token: string | null,
  savedCategoryId: string | undefined,
): UseQueryResult<SavedCategory | null, Error> =>
  useQuery<SavedCategory | null, Error>({
    queryKey: MY_STORAGE_QUERY_KEYS.savedCategoryDetail(savedCategoryId ?? ''),
    enabled: !!token && !!savedCategoryId,
    queryFn: async () => fetchSavedCategoryDetailOrThrow(token, savedCategoryId),
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

type CreateSavedCategoryInput = {
  title: string;
  places: SearchedPlace[];
};

// UserRequest: 내 보관 카테고리 생성은 React Query 뮤테이션으로 관리
export const useCreateSavedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSavedCategoryInput) => {
      const authToken = requireAuthToken(token);

      const response = await myStorageApi.createSavedCategory(authToken, {
        name: input.title,
        savedCategoryPlaces: input.places.map((place) => ({
          name: place.name,
          placeUrl: place.placeUrl,
          roadAddressName: place.roadAddressName,
          addressName: place.addressName,
          latitude: place.latitude,
          longitude: place.longitude,
        })),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.addFailed);
      }

      return response.data.category;
    },
    onSuccess: () => {
      invalidateMySavedCategories(queryClient);
      toast.success(MESSAGES.savedCategory.addSuccess);
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, MESSAGES.savedCategory.addFailed));
    },
  });
};

// UserRequest: 업로드 다이얼로그에서 장소 목록은 상세 API로 재조회한다.
export const useSavedCategoryPlaces = (
  token: string | null,
  savedCategoryId: string | null,
): UseQueryResult<SavedCategory['places'], Error> =>
  useQuery<SavedCategory['places'], Error>({
    // 상세 객체 캐시와 장소 배열 캐시를 분리하여 데이터 형태 충돌을 방지한다.
    queryKey: MY_STORAGE_QUERY_KEYS.savedCategoryPlaces(savedCategoryId ?? ''),
    enabled: !!token && !!savedCategoryId,
    queryFn: async () => (await fetchSavedCategoryDetailOrThrow(token, savedCategoryId)).places,
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

// UserRequest: 공유 카테고리 포크 여부는 contains API로 조회한다.
export const useForkedSharedCategoryIds = (
  token: string | null,
  sharedCategoryIds: string[],
): UseQueryResult<string[], Error> =>
  useQuery<string[], Error>({
    queryKey: MY_STORAGE_QUERY_KEYS.forkedSharedCategoryIds(sharedCategoryIds),
    enabled: !!token && sharedCategoryIds.length > 0,
    queryFn: async () => {
      const authToken = requireAuthToken(token);

      const response = await myStorageApi.containsForkedSharedCategories(authToken, sharedCategoryIds);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.forkFailed);
      }

      return response.data.forkedSharedCategoryIds;
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });

// UserRequest: 공유 카테고리를 내 보관 카테고리로 fork 하는 흐름을 React Query 뮤테이션으로 관리
export const useForkSharedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: SharedSavedCategory) => {
      const authToken = requireAuthToken(token);

      const response = await myStorageApi.forkSavedCategory(authToken, category.id);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.forkFailed);
      }

      return response.data.category;
    },
    onSuccess: () => {
      invalidateMySavedCategories(queryClient);
      invalidateForkedSharedCategoryIds(queryClient);
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.search('') });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      toast.success(MESSAGES.sharedCategory.forkSuccess);
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, MESSAGES.sharedCategory.forkFailed));
    },
  });
};

// UserRequest: 공유 카테고리 fork 버튼은 생성/해제를 토글로 처리
export const useToggleSharedCategoryFork = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { category: SharedSavedCategory; forkedSavedCategoryId: string | null }) => {
      const authToken = requireAuthToken(token);

      if (input.forkedSavedCategoryId) {
        const response = await myStorageApi.deleteSavedCategory(authToken, input.forkedSavedCategoryId);
        if (!response.success) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.unforkFailed);
        }

        return { action: 'unforked' as const, sharedCategoryId: input.category.id };
      }

      const response = await myStorageApi.forkSavedCategory(authToken, input.category.id);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.forkFailed);
      }

      return {
        action: 'forked' as const,
        sharedCategoryId: input.category.id,
        savedCategoryId: response.data.category.id,
      };
    },
    onSuccess: (result) => {
      invalidateMySavedCategories(queryClient);
      invalidateForkedSharedCategoryIds(queryClient);
      syncSharedCategoryForkCount(
        queryClient,
        result.sharedCategoryId,
        result.action === 'forked' ? 1 : -1,
      );
      toast.success(
        result.action === 'forked'
          ? MESSAGES.sharedCategory.forkSuccess
          : MESSAGES.sharedCategory.unforkSuccess,
      );
    },
    onError: (error, variables) => {
      const fallbackMessage = variables.forkedSavedCategoryId
        ? MESSAGES.sharedCategory.unforkFailed
        : MESSAGES.sharedCategory.forkFailed;
      toast.error(getMutationErrorMessage(error, fallbackMessage));
    },
  });
};

// UserRequest: 내 보관 카테고리 수정은 React Query 뮤테이션으로 관리
export const useUpdateSavedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; title: string; places: SearchedPlace[]; originalPlaceIds: string[] }) => {
      const authToken = requireAuthToken(token);

      const response = await myStorageApi.updateSavedCategory(authToken, input.id, {
        name: input.title,
        savedCategoryPlaces: input.places.map((place) => ({
          savedCategoryPlaceId: input.originalPlaceIds.includes(place.id) ? place.id : null,
          name: place.name,
          placeUrl: place.placeUrl,
          roadAddressName: place.roadAddressName,
          addressName: place.addressName,
          latitude: place.latitude,
          longitude: place.longitude,
        })),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.updateFailed);
      }

      return response.data.category;
    },
    onSuccess: () => {
      invalidateMySavedCategories(queryClient);
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_ALL_SAVED_CATEGORIES_QUERY_KEY });
      toast.success(MESSAGES.savedCategory.updateSuccess);
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, MESSAGES.savedCategory.updateFailed));
    },
  });
};

// UserRequest: 내 보관 카테고리 삭제는 React Query 뮤테이션으로 관리
export const useDeleteSavedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (savedCategoryId: string) => {
      const authToken = requireAuthToken(token);

      const response = await myStorageApi.deleteSavedCategory(authToken, savedCategoryId);

      if (!response.success) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.deleteFailed);
      }
    },
    onSuccess: () => {
      invalidateMySavedCategories(queryClient);
      toast.success(MESSAGES.savedCategory.deleteSuccess);
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, MESSAGES.savedCategory.deleteFailed));
    },
  });
};
