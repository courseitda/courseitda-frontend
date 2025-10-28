import { apiClient } from '@/lib/axios';
import type { Place, KakaoPlace } from '@/entities/types';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { toSuccess, toError } from './http';

// 장소 관련 백엔드 엔드포인트 상수 정의
const PLACE_SEARCH_ENDPOINT = '/api/places/search';
const CATEGORY_PLACES_ENDPOINT = (categoryId: string) => `/api/categories/${categoryId}/places`;

// 장소 검색 요청 파라미터 타입
export interface SearchPlacesRequest {
  keyword: string;      // 검색 키워드
  restApiKey?: string;  // Kakao REST API 키 (백엔드 연동 시 사용하지 않음)
}

// 장소 검색 응답 타입
export interface SearchPlacesResponse {
  searchedPlaces?: KakaoPlace[];  // 검색된 장소 목록
  error?: string;                 // 에러 메시지
}

type SearchPlacesApiResponse = {
  searchedPlaces: Array<{
    name: string;
    roadAddressName: string | null;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

// 장소 추가 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface AddPlaceToCategoryRequest {
  name: string;
  roadAddressName: string | null;
  addressName: string;
  lat: number;
  lng: number;
}

type AddPlaceApiRequest = {
  name: string;
  roadAddressName?: string | null;
  addressName: string;
  latitude: number;
  longitude: number;
};

// 장소 추가 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface AddPlaceToCategoryData {
  id: string;              // 카테고리 장소 ID
  placeId: string;         // 장소 ID
  name: string;            // 장소 이름
  roadAddressName: string | null; // 도로명 주소
  addressName: string;     // 지번 주소
  latitude: number;        // 위도
  longitude: number;       // 경도
}

type AddPlaceApiResponse = {
  id: number | string;
  placeId: number | string;
  name: string;
  roadAddressName: string | null;
  addressName: string;
  latitude: number;
  longitude: number;
};

// 장소 제거 응답 타입
export interface RemovePlaceResponse {
  error?: string;
}

type CategoryPlacesApiResponse = {
  categoryPlaceResponses: Array<{
    id: number | string;
    name: string;
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
    isRepresentative: boolean;
  }>;
};

const fallbackTimestamp = () => new Date().toISOString();

const adaptPlace = (payload: {
  id: number | string;
  name: string;
  addressName: string;
  roadAddressName: string | null;
  latitude: number;
  longitude: number;
}): Place => ({
  id: String(payload.id),
  name: payload.name,
  addressName: payload.addressName,
  roadAddressName: payload.roadAddressName,
  latitude: payload.latitude,
  longitude: payload.longitude,
  placeUrl: null,
  createdAt: fallbackTimestamp(),
  updatedAt: fallbackTimestamp(),
});

// 장소 API 서비스 객체 - 모든 장소 관련 API 호출을 중앙 관리
export const placeApi = {
  /**
   * 장소 검색 API 호출 - 백엔드 프록시를 통한 Kakao 검색
   * @param data 검색 키워드
   * @returns 검색된 장소 목록 또는 에러 메시지
   */
  search: async (data: SearchPlacesRequest): Promise<SearchPlacesResponse> => {
    try {
      const response = await apiClient.get<SearchPlacesApiResponse>(PLACE_SEARCH_ENDPOINT, {
        params: { keyword: data.keyword },
      });

      return {
        searchedPlaces: response.data.searchedPlaces.map((place, index) => ({
          id: String(index),
          place_name: place.name,
          address_name: place.addressName,
          road_address_name: place.roadAddressName ?? '',
          phone: '',
          place_url: '',
          x: String(place.longitude),
          y: String(place.latitude),
        })),
      };
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.KAKAO_PLACE_SEARCH_ERROR,
        '장소 검색에 실패했습니다.',
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리에 장소 추가 API 호출
   * @param token 인증 토큰
   * @param categoryId 카테고리 ID
   * @param data 장소 정보 (name, roadAddressName, addressName, lat, lng)
   * @returns API 응답 (성공 시 카테고리 장소 정보, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/categories/{categoryId}/places
   */
  addToCategory: async (
    token: string,
    categoryId: string,
    data: AddPlaceToCategoryRequest,
  ): Promise<ApiResponse<AddPlaceToCategoryData>> => {
    const requestBody: AddPlaceApiRequest = {
      name: data.name,
      roadAddressName: data.roadAddressName,
      addressName: data.addressName,
      latitude: data.lat,
      longitude: data.lng,
    };

    try {
      const response = await apiClient.post<AddPlaceApiResponse>(
        CATEGORY_PLACES_ENDPOINT(categoryId),
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<AddPlaceToCategoryData>({
        id: String(response.data.id),
        placeId: String(response.data.placeId),
        name: response.data.name,
        roadAddressName: response.data.roadAddressName,
        addressName: response.data.addressName,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        '장소 정보를 확인해주세요.',
      );
    }
  },

  /**
   * 카테고리에서 장소 제거 API 호출 (고아 장소 자동 삭제)
   * @param categoryId 카테고리 ID
   * @param categoryPlaceId 카테고리 장소 ID
   * @returns 에러 메시지 (없으면 성공)
   *
   * 백엔드 엔드포인트: DELETE /api/categories/{categoryId}/places/{categoryPlaceId}
   */
  remove: async (categoryId: string, categoryPlaceId: string): Promise<RemovePlaceResponse> => {
    try {
      await apiClient.delete(`${CATEGORY_PLACES_ENDPOINT(categoryId)}/${categoryPlaceId}`);
      return {};
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
        '장소 삭제에 실패했습니다.',
      );
      return { error: apiError.error?.message };
    }
  },

  /**
   * 카테고리별 장소 목록 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 장소 배열
   */
  getByCategory: async (categoryId: string): Promise<Place[]> => {
    try {
      const response = await apiClient.get<CategoryPlacesApiResponse>(
        CATEGORY_PLACES_ENDPOINT(categoryId),
      );

      return response.data.categoryPlaceResponses.map((place) =>
        adaptPlace({
          id: place.id,
          name: place.name,
          addressName: place.addressName,
          roadAddressName: place.roadAddressName,
          latitude: place.latitude,
          longitude: place.longitude,
        }),
      );
    } catch (error) {
      const apiError = toError(
        error,
        BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
        '장소 목록을 불러올 수 없습니다.',
      );
      throw new Error(apiError.error?.message ?? '장소 목록을 불러올 수 없습니다.');
    }
  },
};
