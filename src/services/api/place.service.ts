import {apiClient} from '@/lib/axios';
import type {Place, SearchedPlace} from '@/entities/types';
import type {ApiResponse} from '@/types/api';
import {BackendErrorCode} from '@/shared/utils/error-message';
import {MESSAGES} from '@/shared/constants/messages';
import {toError, toSuccess} from './http';

// 장소 관련 백엔드 엔드포인트 상수 정의
const PLACE_SEARCH_ENDPOINT = '/api/places/search';
const CATEGORY_PLACES_ENDPOINT = (categoryId: string) => `/api/categories/${categoryId}/places`;

// 장소 검색 요청 파라미터 타입
export interface SearchPlacesRequest {
    keyword: string;      // 검색 키워드
}

// 장소 검색 응답 타입
export interface SearchPlacesResponse {
    searchedPlaces?: SearchedPlace[];  // 검색된 장소 목록
    error?: string;                    // 에러 메시지
}

type SearchPlacesApiResponse = {
    searchedPlaces: Array<{
        name: string;
        url: string;
        roadAddressName: string | null;
        addressName: string;
        latitude: number;
        longitude: number;
    }>;
};

// 장소 추가 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface AddPlaceToCategoryRequest {
    name: string;
    placeUrl: string;
    roadAddressName: string | null;
    addressName: string;
    lat: number;
    lng: number;
}

type AddPlaceApiRequest = {
    name: string;
    placeUrl: string;
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
    placeUrl: string;        // 장소 상세 URL
    roadAddressName: string | null; // 도로명 주소
    addressName: string;     // 지번 주소
    latitude: number;        // 위도
    longitude: number;       // 경도
}

type AddPlaceApiResponse = {
    id: number | string;
    placeId: number | string;
    name: string;
    placeUrl: string;
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
        placeUrl: string;
        addressName: string;
        roadAddressName: string | null;
        latitude: number;
        longitude: number;
        isRepresentative: boolean;
    }>;
};

// 현재 시간을 ISO 포맷으로 반환 - 백엔드에서 타임스탬프를 제공하지 않을 때 폴백 값으로 사용
const fallbackTimestamp = () => new Date().toISOString();

// 백엔드 API 응답을 프론트엔드 Place 타입으로 변환 - ID를 문자열로 정규화하고 누락된 필드 보완
const adaptPlace = (payload: {
    id: number | string;
    name: string;
    placeUrl: string | null;
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
}): Place => ({
    id: String(payload.id),
    name: payload.name,
    placeUrl: payload.placeUrl ?? '',
    addressName: payload.addressName,
    roadAddressName: payload.roadAddressName,
    latitude: payload.latitude,
    longitude: payload.longitude,
    createdAt: fallbackTimestamp(),
    updatedAt: fallbackTimestamp(),
});

// 장소 API 서비스 객체 - 모든 장소 관련 API 호출을 중앙 관리
export const placeApi = {
    /**
     * 장소 검색 API 호출 - 백엔드 프록시를 통한 Naver 검색
     * @param data 검색 키워드
     * @returns 검색된 장소 목록 또는 에러 메시지
     */
    search: async (data: SearchPlacesRequest): Promise<SearchPlacesResponse> => {
        try {
            // 백엔드 장소 검색 엔드포인트 호출 - Naver Places API 프록시
            const response = await apiClient.get<SearchPlacesApiResponse>(PLACE_SEARCH_ENDPOINT, {
                params: {keyword: data.keyword},
            });

            // 백엔드 응답을 프론트엔드 SearchedPlace 타입으로 정규화
            return {
                searchedPlaces: response.data.searchedPlaces.map((place, index) => ({
                    id: `${place.latitude}-${place.longitude}-${index}`,
                    name: place.name,
                    placeUrl: place.url,
                    addressName: place.addressName,
                    roadAddressName: place.roadAddressName ?? null,
                    latitude: place.latitude,
                    longitude: place.longitude,
                })),
            };
        } catch (error) {
            // 검색 실패 시 에러 메시지 포맷팅하여 반환
            const apiError = toError(
                error,
                BackendErrorCode.NAVER_PLACE_SEARCH_ERROR,
                '장소 검색에 실패했습니다.',
            );
            return {error: apiError.error?.message};
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
        // 프론트엔드 요청 형식을 백엔드 API 스펙에 맞게 변환 - 좌표 필드명 통일(lat/lng -> latitude/longitude)
        const requestBody: AddPlaceApiRequest = {
            name: data.name,
            // UserRequest: placeUrl 필수 필드 전달
            placeUrl: data.placeUrl,
            roadAddressName: data.roadAddressName,
            addressName: data.addressName,
            latitude: data.lat,
            longitude: data.lng,
        };

        try {
            // 카테고리에 장소 추가 요청 - 인증 토큰 포함
            const response = await apiClient.post<AddPlaceApiResponse>(
                CATEGORY_PLACES_ENDPOINT(categoryId),
                requestBody,
                {headers: {Authorization: `Bearer ${token}`}},
            );

            // 백엔드 응답을 프론트엔드 타입으로 변환하여 성공 응답 반환 - ID는 문자열로 정규화
            return toSuccess<AddPlaceToCategoryData>({
                id: String(response.data.id),
                placeId: String(response.data.placeId),
                name: response.data.name,
                placeUrl: response.data.placeUrl,
                roadAddressName: response.data.roadAddressName,
                addressName: response.data.addressName,
                latitude: response.data.latitude,
                longitude: response.data.longitude,
            });
        } catch (error) {
            // 장소 추가 실패 시 에러 응답 반환 - 주로 검증 실패가 원인
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
            // 카테고리에서 장소 제거 요청 - 백엔드에서 자동으로 고아 장소(다른 카테고리에서 참조되지 않는 장소) 삭제
            await apiClient.delete(`${CATEGORY_PLACES_ENDPOINT(categoryId)}/${categoryPlaceId}`);
            return {};
        } catch (error) {
            // 장소 제거 실패 시 에러 메시지 반환 - 주로 존재하지 않는 장소를 삭제하려고 할 때 발생
            const apiError = toError(
                error,
                BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
                MESSAGES.place.removeFailed,
            );
            return {error: apiError.error?.message};
        }
    },

    /**
     * 카테고리별 장소 목록 조회 API 호출
     * @param categoryId 카테고리 ID
     * @returns 장소 배열
     */
    getByCategory: async (categoryId: string): Promise<Place[]> => {
        try {
            // 특정 카테고리에 속한 모든 장소 목록 조회
            const response = await apiClient.get<CategoryPlacesApiResponse>(
                CATEGORY_PLACES_ENDPOINT(categoryId),
            );

            // 백엔드 응답을 프론트엔드 Place 타입으로 변환 - 타임스탬프 등 누락된 필드 보완
            return response.data.categoryPlaceResponses.map((place) =>
                adaptPlace({
                    id: place.id,
                    name: place.name,
                    placeUrl: place.placeUrl,
                    addressName: place.addressName,
                    roadAddressName: place.roadAddressName,
                    latitude: place.latitude,
                    longitude: place.longitude,
                }),
            );
        } catch (error) {
            // 장소 목록 조회 실패 시 예외 발생 - React Query에서 에러 상태로 처리
            const apiError = toError(
                error,
                BackendErrorCode.CATEGORY_PLACE_NOT_FOUND,
                MESSAGES.place.searchFailed,
            );
            throw new Error(apiError.error?.message ?? MESSAGES.place.searchFailed);
        }
    },
};
