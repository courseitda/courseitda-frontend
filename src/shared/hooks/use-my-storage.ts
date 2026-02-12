import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { myStorageApi } from '@/services/api';
import type { SavedCategory, SearchedPlace } from '@/entities/types';
import { toast } from 'sonner';

type SavedCategoryPayload = {
  id: string;
  title: string;
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
        throw new Error('인증 토큰이 필요합니다.');
      }

      const response = await myStorageApi.createSavedCategory(token, {
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
        throw new Error(response.error?.message ?? '카테고리 생성에 실패했습니다.');
      }

      return response.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      toast.success('카테고리가 추가되었습니다.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '카테고리 생성에 실패했습니다.';
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
        throw new Error('인증 토큰이 필요합니다.');
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
        throw new Error(response.error?.message ?? '카테고리 수정에 실패했습니다.');
      }

      return response.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      toast.success('카테고리가 수정되었습니다.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '카테고리 수정에 실패했습니다.';
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
        throw new Error('인증 토큰이 필요합니다.');
      }

      const response = await myStorageApi.deleteSavedCategory(token, savedCategoryId);

      if (!response.success) {
        throw new Error(response.error?.message ?? '카테고리 삭제에 실패했습니다.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEYS.mySavedCategories });
      toast.success('카테고리가 삭제되었습니다.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.';
      toast.error(message);
    },
  });
};
