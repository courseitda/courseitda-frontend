import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { toError, toSuccess } from './http';

// 커뮤니티 관련 백엔드 엔드포인트 상수 정의
const RECOMMENDED_SHARED_CATEGORIES_ENDPOINT = '/api/community/shared-categories/recommendations';
const SEARCH_SHARED_CATEGORIES_ENDPOINT = '/api/community/shared-categories/search';
const MY_SHARED_CATEGORIES_ENDPOINT = '/api/community/shared-categories/me';
const SHARED_CATEGORY_ENDPOINT = '/api/community/shared-categories';

type SharedCategoryPlaceApiResponse = {
  id: number | string;
  // UserRequest: 공유 카테고리 장소 응답에 위치/주소/URL 필드 포함
  name: string;
  placeUrl: string;
  roadAddressName: string;
  addressName: string;
  latitude: number;
  longitude: number;
};

type SharedCategoryApiResponse = {
  id: number | string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  forkCount: number;
  placeCount: number;
  places: SharedCategoryPlaceApiResponse[];
};

type MySharedCategoryApiResponse = {
  id: number | string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isImmutableSnapshot: true;
  forkCount: number;
  placeCount: number;
  savedCategoryId: number | string;
};

// 공유 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface SharedCategoriesData {
  sharedCategories: Array<{
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    forkCount: number;
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

// 내 공유 카테고리 목록 조회 응답 데이터 타입
export interface MySharedCategoriesData {
  sharedCategories: Array<{
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    forkCount: number;
    placeCount: number;
    publishedFromSavedCategoryId: string;
  }>;
}

// 보관 카테고리를 공유할 때 응답 데이터 타입
export interface ShareSavedCategoryData {
  sharedCategory: {
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    forkCount: number;
    placeCount: number;
    publishedFromSavedCategoryId: string;
  };
}

const adaptSharedCategories = (payload: SharedCategoryApiResponse[]): SharedCategoriesData => ({
  sharedCategories: payload.map((category) => ({
    id: String(category.id),
    title: category.title,
    uploaderNickname: category.uploaderNickname,
    uploadedAt: category.uploadedAt,
    isImmutableSnapshot: true,
    forkCount: category.forkCount,
    placeCount: category.placeCount,
    places: category.places.map((place) => ({
      id: String(place.id),
      name: place.name,
      // UserRequest: 공유 카테고리 장소 응답 필드 확장 반영
      placeUrl: place.placeUrl,
      roadAddressName: place.roadAddressName,
      addressName: place.addressName,
      latitude: place.latitude,
      longitude: place.longitude,
    })),
  })),
});

const adaptMySharedCategories = (payload: MySharedCategoryApiResponse[]): MySharedCategoriesData => ({
  sharedCategories: payload.map((category) => ({
    id: String(category.id),
    title: category.title,
    uploaderNickname: category.uploaderNickname,
    uploadedAt: category.uploadedAt,
    isImmutableSnapshot: true,
    forkCount: category.forkCount,
    placeCount: category.placeCount,
    publishedFromSavedCategoryId: String(category.savedCategoryId),
  })),
});

// 커뮤니티 API 서비스 객체 - 모든 커뮤니티 관련 API 호출을 service 계층에서 중앙 관리
export const communityApi = {
  /**
   * 추천 공유 카테고리 목록 조회 API 호출
   * @returns API 응답 (성공 시 공유 카테고리 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/community/shared-categories/recommendations
   */
  getRecommendedSharedCategories: async (): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      // UserRequest: Community 페이지의 데이터 로딩을 컴포넌트 내부 mock이 아닌 service 계층 API 호출로 통일
      const response = await apiClient.get<SharedCategoryApiResponse[]>(
        RECOMMENDED_SHARED_CATEGORIES_ENDPOINT,
      );
      return toSuccess<SharedCategoriesData>(adaptSharedCategories(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.TEMPORARY_ERROR,
        MESSAGES.sharedCategory.recommendedLoadFailed,
      );
    }
  },

  /**
   * 내 공유 카테고리 목록 조회 API 호출
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 공유 카테고리 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/community/shared-categories/me
   */
  getMySharedCategories: async (token: string): Promise<ApiResponse<MySharedCategoriesData>> => {
    try {
      const response = await apiClient.get<MySharedCategoryApiResponse[]>(MY_SHARED_CATEGORIES_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<MySharedCategoriesData>(adaptMySharedCategories(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.INVALID_TOKEN,
        MESSAGES.sharedCategory.myPostsLoadFailed,
      );
    }
  },

  /**
   * 공유 카테고리 검색 API 호출
   * @param keyword 검색어 (제목 기준)
   * @returns API 응답 (성공 시 검색 결과 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/community/shared-categories/search?keyword=...
   */
  searchSharedCategories: async (keyword: string): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      const response = await apiClient.get<SharedCategoryApiResponse[]>(
        SEARCH_SHARED_CATEGORIES_ENDPOINT,
        { params: { keyword } },
      );
      return toSuccess<SharedCategoriesData>(adaptSharedCategories(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.common.defaultError,
      );
    }
  },

  /**
   * 보관 카테고리를 커뮤니티에 공유하는 API 호출
   * @param token 인증 토큰
   * @param savedCategoryId 보관 카테고리 ID
   *
   * 백엔드 엔드포인트: POST /api/community/shared-categories
   */
  shareSavedCategory: async (
    token: string,
    savedCategoryId: string,
  ): Promise<ApiResponse<ShareSavedCategoryData>> => {
    try {
      const response = await apiClient.post<MySharedCategoryApiResponse>(
        SHARED_CATEGORY_ENDPOINT,
        { savedCategoryId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<ShareSavedCategoryData>({
        sharedCategory: {
          id: String(response.data.id),
          title: response.data.title,
          uploaderNickname: response.data.uploaderNickname,
          uploadedAt: response.data.uploadedAt,
          isImmutableSnapshot: true,
          forkCount: response.data.forkCount,
          placeCount: response.data.placeCount,
          publishedFromSavedCategoryId: String(response.data.savedCategoryId),
        },
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.sharedCategory.uploadFailed,
      );
    }
  },

  /**
   * 내가 공유한 카테고리를 삭제하는 API 호출
   * @param token 인증 토큰
   * @param sharedCategoryId 공유 카테고리 ID
   *
   * 백엔드 엔드포인트: DELETE /api/community/shared-categories/{id}
   */
  deleteMySharedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<null>> => {
    try {
      await apiClient.delete(`${SHARED_CATEGORY_ENDPOINT}/${sharedCategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<null>(null);
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.sharedCategory.deleteFailed,
      );
    }
  },

  /**
   * 공유 카테고리 상세 조회 API 호출
   * @param sharedCategoryId 공유 카테고리 ID
   * @returns API 응답 (성공 시 공유 카테고리 상세, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/community/shared-categories/{id}
   */
  getSharedCategoryDetail: async (
    sharedCategoryId: string,
  ): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      const response = await apiClient.get<SharedCategoryApiResponse>(
        `${SHARED_CATEGORY_ENDPOINT}/${sharedCategoryId}`,
      );
      return toSuccess<SharedCategoriesData>(adaptSharedCategories([response.data]));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.SHARED_SAVED_CATEGORY_NOT_FOUND,
        MESSAGES.sharedCategory.fetchDetailFailed,
      );
    }
  },
};
