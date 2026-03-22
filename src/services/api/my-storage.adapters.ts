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
  modifiedAt: category.modifiedAt,
  placeCount: category.placeCount,
  places: [],
});

export const adaptMySavedCategories = (payload: SavedCategoryApiResponse[]): MySavedCategoriesData => ({
  categories: payload.map((category) => ({
    id: String(category.id),
    title: category.name,
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
