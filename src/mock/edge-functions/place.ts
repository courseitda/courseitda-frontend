import { db } from '../db';
import type { Place, CategoryPlace, KakaoPlace } from '@/entities/types';

export const addPlaceToCategory = async (input: {
  workspaceId: string;
  categoryId: string;
  kakaoPlace: KakaoPlace;
}): Promise<{ place?: Place; error?: string }> => {
  try {
    const { kakaoPlace, categoryId, workspaceId } = input;

    // Verify category exists and belongs to workspace
    const category = await db.categories.get(categoryId);
    if (!category || category.workspaceId !== workspaceId) {
      return { error: '유효하지 않은 카테고리입니다.' };
    }

    // Check if place already exists in this workspace
    const existingPlace = await db.places
      .where('kakaoPlaceId')
      .equals(kakaoPlace.id)
      .first();

    let place: Place;

    if (existingPlace) {
      // Check if already in this category
      const existingCategoryPlace = await db.categoryPlaces
        .where('[categoryId+placeId]')
        .equals([categoryId, existingPlace.id])
        .first();

      if (existingCategoryPlace) {
        return { error: '이미 이 카테고리에 추가된 장소입니다.' };
      }

      place = existingPlace;
    } else {
      // Create new place
      place = {
        id: crypto.randomUUID(),
        kakaoPlaceId: kakaoPlace.id,
        name: kakaoPlace.place_name,
        address: kakaoPlace.address_name,
        roadAddress: kakaoPlace.road_address_name,
        lat: parseFloat(kakaoPlace.y),
        lng: parseFloat(kakaoPlace.x),
        phone: kakaoPlace.phone || undefined,
        url: kakaoPlace.place_url || undefined,
        createdAt: new Date().toISOString(),
      };

      await db.places.add(place);
    }

    // Link place to category
    const categoryPlace: CategoryPlace = {
      id: crypto.randomUUID(),
      placeId: place.id,
      categoryId,
      createdAt: new Date().toISOString(),
    };

    await db.categoryPlaces.add(categoryPlace);

    return { place };
  } catch (error) {
    console.error('Add place to category error:', error);
    return { error: '장소 추가 중 오류가 발생했습니다.' };
  }
};

export const removePlace = async (
  placeId: string,
  categoryId: string
): Promise<{ error?: string }> => {
  try {
    // Remove from category
    await db.categoryPlaces
      .where('[categoryId+placeId]')
      .equals([categoryId, placeId])
      .delete();

    // Check if place is used in any other category
    const otherCategories = await db.categoryPlaces
      .where('placeId')
      .equals(placeId)
      .count();

    // If not used anywhere else, delete the place
    if (otherCategories === 0) {
      await db.places.delete(placeId);
    }

    // If this was a representative place, unset it
    const category = await db.categories.get(categoryId);
    if (category?.representativePlaceId === placeId) {
      await db.categories.update(categoryId, {
        representativePlaceId: null,
        updatedAt: new Date().toISOString(),
      });
    }

    return {};
  } catch (error) {
    console.error('Remove place error:', error);
    return { error: '장소 삭제 중 오류가 발생했습니다.' };
  }
};

export const getPlacesByCategory = async (categoryId: string): Promise<Place[]> => {
  try {
    const categoryPlaces = await db.categoryPlaces
      .where('categoryId')
      .equals(categoryId)
      .toArray();

    const placeIds = categoryPlaces.map(cp => cp.placeId);
    const places = await db.places.bulkGet(placeIds);

    return places.filter((p): p is Place => p !== undefined);
  } catch (error) {
    console.error('Get places by category error:', error);
    return [];
  }
};
