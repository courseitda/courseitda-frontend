import { db } from '../db';
import type { Place, CategoryPlace, KakaoPlace, KakaoSearchResponse } from '@/entities/types';

// 장소 관련 Edge Functions
// 사용 위치: features/places (place-search-dialog, place-item), features/categories (category-card)

// 장소 검색 Edge Function - Kakao Local API를 통한 장소 검색
// 백엔드 연동 시: 백엔드 API 엔드포인트로 변경되며, 백엔드에서 Kakao API를 프록시
export const searchPlaces = async (input: {
  keyword: string;
  restApiKey: string;
}): Promise<{ searchedPlaces?: KakaoPlace[]; error?: string }> => {
  try {
    const { keyword, restApiKey } = input;

    // 빈 키워드 검증
    if (!keyword.trim()) {
      return { error: '검색어를 입력해주세요.' };
    }

    // Kakao REST API 키 검증
    if (!restApiKey) {
      return { error: 'Kakao REST API 키를 설정해주세요.' };
    }

    // Kakao Local API 엔드포인트 호출 - REST API 키 사용
    const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
    const response = await fetch(`${KAKAO_API_URL}?query=${encodeURIComponent(keyword)}`, {
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });

    // API 호출 실패 시 에러 반환
    if (!response.ok) {
      return { error: '장소 검색에 실패했습니다.' };
    }

    // 응답 파싱 및 검색 결과 반환
    const data: KakaoSearchResponse = await response.json();
    return { searchedPlaces: data.documents };
  } catch (error) {
    console.error('Search places error:', error);
    return { error: '장소 검색 중 오류가 발생했습니다.' };
  }
};

// 카테고리에 장소 추가 Edge Function - Kakao 검색 결과를 카테고리에 연결
export const addPlaceToCategory = async (input: {
  workspaceId: string;
  categoryId: string;
  kakaoPlace: KakaoPlace;
}): Promise<{ place?: Place; error?: string }> => {
  try {
    const { kakaoPlace, categoryId, workspaceId } = input;

    // 카테고리가 워크스페이스에 속하는지 검증
    const category = await db.categories.get(categoryId);
    if (!category || category.workspaceId !== workspaceId) {
      return { error: '유효하지 않은 카테고리입니다.' };
    }

    // 장소 이름과 주소로 기존 장소 검색 - 중복 저장 방지
    const allPlaces = await db.places.toArray();
    const existingPlace = allPlaces.find(
      (p) => p.name === kakaoPlace.place_name && p.addressName === kakaoPlace.address_name
    );

    let place: Place;

    if (existingPlace) {
      // 이미 다른 카테고리에 추가된 장소인 경우
      // 해당 카테고리에 이미 추가되었는지 확인
      const existingCategoryPlace = await db.categoryPlaces
        .where('[categoryId+placeId]')
        .equals([categoryId, existingPlace.id])
        .first();

      if (existingCategoryPlace) {
        return { error: '이미 이 카테고리에 추가된 장소입니다.' };
      }

      place = existingPlace;
    } else {
      // 새 장소 생성 - Kakao API 응답을 Place 타입으로 변환
      place = {
        id: crypto.randomUUID(),
        name: kakaoPlace.place_name,
        addressName: kakaoPlace.address_name,
        roadAddressName: kakaoPlace.road_address_name || null,
        latitude: parseFloat(kakaoPlace.y),
        longitude: parseFloat(kakaoPlace.x),
        placeUrl: kakaoPlace.place_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.places.add(place);
    }

    // 장소와 카테고리 연결 생성 (다대다 관계)
    const categoryPlace: CategoryPlace = {
      id: crypto.randomUUID(),
      categoryId,
      placeId: place.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.categoryPlaces.add(categoryPlace);

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return { place };
  } catch (error) {
    console.error('Add place to category error:', error);
    return { error: '장소 추가 중 오류가 발생했습니다.' };
  }
};

// 카테고리에서 장소 제거 Edge Function - 연결 해제 및 고아 장소 정리
export const removePlace = async (
  placeId: string,
  categoryId: string
): Promise<{ error?: string }> => {
  try {
    // 워크스페이스 ID 조회를 위한 카테고리 정보 가져오기
    const category = await db.categories.get(categoryId);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // 카테고리와 장소 연결 제거
    await db.categoryPlaces
      .where('[categoryId+placeId]')
      .equals([categoryId, placeId])
      .delete();

    // 다른 카테고리에서도 사용 중인지 확인
    const otherCategories = await db.categoryPlaces
      .where('placeId')
      .equals(placeId)
      .count();

    // 어떤 카테고리에도 속하지 않은 고아 장소는 삭제하여 DB 정리
    if (otherCategories === 0) {
      await db.places.delete(placeId);
    }

    // 대표 장소였다면 해제 처리
    if (category.representativePlaceId === placeId) {
      await db.categories.update(categoryId, {
        representativePlaceId: null,
        updatedAt: new Date().toISOString(),
      });
    }

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(category.workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Remove place error:', error);
    return { error: '장소 삭제 중 오류가 발생했습니다.' };
  }
};

// 카테고리별 장소 조회 - 카테고리에 속한 모든 장소 목록 반환
export const getPlacesByCategory = async (categoryId: string): Promise<Place[]> => {
  try {
    // 카테고리-장소 연결 테이블에서 해당 카테고리의 연결 정보 조회
    const categoryPlaces = await db.categoryPlaces
      .where('categoryId')
      .equals(categoryId)
      .toArray();

    // 장소 ID 목록 추출
    const placeIds = categoryPlaces.map(cp => cp.placeId);
    // 일괄 조회로 성능 최적화
    const places = await db.places.bulkGet(placeIds);

    // undefined 제거 (삭제된 장소 필터링)
    return places.filter((p): p is Place => p !== undefined);
  } catch (error) {
    console.error('Get places by category error:', error);
    return [];
  }
};
