import type { SavedCategory } from '@/entities/types';

export type SavedCategoryPayload = {
  id: string;
  title: string;
  sourceType: 'manual' | 'forked';
  forkedFromSharedCategoryId: string | null;
  sourceAuthorName: string | null;
  sourceCategoryTitle: string | null;
  canPublish: boolean;
  publishBlockedReason: string | null;
  modifiedAt: string;
  placeCount: number;
  places: Array<{
    id: string;
    // UserRequest: 보관 카테고리 장소 응답에 위치/주소/URL 필드 포함
    name: string;
    placeUrl: string;
    roadAddressName: string;
    addressName: string;
    latitude: number;
    longitude: number;
  }>;
};

// UserRequest: 내 보관함 API 응답을 화면에서 사용하는 SavedCategory 타입으로 보정
export const toSavedCategoryEntity = (payload: SavedCategoryPayload): SavedCategory => ({
  id: payload.id,
  title: payload.title,
  sourceType: payload.sourceType,
  forkedFromSharedCategoryId: payload.forkedFromSharedCategoryId,
  sourceAuthorName: payload.sourceAuthorName,
  sourceCategoryTitle: payload.sourceCategoryTitle,
  canPublish: payload.canPublish,
  publishBlockedReason: payload.publishBlockedReason,
  updatedAt: payload.modifiedAt,
  placeCount: payload.placeCount,
  places: payload.places.map((place) => ({
    id: place.id,
    name: place.name,
    addressName: place.addressName,
    // UserRequest: 보관 카테고리 장소 응답 필드 확장 반영
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
});
