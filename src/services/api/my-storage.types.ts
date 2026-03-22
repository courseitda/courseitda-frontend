// 내 보관함 API 응답/요청 DTO를 서비스 구현과 분리하여 재사용성과 가독성을 높임

export type SavedCategoryPlaceApiResponse = {
  id: number | string;
  // UserRequest: 보관 카테고리 장소 응답에 위치/주소/URL 필드 포함
  name: string;
  placeUrl: string;
  roadAddressName: string;
  addressName: string;
  latitude: number;
  longitude: number;
};

export type SavedCategoryApiResponse = {
  id: number | string;
  name: string;
  sourceSharedCategoryId: number | string | null;
  canPublish: boolean;
  modifiedAt: string;
  placeCount: number;
};

export type SavedCategoryPlacePayload = {
  name: string;
  placeUrl: string;
  roadAddressName: string | null;
  addressName: string;
  latitude: number;
  longitude: number;
};

export type CreateSavedCategoryRequest = {
  name: string;
};

export type RenameSavedCategoryRequest = {
  name: string;
};

export type SyncSavedCategoryPlacesRequest = {
  savedCategoryPlaces: Array<{
    savedCategoryPlaceId: string | null;
  } & SavedCategoryPlacePayload>;
};

export type CreateSavedCategoryManualRequest = {
  name: string;
  savedCategoryPlaces: SavedCategoryPlacePayload[];
};

export type UpdateSavedCategoryRequest = {
  name: string;
  savedCategoryPlaces: Array<{
    savedCategoryPlaceId: string | null;
  } & SavedCategoryPlacePayload>;
};

export type CreateSavedCategoryManualApiResponse = {
  id: number | string;
  name: string;
};

export type SavedCategoryPlacesApiResponse = {
  savedCategoryPlaces: SavedCategoryPlaceApiResponse[];
};

export type ForkSavedCategoryApiResponse = {
  id: number | string;
  name: string;
};

export type ContainsForkedSharedCategoriesApiResponse = {
  forkedSharedCategoryIds: Array<number | string>;
};

export type SavedCategoryDetailApiResponse = {
  id: number | string;
  name: string;
  savedCategoryPlaces: SavedCategoryPlaceApiResponse[];
};

// 내 보관 카테고리 목록 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface MySavedCategoriesData {
  categories: Array<{
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
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  }>;
  hasNext: boolean;
  nextCursor: number | null;
}

export interface CreateSavedCategoryData {
  category: {
    id: string;
    title: string;
    places: Array<{
      id: string;
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface CreateSavedCategoryManualData {
  category: {
    id: string;
    title: string;
    places: Array<{
      id: string;
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface ForkSavedCategoryData {
  category: {
    id: string;
    title: string;
  };
}

export interface UpdateSavedCategoryData {
  category: {
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
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface SavedCategoryDetailData {
  category: {
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
      name: string;
      placeUrl: string;
      roadAddressName: string;
      addressName: string;
      latitude: number;
      longitude: number;
    }>;
  };
}

export interface ContainsForkedSharedCategoriesData {
  forkedSharedCategoryIds: string[];
}
