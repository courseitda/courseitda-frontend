import { db } from '../db';
import type { Category } from '@/entities/types';

// 카테고리 단일 조회 Edge Function - ID로 카테고리 상세 정보 조회
// 백엔드 연동 시: GET /api/categories/{categoryId}
export const getCategoryById = async (
  categoryId: string
): Promise<{ category?: Category; error?: string }> => {
  try {
    // 카테고리 조회
    const category = await db.categories.get(categoryId);
    
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }
    
    return { category };
  } catch (error) {
    console.error('Get category by id error:', error);
    return { error: '카테고리 조회 중 오류가 발생했습니다.' };
  }
};

// 카테고리 추가 Edge Function - 워크스페이스에 새 카테고리 생성
// 백엔드 연동 시: POST /api/workspaces/{workspaceIdentifier}/categories
export const addCategory = async (input: {
  workspaceIdentifier: string;
  name: string;
  color: string;
}): Promise<{ category?: Category; error?: string }> => {
  try {
    // 워크스페이스 존재 여부 확인
    const workspace = await db.workspaces.where('identifier').equals(input.workspaceIdentifier).first();
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 카테고리 이름 필수 입력 검증
    if (!input.name || input.name.trim().length === 0) {
      return { error: '카테고리 이름을 입력해주세요.' };
    }

    // 백엔드 검증: 이름 최대 10자
    if (input.name.trim().length > 10) {
      return { error: '카테고리 이름은 최대 10자까지 가능합니다.' };
    }

    // 색상 형식 검증 (#RRGGBB)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(input.color)) {
      return { error: '색상은 #RRGGBB 형식이어야 합니다.' };
    }

    // 현재 카테고리 개수 조회하여 새 카테고리의 순서 결정
    const existingCategories = await db.categories
      .where('workspaceId')
      .equals(workspace.id)
      .toArray();

    const sequence = existingCategories.length;

    // 카테고리 생성 및 DB 저장
    const category: Category = {
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      name: input.name.trim(),
      color: input.color,
      sequence,
      representativePlaceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.categories.add(category);

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(workspace.id, {
      updatedAt: new Date().toISOString(),
    });

    return { category };
  } catch (error) {
    console.error('Add category error:', error);
    return { error: '카테고리 추가 중 오류가 발생했습니다.' };
  }
};

// 카테고리 수정 Edge Function - 이름이나 색상 변경
export const updateCategory = async (
  id: string,
  updates: Partial<Pick<Category, 'name' | 'color'>>
): Promise<{ error?: string }> => {
  try {
    // 카테고리 존재 여부 확인
    const category = await db.categories.get(id);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // 이름 변경 시 빈 문자열 방지
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      return { error: '카테고리 이름을 입력해주세요.' };
    }

    // 카테고리 정보 업데이트
    await db.categories.update(id, {
      ...updates,
      name: updates.name?.trim(),
      updatedAt: new Date().toISOString(),
    });

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(category.workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Update category error:', error);
    return { error: '카테고리 수정 중 오류가 발생했습니다.' };
  }
};

// 카테고리 삭제 Edge Function - 카테고리와 연결된 장소 관계도 함께 삭제
export const deleteCategory = async (id: string): Promise<{ error?: string }> => {
  try {
    // 카테고리 존재 여부 확인
    const category = await db.categories.get(id);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // 카테고리와 연결된 장소 관계 삭제 (cascade delete)
    await db.categoryPlaces.where('categoryId').equals(id).delete();
    await db.categories.delete(id);

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(category.workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Delete category error:', error);
    return { error: '카테고리 삭제 중 오류가 발생했습니다.' };
  }
};

// 카테고리 순서 변경 Edge Function - 드래그앤드롭 후 새 순서를 DB에 반영
// 백엔드 연동 시: POST /api/workspaces/{workspaceIdentifier}/categories/sequence
export const reorderCategories = async (
  workspaceIdentifier: string,
  categories: Array<{ id: string; sequence: number }>
): Promise<{ categories?: Array<{ id: string; sequence: number }>; error?: string }> => {
  try {
    // 워크스페이스 존재 여부 확인
    const workspace = await db.workspaces.where('identifier').equals(workspaceIdentifier).first();
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 각 카테고리의 sequence 업데이트
    const updates = categories.map((category) =>
      db.categories.update(category.id, {
        sequence: category.sequence,
        updatedAt: new Date().toISOString(),
      })
    );

    // 모든 업데이트를 병렬로 실행하여 성능 향상
    await Promise.all(updates);

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(workspace.id, {
      updatedAt: new Date().toISOString(),
    });

    // 백엔드 API 스펙에 맞춰 변경된 순서 반환
    return { categories };
  } catch (error) {
    console.error('Reorder categories error:', error);
    return { error: '카테고리 순서 변경 중 오류가 발생했습니다.' };
  }
};

// 대표 장소 설정 Edge Function - 경로 생성에 사용할 장소를 카테고리별로 지정
// 백엔드 연동 시: PUT /api/categories/{categoryId}/representative-place
export const setRepresentativePlace = async (
  categoryId: string,
  placeId: string
): Promise<{ error?: string }> => {
  try {
    // 카테고리 존재 여부 확인
    const category = await db.categories.get(categoryId);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // 장소가 카테고리에 속하는지 검증
    const categoryPlace = await db.categoryPlaces
      .where('[categoryId+placeId]')
      .equals([categoryId, placeId])
      .first();

    if (!categoryPlace) {
      return { error: '해당 카테고리에 속하지 않은 장소입니다.' };
    }

    // 대표 장소 설정
    await db.categories.update(categoryId, {
      representativePlaceId: placeId,
      updatedAt: new Date().toISOString(),
    });

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(category.workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Set representative place error:', error);
    return { error: '대표 장소 설정 중 오류가 발생했습니다.' };
  }
};

// 대표 장소 해제 Edge Function - 카테고리의 대표 장소 지정 해제
// 백엔드 연동 시: DELETE /api/categories/{categoryId}/representative-place
export const unsetRepresentativePlace = async (
  categoryId: string
): Promise<{ error?: string }> => {
  try {
    // 카테고리 존재 여부 확인
    const category = await db.categories.get(categoryId);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // 대표 장소 해제 (null로 설정)
    await db.categories.update(categoryId, {
      representativePlaceId: null,
      updatedAt: new Date().toISOString(),
    });

    // 워크스페이스 수정 시각 업데이트 - 변경 이력 추적
    await db.workspaces.update(category.workspaceId, {
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Unset representative place error:', error);
    return { error: '대표 장소 해제 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스별 카테고리 목록 조회 Edge Function - 워크스페이스의 모든 카테고리와 장소 정보 조회
// 백엔드 연동 시: GET /api/workspaces/{workspaceIdentifier}/categories
export const getCategoriesByWorkspace = async (
  workspaceIdentifier: string
): Promise<{ 
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
}> => {
  try {
    // 워크스페이스 존재 여부 확인
    const workspace = await db.workspaces.where('identifier').equals(workspaceIdentifier).first();
    if (!workspace) {
      return { categories: [], error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 워크스페이스의 모든 카테고리 조회 (sequence 순으로 정렬)
    const categories = await db.categories
      .where('workspaceId')
      .equals(workspace.id)
      .sortBy('sequence');

    // 각 카테고리의 장소 정보 조회
    const categoriesWithPlaces = await Promise.all(
      categories.map(async (category) => {
        // 카테고리에 속한 장소 연결 정보 조회
        const categoryPlaces = await db.categoryPlaces
          .where('categoryId')
          .equals(category.id)
          .toArray();

        // 장소 정보 조회
        const placeIds = categoryPlaces.map(cp => cp.placeId);
        const places = await db.places.bulkGet(placeIds);

        // 백엔드 API 스펙에 맞춰 응답 형식 변환
        const categoryPlaceResponses = places
          .filter((place): place is NonNullable<typeof place> => place !== undefined)
          .map(place => ({
            id: categoryPlaces.find(cp => cp.placeId === place.id)?.id || '',
            name: place.name,
            addressName: place.addressName,
            roadAddressName: place.roadAddressName,
            latitude: place.latitude,
            longitude: place.longitude,
            isRepresentative: category.representativePlaceId === place.id,
          }));

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          sequence: category.sequence,
          representativePlaceId: category.representativePlaceId,
          categoryPlaces: {
            categoryPlaces: categoryPlaceResponses,
          },
        };
      })
    );

    return { categories: categoriesWithPlaces };
  } catch (error) {
    console.error('Get categories by workspace error:', error);
    return { categories: [], error: '카테고리 목록 조회 중 오류가 발생했습니다.' };
  }
};

// 카테고리 장소 목록 조회 Edge Function - 백엔드 API 스펙에 맞는 응답 형식
// 백엔드 연동 시: GET /api/categories/{categoryId}/places
export const getCategoryPlaces = async (
  categoryId: string
): Promise<{ 
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
}> => {
  try {
    // 카테고리 존재 여부 확인
    const category = await db.categories.get(categoryId);
    if (!category) {
      return { categoryPlaceResponses: [], error: '카테고리를 찾을 수 없습니다.' };
    }

    // 카테고리에 속한 장소 연결 정보 조회
    const categoryPlaces = await db.categoryPlaces
      .where('categoryId')
      .equals(categoryId)
      .toArray();

    // 장소 정보 조회
    const placeIds = categoryPlaces.map(cp => cp.placeId);
    const places = await db.places.bulkGet(placeIds);

    // 백엔드 API 스펙에 맞춰 응답 형식 변환
    const categoryPlaceResponses = places
      .filter((place): place is NonNullable<typeof place> => place !== undefined)
      .map(place => ({
        id: categoryPlaces.find(cp => cp.placeId === place.id)?.id || '',
        name: place.name,
        addressName: place.addressName,
        roadAddressName: place.roadAddressName,
        latitude: place.latitude,
        longitude: place.longitude,
        isRepresentative: category.representativePlaceId === place.id,
      }));

    return { categoryPlaceResponses };
  } catch (error) {
    console.error('Get category places error:', error);
    return { categoryPlaceResponses: [], error: '카테고리 장소 목록 조회 중 오류가 발생했습니다.' };
  }
};