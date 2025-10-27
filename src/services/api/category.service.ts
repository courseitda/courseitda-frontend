// 카테고리 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화

import {
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  setRepresentativePlace,
  unsetRepresentativePlace,
  getCategoriesByWorkspace,
  getCategoryPlaces,
} from '@/mock/edge-functions/category';
import type { Category } from '@/entities/types';

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
export interface GetCategoriesByWorkspaceResponse {
  categories: Array<{
    id: string;
    name: string;
    color: string;
    sequence: number;
    representativePlaceId: string | null;
    categoryPlaces: {
      categoryPlaces: Array<{
        id: string;
        name: string;
        addressName: string;
        roadAddressName: string | null;
        latitude: number;
        longitude: number;
        isRepresentative: boolean;
      }>;
    };
  }>;
  error?: string;
}

// 카테고리 장소 목록 조회 응답 타입
export interface GetCategoryPlacesResponse {
  categoryPlaceResponses: Array<{
    id: string;
    name: string;
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
    isRepresentative: boolean;
  }>;
  error?: string;
}

// 카테고리 API 서비스 객체 - 모든 카테고리 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const categoryApi = {
  /**
   * 카테고리 단일 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 카테고리 정보 또는 에러 메시지
   */
  getById: async (categoryId: string): Promise<GetCategoryResponse> => {
    // 현재: mock edge-function 호출
    // 백엔드 연동 시: return axios.get(`/api/categories/${categoryId}`)
    return await getCategoryById(categoryId);
  },

  /**
   * 카테고리 추가 API 호출
   * @param data 워크스페이스 ID, 이름, 색상
   * @returns 생성된 카테고리 또는 에러 메시지
   */
  add: async (data: AddCategoryRequest): Promise<AddCategoryResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.post('/api/categories', data)
    return await addCategory(data);
  },

  /**
   * 카테고리 수정 API 호출
   * @param id 카테고리 ID
   * @param data 수정할 필드 (이름, 색상)
   * @returns 에러 메시지 (없으면 성공)
   */
  update: async (id: string, data: UpdateCategoryRequest): Promise<UpdateCategoryResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.patch(`/api/categories/${id}`, data)
    return await updateCategory(id, data);
  },

  /**
   * 카테고리 삭제 API 호출 (연결된 장소 관계도 함께 삭제)
   * @param id 카테고리 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  delete: async (id: string): Promise<DeleteCategoryResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.delete(`/api/categories/${id}`)
    return await deleteCategory(id);
  },

  /**
   * 카테고리 순서 변경 API 호출 (드래그앤드롭 후)
   * @param workspaceIdentifier 워크스페이스 식별자
   * @param categories 카테고리 ID와 새 순서 배열 (0-based)
   * @returns 변경된 카테고리 순서 또는 에러 메시지
   */
  reorder: async (
    workspaceIdentifier: string, 
    categories: Array<{ id: string; sequence: number }>
  ): Promise<ReorderCategoriesResponse> => {
    // 현재: mock edge-function 호출 (0-based sequence)
    // 백엔드 연동 시:
    // const backendCategories = categories.map(c => ({ id: Number(c.id), sequence: c.sequence + 1 }));
    // return axios.post(`/api/workspaces/${workspaceIdentifier}/categories/sequence`, { categories: backendCategories });
    return await reorderCategories(workspaceIdentifier, categories);
  },

  /**
   * 대표 장소 설정 API 호출 (경로 생성용)
   * @param categoryId 카테고리 ID
   * @param placeId 장소 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  setRepresentativePlace: async (
    categoryId: string,
    placeId: string
  ): Promise<SetRepresentativePlaceResponse> => {
    // 현재: mock edge-function 호출
    // 백엔드 연동 시: return axios.put(`/api/categories/${categoryId}/representative-place`, { categoryPlaceId: placeId })
    return await setRepresentativePlace(categoryId, placeId);
  },

  /**
   * 대표 장소 해제 API 호출
   * @param categoryId 카테고리 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  unsetRepresentativePlace: async (
    categoryId: string
  ): Promise<UnsetRepresentativePlaceResponse> => {
    // 현재: mock edge-function 호출
    // 백엔드 연동 시: return axios.delete(`/api/categories/${categoryId}/representative-place`)
    return await unsetRepresentativePlace(categoryId);
  },

  /**
   * 워크스페이스별 카테고리 목록 조회 API 호출
   * @param workspaceIdentifier 워크스페이스 식별자
   * @returns 카테고리 목록과 장소 정보 또는 에러 메시지
   */
  getByWorkspace: async (
    workspaceIdentifier: string
  ): Promise<GetCategoriesByWorkspaceResponse> => {
    // 현재: mock edge-function 호출
    // 백엔드 연동 시: return axios.get(`/api/workspaces/${workspaceIdentifier}/categories`)
    return await getCategoriesByWorkspace(workspaceIdentifier);
  },

  /**
   * 카테고리 장소 목록 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 카테고리에 속한 장소 목록 또는 에러 메시지
   */
  getPlaces: async (
    categoryId: string
  ): Promise<GetCategoryPlacesResponse> => {
    // 현재: mock edge-function 호출
    // 백엔드 연동 시: return axios.get(`/api/categories/${categoryId}/places`)
    return await getCategoryPlaces(categoryId);
  },
};
