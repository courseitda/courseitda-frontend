import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { toError, toSuccess } from './http';

// 커뮤니티 관련 백엔드 엔드포인트 상수 정의
const SEARCH_SHARED_CATEGORIES_ENDPOINT = '/api/shared-categories/search';
const MY_SHARED_CATEGORIES_ENDPOINT = '/api/me/shared-categories';
const MY_LIKED_SHARED_CATEGORIES_ENDPOINT = '/api/me/liked-shared-categories';
const MY_LIKED_SHARED_CATEGORIES_CONTAINS_ENDPOINT = '/api/me/liked-shared-categories/contains';
const SHARED_CATEGORY_ENDPOINT = '/api/shared-categories';

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
  name?: string;
  title?: string;
  authorNickname?: string;
  uploaderNickname?: string;
  createdAt?: string;
  uploadedAt?: string;
  likeCount?: number;
  placeCount?: number;
  isDeleted?: boolean;
  sharedCategoryPlaces?: SharedCategoryPlaceApiResponse[];
  places?: SharedCategoryPlaceApiResponse[];
};

type MySharedCategoryApiResponse = {
  id: number | string;
  name: string;
  createdAt: string;
  placeCount: number;
  likeCount?: number;
};

type SharedCategoriesListApiResponse = {
  sharedCategories: SharedCategoryApiResponse[];
  hasNext?: boolean;
  nextCursor?: number | null;
};

// 공유 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface SharedCategoriesData {
  sharedCategories: Array<{
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    isDeleted?: boolean;
    likeCount: number;
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
  hasNext: boolean;
  nextCursor: number | null;
}

// 내 공유 카테고리 목록 조회 응답 데이터 타입
export interface MySharedCategoriesData {
  sharedCategories: Array<{
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    likeCount: number;
    placeCount: number;
    publishedFromSavedCategoryId: string;
  }>;
  hasNext: boolean;
  nextCursor: number | null;
}

// 보관 카테고리를 공유할 때 응답 데이터 타입
export interface ShareSavedCategoryData {
  sharedCategory: {
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isImmutableSnapshot: true;
    likeCount: number;
    placeCount: number;
    publishedFromSavedCategoryId: string;
  };
}

export interface LikedSharedCategoryIdsData {
  likedSharedCategoryIds: string[];
}

const adaptSharedCategoryPlaces = (places: SharedCategoryPlaceApiResponse[] | undefined) =>
  (places ?? []).map((place) => ({
    id: String(place.id),
    name: place.name,
    // UserRequest: 공유 카테고리 장소 응답 필드 확장 반영
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  }));

const adaptSharedCategories = (payload: SharedCategoryApiResponse[]): SharedCategoriesData => ({
  sharedCategories: payload.map((category) => {
    const categoryPlaces = category.sharedCategoryPlaces ?? category.places ?? [];

    return {
      id: String(category.id),
      title: category.name ?? category.title ?? '',
      uploaderNickname: category.authorNickname ?? category.uploaderNickname ?? '',
      uploadedAt: category.createdAt ?? category.uploadedAt ?? '',
      isImmutableSnapshot: true,
      isDeleted: category.isDeleted ?? false,
      likeCount: category.likeCount ?? 0,
      placeCount: category.placeCount ?? categoryPlaces.length,
      places: adaptSharedCategoryPlaces(categoryPlaces),
    };
  }),
  hasNext: false,
  nextCursor: null,
});

const adaptMySharedCategories = (payload: MySharedCategoryApiResponse[]): MySharedCategoriesData => ({
  sharedCategories: payload.map((category) => ({
    id: String(category.id),
    title: category.name,
    uploaderNickname: 'me',
    uploadedAt: category.createdAt,
    isImmutableSnapshot: true,
    likeCount: category.likeCount ?? 0,
    placeCount: category.placeCount,
    publishedFromSavedCategoryId: '',
  })),
  hasNext: false,
  nextCursor: null,
});

// UserRequest: 공유 카테고리 목록 API는 배열/페이지네이션 객체 응답 모두 허용하여 게시판 진입 오류를 방지한다.
const normalizeSharedCategoriesResponse = (
  payload: SharedCategoryApiResponse[] | SharedCategoriesListApiResponse,
): SharedCategoriesData => {
  if (Array.isArray(payload)) {
    return adaptSharedCategories(payload);
  }

  return {
    ...adaptSharedCategories(payload.sharedCategories ?? []),
    hasNext: payload.hasNext ?? false,
    nextCursor: payload.nextCursor ?? null,
  };
};

// 커뮤니티 API 서비스 객체 - 모든 커뮤니티 관련 API 호출을 service 계층에서 중앙 관리
export const communityApi = {
  /**
   * 전체 공유 카테고리 목록 조회 API 호출
   * @param params 커서 기반 페이지네이션
   * @returns API 응답 (성공 시 공유 카테고리 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/shared-categories
   */
  getSharedCategories: async (
    params?: { cursor?: number | null; size?: number },
  ): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      const response = await apiClient.get<SharedCategoryApiResponse[] | SharedCategoriesListApiResponse>(
        SHARED_CATEGORY_ENDPOINT,
        {
          params: {
            cursor: params?.cursor ?? undefined,
            size: params?.size ?? 20,
          },
        },
      );
      return toSuccess<SharedCategoriesData>(normalizeSharedCategoriesResponse(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.TEMPORARY_ERROR,
        MESSAGES.sharedCategory.searchLoadFailed,
      );
    }
  },

  /**
   * 추천 공유 카테고리 목록 조회 API 호출
   * @returns API 응답 (성공 시 공유 카테고리 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/shared-categories?size=5
   */
  getRecommendedSharedCategories: async (): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      // 추천 전용 엔드포인트 대신 목록 API 상위 5개를 사용하여 문서 계약과 구현을 일치시킨다.
      const response = await apiClient.get<SharedCategoriesListApiResponse>(
        SHARED_CATEGORY_ENDPOINT,
        {
          params: {
            size: 5,
          },
        },
      );
      return toSuccess<SharedCategoriesData>(normalizeSharedCategoriesResponse(response.data));
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
   * 백엔드 엔드포인트: GET /api/me/shared-categories
   */
  getMySharedCategories: async (
    token: string,
    params?: { cursor?: number | null; size?: number },
  ): Promise<ApiResponse<MySharedCategoriesData>> => {
    try {
      const response = await apiClient.get<{
        sharedCategories: MySharedCategoryApiResponse[];
        hasNext: boolean;
        nextCursor: number | null;
      }>(MY_SHARED_CATEGORIES_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          cursor: params?.cursor ?? undefined,
          size: params?.size ?? 20,
        },
      });

      return toSuccess<MySharedCategoriesData>({
        ...adaptMySharedCategories(response.data.sharedCategories),
        hasNext: response.data.hasNext,
        nextCursor: response.data.nextCursor,
      });
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
   * 백엔드 엔드포인트: GET /api/shared-categories/search?keyword=...
   */
  searchSharedCategories: async (
    keyword: string,
    params?: { cursor?: number | null; size?: number },
  ): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      const response = await apiClient.get<{
        sharedCategories: SharedCategoryApiResponse[];
        hasNext: boolean;
        nextCursor: number | null;
      }>(
        SEARCH_SHARED_CATEGORIES_ENDPOINT,
        {
          params: {
            keyword,
            cursor: params?.cursor ?? undefined,
            size: params?.size ?? 20,
          },
        },
      );
      return toSuccess<SharedCategoriesData>({
        ...adaptSharedCategories(response.data.sharedCategories),
        hasNext: response.data.hasNext,
        nextCursor: response.data.nextCursor,
      });
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
   * 백엔드 엔드포인트: POST /api/shared-categories
   */
  shareSavedCategory: async (
    token: string,
    savedCategoryId: string,
  ): Promise<ApiResponse<ShareSavedCategoryData>> => {
    try {
      const response = await apiClient.post<{ id: number | string; name: string }>(
        SHARED_CATEGORY_ENDPOINT,
        { savedCategoryId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<ShareSavedCategoryData>({
        sharedCategory: {
          id: String(response.data.id),
          title: response.data.name,
          uploaderNickname: 'me',
          uploadedAt: new Date().toISOString(),
          isImmutableSnapshot: true,
          likeCount: 0,
          placeCount: 0,
          publishedFromSavedCategoryId: '',
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
   * 백엔드 엔드포인트: DELETE /api/shared-categories/{id}
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
   * 백엔드 엔드포인트: GET /api/shared-categories/{id}
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

  getLikedSharedCategoryIds: async (
    token: string,
    sharedCategoryIds: string[],
  ): Promise<ApiResponse<LikedSharedCategoryIdsData>> => {
    try {
      // 백엔드 문서 계약에 맞춰 sharedCategoryIds를 CSV 문자열로 직렬화한다.
      const response = await apiClient.get<{ likedSharedCategoryIds: Array<string | number> }>(
        MY_LIKED_SHARED_CATEGORIES_CONTAINS_ENDPOINT,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            sharedCategoryIds: sharedCategoryIds.join(','),
          },
        },
      );

      return toSuccess<LikedSharedCategoryIdsData>({
        likedSharedCategoryIds: (response.data.likedSharedCategoryIds ?? []).map((id) => String(id)),
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.INVALID_TOKEN,
        MESSAGES.common.defaultError,
      );
    }
  },

  getLikedSharedCategories: async (
    token: string,
    params?: { cursor?: number | null; size?: number },
  ): Promise<ApiResponse<SharedCategoriesData>> => {
    try {
      const response = await apiClient.get<SharedCategoryApiResponse[] | SharedCategoriesListApiResponse>(
        MY_LIKED_SHARED_CATEGORIES_ENDPOINT,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            cursor: params?.cursor ?? undefined,
            size: params?.size ?? 20,
          },
        },
      );

      return toSuccess<SharedCategoriesData>(normalizeSharedCategoriesResponse(response.data));
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.INVALID_TOKEN,
        MESSAGES.common.defaultError,
      );
    }
  },

  likeSharedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<null>> => {
    try {
      await apiClient.post(
        `${SHARED_CATEGORY_ENDPOINT}/${sharedCategoryId}/likes`,
        undefined,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<null>(null);
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.common.defaultError,
      );
    }
  },

  unlikeSharedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<null>> => {
    try {
      await apiClient.delete(`${SHARED_CATEGORY_ENDPOINT}/${sharedCategoryId}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<null>(null);
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.common.defaultError,
      );
    }
  },
};
