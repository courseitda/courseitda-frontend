export type User = {
  id: string;
  nickname: string;
  email: string;
  password: string; // hashed (mock)
  createdAt: string;
};

export type Workspace = {
  id: string;
  ownerId: string;
  title: string;
  headcount?: number;
  date?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  sortOrder: number;
  representativePlaceId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Place = {
  id: string;
  kakaoPlaceId: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  phone?: string;
  url?: string;
  createdAt: string;
};

export type CategoryPlace = {
  id: string;
  placeId: string;
  categoryId: string;
  createdAt: string;
};

// Kakao API response types
export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string; // longitude
  y: string; // latitude
};

export type KakaoSearchResponse = {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
};
