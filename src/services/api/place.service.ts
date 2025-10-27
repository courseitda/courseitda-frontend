// 장소 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화

import {
  searchPlaces as searchPlacesMock,
  addPlaceToCategory,
  removePlace,
  getPlacesByCategory,
} from '@/mock/edge-functions/place';
import type { Place, KakaoPlace } from '@/entities/types';
import type { ApiResponse } from '@/types/api';

// 장소 검색 요청 파라미터 타입
export interface SearchPlacesRequest {
  keyword: string;      // 검색 키워드
  restApiKey: string;   // Kakao REST API 키 (현재 Mock에서만 필요, 백엔드 연동 시 제거)
}

// 장소 검색 응답 타입
export interface SearchPlacesResponse {
  searchedPlaces?: KakaoPlace[];  // 검색된 장소 목록
  error?: string;                 // 에러 메시지
}

// 장소 추가 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface AddPlaceToCategoryRequest {
  name: string;
  roadAddressName: string | null;
  addressName: string;
  lat: number;
  lng: number;
}

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

// 장소 제거 응답 타입
export interface RemovePlaceResponse {
  error?: string;
}

// 장소 API 서비스 객체 - 모든 장소 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const placeApi = {
  /**
   * 장소 검색 API 호출 - Kakao Local API를 통한 키워드 검색
   * @param data 검색 키워드, REST API 키
   * @returns 검색된 장소 목록 또는 에러 메시지
   */
  search: async (data: SearchPlacesRequest): Promise<SearchPlacesResponse> => {
    // 현재: mock edge-function 호출 (클라이언트에서 직접 Kakao API 호출)
    // 추후 백엔드 연동 시: return axios.get(`/api/places/search?keyword=${encodeURIComponent(data.keyword)}`)
    // 백엔드 연동 시에는 restApiKey 파라미터 제거 (백엔드에서 관리)
    return await searchPlacesMock(data);
  },

  /**
   * 카테고리에 장소 추가 API 호출
   * @param token 인증 토큰
   * @param categoryId 카테고리 ID
   * @param data 장소 정보 (name, roadAddressName, addressName, lat, lng)
   * @returns API 응답 (성공 시 카테고리 장소 정보, 실패 시 에러 정보)
   * 
   * 백엔드 엔드포인트: POST /api/categories/{categoryId}/places
   * 백엔드 요청 예시: { name, roadAddressName, addressName, lat, lng }
   * 백엔드 응답 예시: { id, placeId, name, roadAddressName, addressName, latitude, longitude }
   */
  addToCategory: async (
    token: string,
    categoryId: string, 
    data: AddPlaceToCategoryRequest
  ): Promise<ApiResponse<AddPlaceToCategoryData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await addPlaceToCategory({
      token,
      categoryId,
      placeData: data,
    });

    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.post(`/api/categories/${categoryId}/places`, data, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return { success: true, data: response.data };

    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'ADD_PLACE_FAILED',
          message: mockResponse.error,
        },
      };
    }

    return {
      success: true,
      data: {
        id: mockResponse.id!,
        placeId: mockResponse.placeId!,
        name: mockResponse.name!,
        roadAddressName: mockResponse.roadAddressName!,
        addressName: mockResponse.addressName!,
        latitude: mockResponse.latitude!,
        longitude: mockResponse.longitude!,
      },
    };
  },

  /**
   * 카테고리에서 장소 제거 API 호출 (고아 장소 자동 삭제)
   * @param placeId 장소 ID
   * @param categoryId 카테고리 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  remove: async (placeId: string, categoryId: string): Promise<RemovePlaceResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.delete(`/api/categories/${categoryId}/places/${placeId}`)
    return await removePlace(placeId, categoryId);
  },

  /**
   * 카테고리별 장소 목록 조회 API 호출
   * @param categoryId 카테고리 ID
   * @returns 장소 배열
   */
  getByCategory: async (categoryId: string): Promise<Place[]> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.get(`/api/categories/${categoryId}/places`)
    return await getPlacesByCategory(categoryId);
  },
};

