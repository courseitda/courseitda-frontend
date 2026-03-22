import type { Category, Place } from '@/entities/types';

export type MapPlaceEntry = {
  category: Category;
  place: Place;
  categoryPlaceId: string;
  isRepresentative: boolean;
};

export type MarkerMapItem = {
  marker: naver.maps.Marker;
  openInfoWindow: () => void;
};
