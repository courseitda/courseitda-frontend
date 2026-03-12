import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { toError, toSuccess } from './http';

// 내 보관함(MyStorage) 관련 백엔드 엔드포인트 상수 정의
const MY_SAVED_CATEGORIES_ENDPOINT = '/api/me/saved-categories';
const SAVED_CATEGORIES_ENDPOINT = '/api/saved-categories';

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
  sourceType: 'manual' | 'forked';
  forkedFromSharedCategoryId: number | string | null;
  sourceAuthorName: string | null;
  sourceCategoryTitle: string | null;
  canPublish: boolean;
  publishBlockedReason: string | null;
  modifiedAt: string;
  placeCount: number;
  places: SavedCategoryPlaceApiResponse[];
};

type CreateSavedCategoryRequest = {
  name: string;
  sourceType?: 'manual' | 'forked';
  forkedFromSharedCategoryId?: string | null;
  sourceAuthorName?: string | null;
  sourceCategoryTitle?: string | null;
  savedCategoryPlaces: Array<{
    name: string;
    placeUrl: string;
    roadAddressName: string | null;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

type UpdateSavedCategoryRequest = CreateSavedCategoryRequest;

type CreateSavedCategoryManualRequest = {
  name: string;
  savedCategoryPlaces: Array<{
    name: string;
    placeUrl: string;
    roadAddressName: string | null;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

type CreateSavedCategoryManualApiResponse = {
  id: number | string;
  name: string;
};

type SavedCategoryDetailApiResponse = {
  id: number | string;
  name: string;
  savedCategoryPlaces: SavedCategoryPlaceApiResponse[];
};

// 내 보관 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface MySavedCategoriesData {
  categories: Array<{
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
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface CreateSavedCategoryManualData {
  category: {
    id: string;
    title: string;
  };
}

// 내 보관 카테고리 수정 응답 데이터 타입
export interface UpdateSavedCategoryData {
  category: {
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
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface SavedCategoryDetailData {
  category: {
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
  sourceType: category.sourceType,
  forkedFromSharedCategoryId: category.forkedFromSharedCategoryId === null ? null : String(category.forkedFromSharedCategoryId),
  sourceAuthorName: category.sourceAuthorName,
  sourceCategoryTitle: category.sourceCategoryTitle,
  canPublish: category.canPublish,
  publishBlockedReason: category.publishBlockedReason,
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
    sourceType: category.sourceType,
    forkedFromSharedCategoryId: category.forkedFromSharedCategoryId === null ? null : String(category.forkedFromSharedCategoryId),
    sourceAuthorName: category.sourceAuthorName,
    sourceCategoryTitle: category.sourceCategoryTitle,
    canPublish: category.canPublish,
    publishBlockedReason: category.publishBlockedReason,
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

const adaptSavedCategoryDetail = (
  payload: SavedCategoryDetailApiResponse,
): SavedCategoryDetailData['category'] => ({
  id: String(payload.id),
  title: payload.name,
  sourceType: 'manual',
  forkedFromSharedCategoryId: null,
  sourceAuthorName: null,
  sourceCategoryTitle: null,
  canPublish: true,
  publishBlockedReason: null,
  modifiedAt: new Date().toISOString(),
  placeCount: payload.savedCategoryPlaces.length,
  places: payload.savedCategoryPlaces.map((place) => ({
    id: String(place.id),
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});

// 내 보관함 API 서비스 객체 - 내 카테고리(보관 카테고리) 관련 API 호출을 service 계층에서 중앙 관리
export const myStorageApi = {
  /**
   * 내 보관 카테고리 생성 API 호출 (백엔드 명세 기준)
   * @param token 인증 토큰
   * @param payload 카테고리 이름 및 장소 목록
   * @returns API 응답 (성공 시 생성된 카테고리 식별 정보, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/saved-categories
   */
  createSavedCategoryManual: async (
    token: string,
    payload: CreateSavedCategoryManualRequest,
  ): Promise<ApiResponse<CreateSavedCategoryManualData>> => {
    try {
      // UserRequest: MyCategory 생성 기능은 백엔드 명세의 /api/saved-categories 계약을 사용한다.
      const response = await apiClient.post<CreateSavedCategoryManualApiResponse>(
        SAVED_CATEGORIES_ENDPOINT,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<CreateSavedCategoryManualData>({
        category: {
          id: String(response.data.id),
          title: response.data.name,
        },
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.savedCategory.addFailed,
      );
    }
  },

  /**
   * 내 보관 카테고리 상세 조회 API 호출
   * @param token 인증 토큰
   * @param savedCategoryId 조회할 카테고리 ID
   * @returns API 응답 (성공 시 보관 카테고리 상세, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/saved-categories/{savedCategoryId}
   */
  getSavedCategoryDetail: async (
    token: string,
    savedCategoryId: string,
  ): Promise<ApiResponse<SavedCategoryDetailData>> => {
    try {
      const response = await apiClient.get<SavedCategoryDetailApiResponse>(
        `${SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<SavedCategoryDetailData>({
        category: adaptSavedCategoryDetail(response.data),
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        MESSAGES.savedCategory.listLoadFailed,
      );
    }
  },

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
        MESSAGES.savedCategory.listLoadFailed,
      );
    }
  },

  /**
   * 내 보관 카테고리 생성 API 호출
   * @param token 인증 토큰
   * @param payload 카테고리 이름 및 장소 목록
   * @returns API 응답 (성공 시 생성된 카테고리, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/saved-categories
   */
  createSavedCategory: async (
    token: string,
    payload: CreateSavedCategoryRequest,
  ): Promise<ApiResponse<CreateSavedCategoryData>> => {
    try {
      // UserRequest: fork 생성도 백엔드 명세의 /api/saved-categories 계약으로 통일한다.
      const response = await apiClient.post<CreateSavedCategoryManualApiResponse>(
        SAVED_CATEGORIES_ENDPOINT,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<CreateSavedCategoryData>({
        category: {
          id: String(response.data.id),
          title: response.data.name,
          sourceType: payload.sourceType ?? 'manual',
          forkedFromSharedCategoryId: payload.forkedFromSharedCategoryId ?? null,
          sourceAuthorName: payload.sourceAuthorName ?? null,
          sourceCategoryTitle: payload.sourceCategoryTitle ?? null,
          canPublish: payload.sourceType === 'forked' ? false : true,
          publishBlockedReason:
            payload.sourceType === 'forked'
              ? '공유 카테고리를 복사한 직후에는 다시 게시할 수 없습니다.'
              : null,
          modifiedAt: new Date().toISOString(),
          placeCount: payload.savedCategoryPlaces.length,
          places: payload.savedCategoryPlaces.map((place, index) => ({
            id: `temp-${index}`,
            name: place.name,
            placeUrl: place.placeUrl,
            roadAddressName: place.roadAddressName ?? '',
            addressName: place.addressName,
            latitude: place.latitude,
            longitude: place.longitude,
          })),
        },
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.savedCategory.addFailed,
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
        MESSAGES.savedCategory.updateFailed,
      );
    }
  },

  /**
   * 내 보관 카테고리 삭제 API 호출
   * @param token 인증 토큰
   * @param savedCategoryId 삭제할 카테고리 ID
   * @returns API 응답 (성공 시 null, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: DELETE /api/saved-categories/{savedCategoryId}
   */
  deleteSavedCategory: async (
    token: string,
    savedCategoryId: string,
  ): Promise<ApiResponse<null>> => {
    try {
      // UserRequest: 내 카테고리 삭제는 service 계층 API 호출로 통일
      await apiClient.delete(
        `${SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<null>(null);
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.SAVED_CATEGORY_NOT_FOUND,
        MESSAGES.savedCategory.deleteFailed,
      );
    }
  },
};
