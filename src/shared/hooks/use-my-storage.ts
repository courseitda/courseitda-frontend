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
export const useMySavedCategories = (token: string | null): UseQueryResult<SavedCategory[], Error> =>
  useQuery<SavedCategory[], Error>({
    queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories,
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.getMySavedCategories(token);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.savedCategory.listLoadFailed);
      }

      return response.data.categories.map((category) => toSavedCategoryEntity(category));
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

type CreateSavedCategoryInput = {
  title: string;
  sourceType?: 'manual' | 'forked';
  forkedFromSharedCategoryId?: string | null;
  sourceAuthorName?: string | null;
  sourceCategoryTitle?: string | null;
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
        title: input.title,
        sourceType: input.sourceType,
        forkedFromSharedCategoryId: input.forkedFromSharedCategoryId,
        sourceAuthorName: input.sourceAuthorName,
        sourceCategoryTitle: input.sourceCategoryTitle,
        places: input.places.map((place) => ({
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

// UserRequest: 공유 카테고리를 내 보관 카테고리로 fork 하는 흐름을 React Query 뮤테이션으로 관리
export const useForkSharedCategory = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: SharedSavedCategory) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.createSavedCategory(token, {
        title: category.title,
        sourceType: 'forked',
        forkedFromSharedCategoryId: category.id,
        sourceAuthorName: category.uploader,
        sourceCategoryTitle: category.title,
        places: category.places.map((place) => ({
          id: place.id,
          name: place.name,
          placeUrl: place.placeUrl,
          roadAddressName: place.roadAddressName,
          addressName: place.addressName,
          latitude: place.latitude,
          longitude: place.longitude,
        })),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.sharedCategory.forkFailed);
      }

      return response.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
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

      const response = await myStorageApi.createSavedCategory(token, {
        title: input.category.title,
        sourceType: 'forked',
        forkedFromSharedCategoryId: input.category.id,
        sourceAuthorName: input.category.uploader,
        sourceCategoryTitle: input.category.title,
        places: input.category.places.map((place) => ({
          name: place.name,
          placeUrl: place.placeUrl,
          roadAddressName: place.roadAddressName,
          addressName: place.addressName,
          latitude: place.latitude,
          longitude: place.longitude,
        })),
      });

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
    mutationFn: async (input: { id: string; title: string; places: SearchedPlace[] }) => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const response = await myStorageApi.updateSavedCategory(token, input.id, {
        title: input.title,
        places: input.places.map((place) => ({
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
