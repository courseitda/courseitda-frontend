import type {
  CreateSavedCategoryManualApiResponse,
  CreateSavedCategoryManualData,
  MySavedCategoriesData,
  SavedCategoryApiResponse,
  SavedCategoryDetailApiResponse,
  SavedCategoryDetailData,
  SavedCategoryPlaceApiResponse,
  UpdateSavedCategoryData,
} from '@/services/api/my-storage.types';

const CANNOT_PUBLISH_MESSAGE = '공유 카테고리를 복사한 직후에는 다시 게시할 수 없습니다.';

export const adaptSavedCategoryPlaces = (payload: SavedCategoryPlaceApiResponse[]) =>
  payload.map((place) => ({
    id: String(place.id),
    name: place.name,
    placeUrl: place.placeUrl,
    roadAddressName: place.roadAddressName,
    addressName: place.addressName,
    latitude: place.latitude,
    longitude: place.longitude,
  }));

export const adaptSavedCategory = (
  category: SavedCategoryApiResponse,
): UpdateSavedCategoryData['category'] => ({
  id: String(category.id),
  title: category.name,
  sourceType: category.sourceSharedCategoryId === null ? 'manual' : 'forked',
  forkedFromSharedCategoryId: category.sourceSharedCategoryId === null ? null : String(category.sourceSharedCategoryId),
  sourceAuthorName: null,
  sourceCategoryTitle: null,
  canPublish: category.canPublish,
  publishBlockedReason: category.canPublish ? null : CANNOT_PUBLISH_MESSAGE,
  modifiedAt: category.modifiedAt,
  placeCount: category.placeCount,
  places: [],
});

export const adaptMySavedCategories = (payload: SavedCategoryApiResponse[]): MySavedCategoriesData => ({
  categories: payload.map((category) => ({
    id: String(category.id),
    title: category.name,
    sourceType: category.sourceSharedCategoryId === null ? 'manual' : 'forked',
    forkedFromSharedCategoryId: category.sourceSharedCategoryId === null ? null : String(category.sourceSharedCategoryId),
    sourceAuthorName: null,
    sourceCategoryTitle: null,
    canPublish: category.canPublish,
    publishBlockedReason: category.canPublish ? null : CANNOT_PUBLISH_MESSAGE,
    modifiedAt: category.modifiedAt,
    placeCount: category.placeCount,
    places: [],
  })),
  hasNext: false,
  nextCursor: null,
});

export const adaptSavedCategoryDetail = (
  payload: SavedCategoryDetailApiResponse,
): SavedCategoryDetailData['category'] => ({
  id: String(payload.id),
  title: payload.name,
  sourceType: 'manual',
  forkedFromSharedCategoryId: null,
  sourceAuthorName: null,
  sourceCategoryTitle: null,
  canPublish: true,
  publishBlockedReason: null,
  modifiedAt: new Date().toISOString(),
  placeCount: payload.savedCategoryPlaces.length,
  places: adaptSavedCategoryPlaces(payload.savedCategoryPlaces),
});

export const adaptCreatedSavedCategory = (
  payload: CreateSavedCategoryManualApiResponse,
): CreateSavedCategoryManualData['category'] => ({
  id: String(payload.id),
  title: payload.name,
  places: [],
});
