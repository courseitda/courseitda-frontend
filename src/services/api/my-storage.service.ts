import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { toError, toSuccess } from './http';
import {
  adaptCreatedSavedCategory,
  adaptMySavedCategories,
  adaptSavedCategoryDetail,
  adaptSavedCategoryPlaces,
} from './my-storage.adapters';
import type {
  ContainsForkedSharedCategoriesApiResponse,
  ContainsForkedSharedCategoriesData,
  CreateSavedCategoryData,
  CreateSavedCategoryManualApiResponse,
  CreateSavedCategoryManualData,
  CreateSavedCategoryManualRequest,
  ForkSavedCategoryApiResponse,
  ForkSavedCategoryData,
  MySavedCategoriesData,
  SavedCategoryApiResponse,
  SavedCategoryDetailApiResponse,
  SavedCategoryDetailData,
  SavedCategoryPlacesApiResponse,
  SyncSavedCategoryPlacesRequest,
  UpdateSavedCategoryData,
  UpdateSavedCategoryRequest,
} from './my-storage.types';

// 내 보관함(MyStorage) 관련 백엔드 엔드포인트 상수 정의
const MY_SAVED_CATEGORIES_ENDPOINT = '/api/me/saved-categories';
const SAVED_CATEGORIES_ENDPOINT = '/api/saved-categories';
const SAVED_CATEGORY_FORK_ENDPOINT = '/api/saved-categories/fork';
const SAVED_CATEGORY_CONTAINS_ENDPOINT = '/api/me/saved-categories/contains';

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

      return toSuccess<CreateSavedCategoryManualData>({ category: adaptCreatedSavedCategory(response.data) });
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
  getMySavedCategories: async (
    token: string,
    params?: { cursor?: number | null; size?: number },
  ): Promise<ApiResponse<MySavedCategoriesData>> => {
    try {
      // UserRequest: MyCategory 페이지의 데이터 로딩을 컴포넌트 내부 mock이 아닌 service 계층 API 호출로 통일
      const response = await apiClient.get<{
        savedCategories: SavedCategoryApiResponse[];
        hasNext: boolean;
        nextCursor: number | null;
      }>(
        MY_SAVED_CATEGORIES_ENDPOINT,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            cursor: params?.cursor ?? undefined,
            size: params?.size ?? 20,
          },
        },
      );

      return toSuccess<MySavedCategoriesData>({
        ...adaptMySavedCategories(response.data.savedCategories),
        hasNext: response.data.hasNext,
        nextCursor: response.data.nextCursor,
      });
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
   * 백엔드 엔드포인트: POST /api/saved-categories, POST /api/saved-categories/{savedCategoryId}/places
   */
  createSavedCategory: async (
    token: string,
    payload: CreateSavedCategoryManualRequest,
  ): Promise<ApiResponse<CreateSavedCategoryData>> => {
    try {
      // UserRequest: 보관 카테고리 생성은 이름 생성 후 장소 추가 API를 순차 호출한다.
      const createdResponse = await apiClient.post<CreateSavedCategoryManualApiResponse>(
        SAVED_CATEGORIES_ENDPOINT,
        { name: payload.name },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const placesResponse = await apiClient.post<SavedCategoryPlacesApiResponse>(
        `${SAVED_CATEGORIES_ENDPOINT}/${createdResponse.data.id}/places`,
        { savedCategoryPlaces: payload.savedCategoryPlaces },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<CreateSavedCategoryData>({
        category: {
          id: String(createdResponse.data.id),
          title: createdResponse.data.name,
          places: adaptSavedCategoryPlaces(placesResponse.data.savedCategoryPlaces),
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
   * 공유 카테고리 포크 API 호출
   * @param token 인증 토큰
   * @param sharedCategoryId 공유 카테고리 ID
   * @returns API 응답 (성공 시 생성된 보관 카테고리 정보, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/saved-categories/fork
   */
  forkSavedCategory: async (
    token: string,
    sharedCategoryId: string,
  ): Promise<ApiResponse<ForkSavedCategoryData>> => {
    try {
      const response = await apiClient.post<ForkSavedCategoryApiResponse>(
        SAVED_CATEGORY_FORK_ENDPOINT,
        { sharedCategoryId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<ForkSavedCategoryData>({
        category: {
          id: String(response.data.id),
          title: response.data.name,
        },
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.sharedCategory.forkFailed,
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
   * 백엔드 엔드포인트: PATCH /api/saved-categories/{savedCategoryId}, PATCH /api/saved-categories/{savedCategoryId}/places
   */
  updateSavedCategory: async (
    token: string,
    savedCategoryId: string,
    payload: UpdateSavedCategoryRequest,
  ): Promise<ApiResponse<UpdateSavedCategoryData>> => {
    try {
      // UserRequest: 보관 카테고리 수정은 이름 수정 후 장소 동기화 API를 순차 호출한다.
      const renamedResponse = await apiClient.patch<CreateSavedCategoryManualApiResponse>(
        `${SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}`,
        { name: payload.name },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const placesResponse = await apiClient.patch<SavedCategoryPlacesApiResponse>(
        `${SAVED_CATEGORIES_ENDPOINT}/${savedCategoryId}/places`,
        { savedCategoryPlaces: payload.savedCategoryPlaces },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<UpdateSavedCategoryData>({
        category: {
          id: String(savedCategoryId),
          title: renamedResponse.data.name,
          sourceType: 'manual',
          forkedFromSharedCategoryId: null,
          sourceAuthorName: null,
          sourceCategoryTitle: null,
          canPublish: true,
          publishBlockedReason: null,
          modifiedAt: new Date().toISOString(),
          placeCount: placesResponse.data.savedCategoryPlaces.length,
          places: adaptSavedCategoryPlaces(placesResponse.data.savedCategoryPlaces),
        },
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
   * 포크 여부 확인 API 호출
   * @param token 인증 토큰
   * @param sharedCategoryIds 포크 여부를 확인할 공유 카테고리 ID 목록
   * @returns 현재 로그인한 사용자가 포크한 공유 카테고리 ID 목록
   *
   * 백엔드 엔드포인트: GET /api/me/saved-categories/contains
   */
  containsForkedSharedCategories: async (
    token: string,
    sharedCategoryIds: string[],
  ): Promise<ApiResponse<ContainsForkedSharedCategoriesData>> => {
    try {
      const response = await apiClient.get<ContainsForkedSharedCategoriesApiResponse>(
        SAVED_CATEGORY_CONTAINS_ENDPOINT,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { sharedCategoryIds: sharedCategoryIds.join(',') },
        },
      );

      return toSuccess<ContainsForkedSharedCategoriesData>({
        forkedSharedCategoryIds: response.data.forkedSharedCategoryIds.map((id) => String(id)),
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.INVALID_TOKEN,
        MESSAGES.sharedCategory.forkFailed,
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
