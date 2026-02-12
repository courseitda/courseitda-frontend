import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { toError, toSuccess } from './http';

// 내 보관함(MyStorage) 관련 백엔드 엔드포인트 상수 정의
const MY_SAVED_CATEGORIES_ENDPOINT = '/api/me/saved-categories';

type SavedCategoryPlaceApiResponse = {
  id: number | string;
  // UserRequest: 보관 카테고리 장소 응답에 위치/주소/URL 필드 포함
  name: string;
  placeUrl: string;
  roadAddressName: string;
  addressName: string;
  latitude: number;
  longitude: number;
};

type SavedCategoryApiResponse = {
  id: number | string;
  title: string;
  modifiedAt: string;
  placeCount: number;
  places: SavedCategoryPlaceApiResponse[];
};

type CreateSavedCategoryRequest = {
  title: string;
  places: Array<{
    name: string;
    placeUrl: string;
    roadAddressName: string | null;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

type UpdateSavedCategoryRequest = CreateSavedCategoryRequest;

// 내 보관 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface MySavedCategoriesData {
  categories: Array<{
    id: string;
    title: string;
    modifiedAt: string;
    placeCount: number;
    places: Array<{
      id: string;
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  }>;
}

// 내 보관 카테고리 생성 응답 데이터 타입
export interface CreateSavedCategoryData {
  category: {
    id: string;
    title: string;
    modifiedAt: string;
    placeCount: number;
    places: Array<{
      id: string;
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

// 내 보관 카테고리 수정 응답 데이터 타입
export interface UpdateSavedCategoryData {
  category: {
    id: string;
    title: string;
    modifiedAt: string;
    placeCount: number;
    places: Array<{
      id: string;
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

const adaptSavedCategory = (
  category: SavedCategoryApiResponse,
): UpdateSavedCategoryData['category'] => ({
  id: String(category.id),
  title: category.title,
  modifiedAt: category.modifiedAt,
  placeCount: category.placeCount,
  places: category.places.map((place) => ({
    id: String(place.id),
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

const adaptMySavedCategories = (payload: SavedCategoryApiResponse[]): MySavedCategoriesData => ({
  categories: payload.map((category) => ({
    id: String(category.id),
    title: category.title,
    modifiedAt: category.modifiedAt,
    placeCount: category.placeCount,
    places: category.places.map((place) => ({
      id: String(place.id),
      name: place.name,
      // UserRequest: 보관 카테고리 장소 응답 필드 확장 반영
      placeUrl: place.placeUrl,
      roadAddressName: place.roadAddressName,
      addressName: place.addressName,
      latitude: place.latitude,
      longitude: place.longitude,
    })),
  })),
});

// 내 보관함 API 서비스 객체 - 내 카테고리(보관 카테고리) 관련 API 호출을 service 계층에서 중앙 관리
export const myStorageApi = {
  /**
   * 내 보관 카테고리 목록 조회 API 호출
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 보관 카테고리 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/me/saved-categories
   */
  getMySavedCategories: async (token: string): Promise<ApiResponse<MySavedCategoriesData>> => {
    try {
      // UserRequest: MyCategory 페이지의 데이터 로딩을 컴포넌트 내부 mock이 아닌 service 계층 API 호출로 통일
      const response = await apiClient.get<SavedCategoryApiResponse[]>(
        MY_SAVED_CATEGORIES_ENDPOINT,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<MySavedCategoriesData>(adaptMySavedCategories(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.INVALID_TOKEN,
        '내 카테고리를 불러올 수 없습니다.',
      );
    }
  },

  /**
   * 내 보관 카테고리 생성 API 호출
   * @param token 인증 토큰
   * @param payload 카테고리 이름 및 장소 목록
   * @returns API 응답 (성공 시 생성된 카테고리, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/me/saved-categories
   */
  createSavedCategory: async (
    token: string,
    payload: CreateSavedCategoryRequest,
  ): Promise<ApiResponse<CreateSavedCategoryData>> => {
    try {
      // UserRequest: 내 카테고리 생성은 service 계층 API 호출로 통일
      const response = await apiClient.post<SavedCategoryApiResponse>(
        MY_SAVED_CATEGORIES_ENDPOINT,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<CreateSavedCategoryData>({
        category: adaptSavedCategory(response.data),
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        '카테고리 생성에 실패했습니다.',
      );
    }
  },

  /**
   * 내 보관 카테고리 수정 API 호출
   * @param token 인증 토큰
   * @param savedCategoryId 수정할 카테고리 ID
   * @param payload 카테고리 이름 및 장소 목록
   * @returns API 응답 (성공 시 수정된 카테고리, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: PATCH /api/me/saved-categories/{savedCategoryId}
   */
  updateSavedCategory: async (
    token: string,
    savedCategoryId: string,
    payload: UpdateSavedCategoryRequest,
  ): Promise<ApiResponse<UpdateSavedCategoryData>> => {
    try {
      // UserRequest: 내 카테고리 수정은 service 계층 API 호출로 통일
      const response = await apiClient.patch<SavedCategoryApiResponse>(
        `${MY_SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<UpdateSavedCategoryData>({
        category: adaptSavedCategory(response.data),
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        '카테고리 수정에 실패했습니다.',
      );
    }
  },

  /**
   * 내 보관 카테고리 삭제 API 호출
   * @param token 인증 토큰
   * @param savedCategoryId 삭제할 카테고리 ID
   * @returns API 응답 (성공 시 null, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: DELETE /api/me/saved-categories/{savedCategoryId}
   */
  deleteSavedCategory: async (
    token: string,
    savedCategoryId: string,
  ): Promise<ApiResponse<null>> => {
    try {
      // UserRequest: 내 카테고리 삭제는 service 계층 API 호출로 통일
      await apiClient.delete(
        `${MY_SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<null>(null);
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        '카테고리 삭제에 실패했습니다.',
      );
    }
  },
};
