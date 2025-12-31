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
};
