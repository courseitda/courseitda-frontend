import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { myStorageApi } from '@/services/api';
import type { MySharedCategory, SavedCategory, SearchedPlace, SharedSavedCategory } from '@/entities/types';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';
import { MESSAGES } from '@/shared/constants/messages';
import { toast } from 'sonner';
import { UI_COPY } from '@/shared/constants/ui-copy';

type SavedCategoryPayload = {
  id: string;
  title: string;
  sourceType: 'manual' | 'forked';
  forkedFromSharedCategoryId: string | null;
  sourceAuthorName: string | null;
  sourceCategoryTitle: string | null;
  canPublish: boolean;
  publishBlockedReason: string | null;
  modifiedAt: string;
  placeCount: number;
  places: Array<{
    id: string;
    // UserRequest: 보관 카테고리 장소 응답에 위치/주소/URL 필드 포함
    name: string;
    placeUrl: string;
    roadAddressName: string;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

// UserRequest: 내 보관함 API 응답을 화면에서 사용하는 SavedCategory 타입으로 보정
const toSavedCategoryEntity = (payload: SavedCategoryPayload): SavedCategory => ({
  id: payload.id,
  title: payload.title,
  sourceType: payload.sourceType,
  forkedFromSharedCategoryId: payload.forkedFromSharedCategoryId,
  sourceAuthorName: payload.sourceAuthorName,
  sourceCategoryTitle: payload.sourceCategoryTitle,
  canPublish: payload.canPublish,
  publishBlockedReason: payload.publishBlockedReason,
  updatedAt: payload.modifiedAt,
  placeCount: payload.placeCount,
  places: payload.places.map((place) => ({
    id: place.id,
    name: place.name,
    addressName: place.addressName,
    // UserRequest: 보관 카테고리 장소 응답 필드 확장 반영
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

export const MY_STORAGE_QUERY_KEYS = {
  mySavedCategories: ['my-storage', 'saved-categories', 'me'] as const,
  savedCategoryDetail: (savedCategoryId: string) => ['my-storage', 'saved-categories', savedCategoryId] as const,
  savedCategoryPlaces: (savedCategoryId: string) =>
    ['my-storage', 'saved-categories', savedCategoryId, 'places'] as const,
  forkedSharedCategoryIds: (sharedCategoryIds: string[]) =>
    ['my-storage', 'saved-categories', 'contains', ...sharedCategoryIds] as const,
};

const updateForkCount = <T extends { id: string; forkCount: number }>(
  categories: T[] | undefined,
  sharedCategoryId: string,
  delta: number,
): T[] | undefined =>
  categories?.map((category) =>
    category.id === sharedCategoryId
      ? { ...category, forkCount: Math.max(0, category.forkCount + delta) }
      : category,
  );

const syncSharedCategoryForkCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  sharedCategoryId: string,
  delta: number,
) => {
  queryClient.setQueryData<SharedSavedCategory[]>(
    COMMUNITY_QUERY_KEYS.recommended,
    (previous) => updateForkCount(previous, sharedCategoryId, delta),
  );

  queryClient.setQueryData<MySharedCategory[]>(
    COMMUNITY_QUERY_KEYS.myShared,
    (previous) => updateForkCount(previous, sharedCategoryId, delta),
  );

  const searchQueries = queryClient.getQueriesData<SharedSavedCategory[]>({
    queryKey: ['community', 'shared-categories', 'search'],
  });

  searchQueries.forEach(([queryKey]) => {
    queryClient.setQueryData<SharedSavedCategory[]>(
      queryKey,
      (previous) => updateForkCount(previous, sharedCategoryId, delta),
    );
  });
};

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
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const categories: SavedCategory[] = [];
      let cursor: number | null | undefined = null;
      let hasNext = true;
      const visitedCursors = new Set<number | null>();

      // UserRequest: 내 카테고리가 0개일 때도 무한 로딩 없이 빈 상태 화면으로 진입되도록 페이지네이션 종료 조건을 방어한다.
      while (hasNext) {
        // 잘못된 nextCursor 반복 응답으로 인한 무한 루프를 사전에 차단
        if (visitedCursors.has(cursor)) {
          break;
        }
        visitedCursors.add(cursor);

        const response = await myStorageApi.getMySavedCategories(token, { cursor, size: pageSize });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
        }

        const pageCategories = response.data.categories.map((category) => toSavedCategoryEntity(category));
        categories.push(...pageCategories);

        // 빈 페이지거나 다음 커서가 없으면 즉시 종료하여 빈 목록을 정상 상태로 처리
        if (pageCategories.length === 0 || response.data.nextCursor === null) {
          hasNext = false;
          cursor = null;
          continue;
        }

        // 현재 커서와 동일한 nextCursor가 오면 백엔드 응답 이상으로 간주하고 종료
        if (response.data.nextCursor === cursor) {
          hasNext = false;
          cursor = null;
          continue;
        }

        hasNext = response.data.hasNext;
        cursor = response.data.nextCursor;
      }

      return categories;
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
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      if (!savedCategoryId) {
        throw new Error(UI_COPY.myCategory.empty.title);
      }

      const response = await myStorageApi.getSavedCategoryDetail(token, savedCategoryId);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
      }

      return toSavedCategoryEntity(response.data.category);
    },
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
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.createSavedCategory(token, {
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
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      toast.success(MESSAGES.savedCategory.addSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.addFailed;
      toast.error(message);
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
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      if (!savedCategoryId) {
        throw new Error(UI_COPY.myCategory.empty.title);
      }

      const response = await myStorageApi.getSavedCategoryDetail(token, savedCategoryId);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
      }

      return toSavedCategoryEntity(response.data.category).places;
    },
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
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.containsForkedSharedCategories(token, sharedCategoryIds);
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
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.forkSavedCategory(token, category.id);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.forkFailed);
      }

      return response.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      queryClient.invalidateQueries({ queryKey: ['my-storage', 'saved-categories', 'contains'] });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.recommended });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.search('') });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myShared });
      toast.success(MESSAGES.sharedCategory.forkSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.sharedCategory.forkFailed;
      toast.error(message);
    },
  });
};

// UserRequest: 공유 카테고리 fork 버튼은 생성/해제를 토글로 처리
export const useToggleSharedCategoryFork = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { category: SharedSavedCategory; forkedSavedCategoryId: string | null }) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      if (input.forkedSavedCategoryId) {
        const response = await myStorageApi.deleteSavedCategory(token, input.forkedSavedCategoryId);
        if (!response.success) {
          throw new Error(response.error?.message ?? MESSAGES.sharedCategory.unforkFailed);
        }

        return { action: 'unforked' as const, sharedCategoryId: input.category.id };
      }

      const response = await myStorageApi.forkSavedCategory(token, input.category.id);

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
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      queryClient.invalidateQueries({ queryKey: ['my-storage', 'saved-categories', 'contains'] });
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
      const message = error instanceof Error ? error.message : fallbackMessage;
      toast.error(message);
    },
  });
};

// UserRequest: 내 보관 카테고리 수정은 React Query 뮤테이션으로 관리
export const useUpdateSavedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; title: string; places: SearchedPlace[]; originalPlaceIds: string[] }) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.updateSavedCategory(token, input.id, {
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
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      queryClient.invalidateQueries({ queryKey: ['my-storage', 'saved-categories'] });
      toast.success(MESSAGES.savedCategory.updateSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.updateFailed;
      toast.error(message);
    },
  });
};

// UserRequest: 내 보관 카테고리 삭제는 React Query 뮤테이션으로 관리
export const useDeleteSavedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (savedCategoryId: string) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.deleteSavedCategory(token, savedCategoryId);

      if (!response.success) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.deleteFailed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      toast.success(MESSAGES.savedCategory.deleteSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.deleteFailed;
      toast.error(message);
    },
  });
};
