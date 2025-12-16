import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { toError, toSuccess } from './http';

// 커뮤니티 관련 백엔드 엔드포인트 상수 정의
const RECOMMENDED_SHARED_CATEGORIES_ENDPOINT = '/api/community/shared-categories/recommendations';
const SEARCH_SHARED_CATEGORIES_ENDPOINT = '/api/community/shared-categories/search';
const SHARED_CATEGORY_LIKE_ENDPOINT = (sharedCategoryId: string) =>
  `/api/community/shared-categories/${sharedCategoryId}/likes`;

type SharedCategoryPlaceApiResponse = {
  id: number | string;
  name: string;
  addressName: string;
};

type SharedCategoryApiResponse = {
  id: number | string;
  title: string;
  uploaderNickname: string;
  uploadedAt: string;
  isLiked: boolean;
  placeCount: number;
  places: SharedCategoryPlaceApiResponse[];
};

// 공유 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface SharedCategoriesData {
  sharedCategories: Array<{
    id: string;
    title: string;
    uploaderNickname: string;
    uploadedAt: string;
    isLiked: boolean;
    placeCount: number;
    places: Array<{
      id: string;
      name: string;
      addressName: string;
    }>;
  }>;
}

// 공유 카테고리 찜 토글 응답 타입
export interface ToggleSharedCategoryLikeData {
  sharedCategoryId: string;
  isLiked: boolean;
}

const adaptSharedCategories = (payload: SharedCategoryApiResponse[]): SharedCategoriesData => ({
  sharedCategories: payload.map((category) => ({
    id: String(category.id),
    title: category.title,
    uploaderNickname: category.uploaderNickname,
    uploadedAt: category.uploadedAt,
    isLiked: category.isLiked,
    placeCount: category.placeCount,
    places: category.places.map((place) => ({
      id: String(place.id),
      name: place.name,
      addressName: place.addressName,
    })),
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
        '추천 카테고리를 불러올 수 없습니다.',
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
        '검색어를 확인해주세요.',
      );
    }
  },

  /**
   * 공유 카테고리 찜 추가 API 호출
   * @param token 인증 토큰
   * @param sharedCategoryId 공유 카테고리 ID
   *
   * 백엔드 엔드포인트: POST /api/community/shared-categories/{id}/likes
   */
  likeSharedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<ToggleSharedCategoryLikeData>> => {
    try {
      const response = await apiClient.post<{ sharedCategoryId: string; isLiked: boolean }>(
        SHARED_CATEGORY_LIKE_ENDPOINT(sharedCategoryId),
        null,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<ToggleSharedCategoryLikeData>({
        sharedCategoryId: response.data.sharedCategoryId,
        isLiked: response.data.isLiked,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        '찜 처리에 실패했습니다.',
      );
    }
  },

  /**
   * 공유 카테고리 찜 해제 API 호출
   * @param token 인증 토큰
   * @param sharedCategoryId 공유 카테고리 ID
   *
   * 백엔드 엔드포인트: DELETE /api/community/shared-categories/{id}/likes
   */
  unlikeSharedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<ToggleSharedCategoryLikeData>> => {
    try {
      const response = await apiClient.delete<{ sharedCategoryId: string; isLiked: boolean }>(
        SHARED_CATEGORY_LIKE_ENDPOINT(sharedCategoryId),
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<ToggleSharedCategoryLikeData>({
        sharedCategoryId: response.data.sharedCategoryId,
        isLiked: response.data.isLiked,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        '찜 해제에 실패했습니다.',
      );
    }
  },
};

