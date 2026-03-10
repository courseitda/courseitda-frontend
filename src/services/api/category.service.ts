import { apiClient } from '@/lib/axios';
import type { Category, Place } from '@/entities/types';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { toError } from './http';

// 카테고리 관련 백엔드 엔드포인트 상수 정의
const WORKSPACE_CATEGORIES_ENDPOINT = (workspaceIdentifier: string) =>
  `/api/workspaces/${workspaceIdentifier}/categories`;
const CATEGORY_ENDPOINT = (categoryId: string) => `/api/categories/${categoryId}`;
const CATEGORY_SEQUENCE_ENDPOINT = (workspaceIdentifier: string) =>
  `/api/workspaces/${workspaceIdentifier}/categories/sequence`;
const REPRESENTATIVE_PLACE_ENDPOINT = (categoryId: string) =>
  `/api/categories/${categoryId}/representative-place`;
const CATEGORY_PLACES_ENDPOINT = (categoryId: string) => `/api/categories/${categoryId}/places`;

// 카테고리 조회 응답 타입
export interface GetCategoryResponse {
  category?: Category;
  error?: string;
}

// 카테고리 추가 요청 파라미터 타입
export interface AddCategoryRequest {
  workspaceIdentifier: string;
  name: string;
  color: string;
}

// 카테고리 추가 응답 타입
export interface AddCategoryResponse {
  category?: Category;
  error?: string;
}

// 카테고리 수정 요청 파라미터 타입
export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
}

// 카테고리 수정 응답 타입
export interface UpdateCategoryResponse {
  error?: string;
}

// 카테고리 삭제 응답 타입
export interface DeleteCategoryResponse {
  error?: string;
}

// 카테고리 순서 변경 요청 타입
export interface ReorderCategoriesRequest {
  categories: Array<{
    id: string;
    sequence: number;
  }>;
}

// 카테고리 순서 변경 응답 타입
export interface ReorderCategoriesResponse {
  categories?: Array<{
    id: string;
    sequence: number;
  }>;
  error?: string;
}

// 대표 장소 설정 응답 타입
export interface SetRepresentativePlaceResponse {
  error?: string;
}

// 대표 장소 해제 응답 타입
export interface UnsetRepresentativePlaceResponse {
  error?: string;
}

// 워크스페이스별 카테고리 목록 조회 응답 타입
export interface CategoryPlaceView {
  id: string; // CategoryPlace ID
  place: Place;
  isRepresentative: boolean;
}

export interface WorkspaceCategory {
  category: Category;
  places: CategoryPlaceView[];
}

export interface GetCategoriesByWorkspaceResponse {
  categories: WorkspaceCategory[];
  error?: string;
}

// 카테고리 장소 목록 조회 응답 타입
export interface GetCategoryPlacesResponse {
  categoryPlaceResponses: Array<{
    id: string;
    name: string;
    placeUrl: string;
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
    isRepresentative: boolean;
  }>;
  error?: string;
}

type CategoryApiResponse = {
  id: number | string;
  workspaceId?: number | string;
  name: string;
  color: string;
  sequence?: number;
  representativePlaceId?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryListApiResponse = {
  categories: Array<{
    id: number | string;
    name: string;
    color: string;
    sequence: number;
    representativePlaceId: number | string | null;
    categoryPlaces: {
      categoryPlaces: Array<{
        id: number | string;
        placeId?: number | string | null;
        name: string;
        placeUrl: string;
        addressName: string;
        roadAddressName: string | null;
        latitude: number;
        longitude: number;
        isRepresentative: boolean;
      }>;
    };
  }>;
};

type CategoryPlacesApiResponse = {
  categoryPlaceResponses: Array<{
    id: number | string;
    name: string;
    placeUrl: string;
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
    isRepresentative: boolean;
  }>;
};

type ReorderApiRequest = {
  categories: Array<{
    id: number | string;
    sequence: number;
  }>;
};

const fallbackTimestamp = () => new Date().toISOString();

const adaptCategory = (
  workspaceIdentifier: string | null,
  payload: CategoryApiResponse,
): Category => ({
  id: String(payload.id),
  workspaceId: workspaceIdentifier ? String(workspaceIdentifier) : String(payload.workspaceId ?? ''),
  name: payload.name,
  color: payload.color,
  sequence: payload.sequence ?? 0,
  representativePlaceId:
    payload.representativePlaceId !== undefined && payload.representativePlaceId !== null
      ? String(payload.representativePlaceId)
      : null,
  createdAt: payload.createdAt ?? fallbackTimestamp(),
  updatedAt: payload.updatedAt ?? fallbackTimestamp(),
});

const adaptPlace = (payload: {
  id: number | string;
  name: string;
  placeUrl: string | null;
  addressName: string;
  roadAddressName: string | null;
  latitude: number;
  longitude: number;
}): Place => ({
  id: String(payload.id),
  name: payload.name,
  placeUrl: payload.placeUrl ?? '',
  addressName: payload.addressName,
  roadAddressName: payload.roadAddressName,
  latitude: payload.latitude,
  longitude: payload.longitude,
  createdAt: fallbackTimestamp(),
  updatedAt: fallbackTimestamp(),
});

// 카테고리 API 서비스 객체 - 모든 카테고리 관련 API 호출을 중앙 관리
export const categoryApi = {
  /**
   * 카테고리 단일 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 카테고리 정보 또는 에러 메시지
   */
  getById: async (categoryId: string): Promise<GetCategoryResponse> => {
    try {
      const response = await apiClient.get<CategoryApiResponse>(CATEGORY_ENDPOINT(categoryId));
      return { category: adaptCategory(null, response.data) };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.CATEGORY_NOT_FOUND,
        MESSAGES.workspaceCategory.listLoadFailed,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리 추가 API 호출
   * @param data 워크스페이스 ID, 이름, 색상
   * @returns 생성된 카테고리 또는 에러 메시지
   */
  add: async (data: AddCategoryRequest): Promise<AddCategoryResponse> => {
    try {
      const { workspaceIdentifier, ...payload } = data;
      const response = await apiClient.post<CategoryApiResponse>(
        WORKSPACE_CATEGORIES_ENDPOINT(workspaceIdentifier),
        payload,
      );

      return { category: adaptCategory(workspaceIdentifier, response.data) };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.common.defaultError,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리 수정 API 호출
   * @param id 카테고리 ID
   * @param data 수정할 필드 (이름, 색상)
   * @returns 에러 메시지 (없으면 성공)
   */
  update: async (id: string, data: UpdateCategoryRequest): Promise<UpdateCategoryResponse> => {
    try {
      await apiClient.patch(CATEGORY_ENDPOINT(id), data);
      return {};
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.common.defaultError,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리 삭제 API 호출 (연결된 장소 관계도 함께 삭제)
   * @param id 카테고리 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  delete: async (id: string): Promise<DeleteCategoryResponse> => {
    try {
      await apiClient.delete(CATEGORY_ENDPOINT(id));
      return {};
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.TEMPORARY_ERROR,
        MESSAGES.savedCategory.deleteFailed,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리 순서 변경 API 호출 (드래그앤드롭 후)
   * @param workspaceIdentifier 워크스페이스 식별자
   * @param categories 카테고리 ID와 새 순서 배열 (0-based)
   * @returns 변경된 카테고리 순서 또는 에러 메시지
   */
  reorder: async (
    workspaceIdentifier: string,
    categories: Array<{ id: string; sequence: number }>,
  ): Promise<ReorderCategoriesResponse> => {
    try {
      const requestBody: ReorderApiRequest = {
        categories: categories.map((category) => ({
          id: category.id,
          sequence: category.sequence + 1, // 백엔드 스펙: 1부터 시작
        })),
      };

      const response = await apiClient.post<{ categories: Array<{ id: number | string; sequence: number }> }>(
        CATEGORY_SEQUENCE_ENDPOINT(workspaceIdentifier),
        requestBody,
      );

      return {
        categories: response.data.categories.map((category) => ({
          id: String(category.id),
          sequence: category.sequence - 1, // 프론트에서는 0부터 사용
        })),
      };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.DUPLICATE_CATEGORY_ORDER_IN_REQUEST,
        MESSAGES.workspaceCategory.reorderFailed,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 대표 장소 설정 API 호출 (경로 생성용)
   * @param categoryId 카테고리 ID
   * @param placeId 카테고리 장소 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  setRepresentativePlace: async (
    categoryId: string,
    categoryPlaceId: string,
  ): Promise<SetRepresentativePlaceResponse> => {
    try {
      await apiClient.put(REPRESENTATIVE_PLACE_ENDPOINT(categoryId), {
        categoryPlaceId,
      });
      return {};
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.INVALID_REPRESENTATIVE_PLACE_ASSIGNMENT,
        MESSAGES.place.representativeFailed,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 대표 장소 해제 API 호출
   * @param categoryId 카테고리 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  unsetRepresentativePlace: async (categoryId: string): Promise<UnsetRepresentativePlaceResponse> => {
    try {
      await apiClient.delete(REPRESENTATIVE_PLACE_ENDPOINT(categoryId));
      return {};
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.INVALID_REPRESENTATIVE_PLACE_ASSIGNMENT,
        MESSAGES.place.representativeFailed,
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 워크스페이스별 카테고리 목록 조회 API 호출
   * @param workspaceIdentifier 워크스페이스 식별자
   * @returns 카테고리 목록과 장소 정보 또는 에러 메시지
   */
  getByWorkspace: async (
    workspaceIdentifier: string,
  ): Promise<GetCategoriesByWorkspaceResponse> => {
    try {
      const response = await apiClient.get<CategoryListApiResponse>(
        WORKSPACE_CATEGORIES_ENDPOINT(workspaceIdentifier),
      );

      const categories = response.data.categories
        .map((category) => {
          const baseCategory = adaptCategory(workspaceIdentifier, {
            id: category.id,
            name: category.name,
            color: category.color,
            sequence: category.sequence,
            representativePlaceId: category.representativePlaceId,
          });

          const places: CategoryPlaceView[] = category.categoryPlaces.categoryPlaces.map((place) => ({
            id: String(place.id),
            place: adaptPlace({
              id: place.placeId ?? place.id,
              name: place.name,
              placeUrl: place.placeUrl,
              addressName: place.addressName,
              roadAddressName: place.roadAddressName,
              latitude: place.latitude,
              longitude: place.longitude,
            }),
            isRepresentative: place.isRepresentative,
          }));

          return {
            category: baseCategory,
            places,
          };
        })
        .sort((a, b) => a.category.sequence - b.category.sequence);

      return { categories };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.WORKSPACE_NOT_FOUND,
        MESSAGES.workspaceCategory.listLoadFailed,
      );
      return {
        categories: [],
        error: apiError.error?.message,
      };
    }
  },

  /**
   * 카테고리 장소 목록 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 카테고리에 속한 장소 목록 또는 에러 메시지
   */
  getPlaces: async (categoryId: string): Promise<GetCategoryPlacesResponse> => {
    try {
      const response = await apiClient.get<CategoryPlacesApiResponse>(
        CATEGORY_PLACES_ENDPOINT(categoryId),
      );

      return {
        categoryPlaceResponses: response.data.categoryPlaceResponses.map((place) => ({
          id: String(place.id),
          name: place.name,
          placeUrl: place.placeUrl,
          addressName: place.addressName,
          roadAddressName: place.roadAddressName,
          latitude: place.latitude,
          longitude: place.longitude,
          isRepresentative: place.isRepresentative,
        })),
      };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
        MESSAGES.common.defaultError,
      );
      return {
        categoryPlaceResponses: [],
        error: apiError.error?.message,
      };
    }
  },

  /**
   * 카테고리와 연관된 장소를 Place 타입으로 변환 (지도 등 재사용 목적)
   * @param categoryId 카테고리 ID
   * @returns Place 배열 또는 에러 메시지
   */
  getPlacesAsEntities: async (categoryId: string): Promise<{ places: Place[]; error?: string }> => {
    try {
      const { categoryPlaceResponses, error } = await categoryApi.getPlaces(categoryId);
      if (error) {
        return { places: [], error };
      }

      return {
        places: categoryPlaceResponses.map((place) =>
          adaptPlace({
            id: place.id,
            name: place.name,
            placeUrl: place.placeUrl,
            addressName: place.addressName,
            roadAddressName: place.roadAddressName,
            latitude: place.latitude,
            longitude: place.longitude,
          }),
        ),
      };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
        MESSAGES.common.defaultError,
      );
      return { places: [], error: apiError.error?.message };
    }
  },
};
