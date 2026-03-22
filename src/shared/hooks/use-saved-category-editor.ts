import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { placeApi } from '@/services/api';
import type { SavedCategory, SearchedPlace } from '@/entities/types';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';

type UpdateSavedCategoryInput = {
  id: string;
  title: string;
  originalPlaceIds: string[];
  places: SearchedPlace[];
};

type UpdateSavedCategoryMutation = {
  mutateAsync: (input: UpdateSavedCategoryInput) => Promise<unknown>;
  isPending: boolean;
};

const toEditablePlace = (place: SavedCategory['places'][number]): SearchedPlace => ({
  id: place.id,
  name: place.name,
  placeUrl: place.placeUrl,
  roadAddressName: place.roadAddressName,
  addressName: place.addressName,
  latitude: place.latitude,
  longitude: place.longitude,
});

const arePlacesEqual = (left: SearchedPlace, right: SavedCategory['places'][number]) =>
  left.id === right.id
  && left.name === right.name
  && left.placeUrl === right.placeUrl
  && left.roadAddressName === right.roadAddressName
  && left.addressName === right.addressName
  && left.latitude === right.latitude
  && left.longitude === right.longitude;

/**
 * 내 카테고리 상세 화면의 편집 상태와 액션을 관리하는 훅
 * UserRequest: MyCategoryDetail의 이름 변경/장소 편집 로직을 화면 마크업에서 분리
 */
export const useSavedCategoryEditor = (
  category: SavedCategory | null,
  updateSavedCategoryMutation: UpdateSavedCategoryMutation,
) => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<SearchedPlace[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SearchedPlace[]>([]);
  const [highlightedSearchPlaceId, setHighlightedSearchPlaceId] = useState<string | null>(null);

  const detailPlaces = category?.places ?? [];
  const currentPlaces = isAddingPlace ? selectedPlaces : detailPlaces;
  const isUnchangedRenameTitle = category ? renameTitle === category.title : true;
  const isUnchangedPlaceSelection = category
    ? selectedPlaces.length === category.places.length
      && selectedPlaces.every((place, index) => {
        const originalPlace = category.places[index];
        return originalPlace ? arePlacesEqual(place, originalPlace) : false;
      })
    : true;

  useEffect(() => {
    // 조회된 상세 데이터를 편집용 상태로 동기화하여 진입 직후 현재 값을 기준으로 편집 시작
    if (!category || isAddingPlace) return;

    setSelectedPlaces(category.places.map(toEditablePlace));
  }, [category, isAddingPlace]);

  const resetPlaceEditingState = () => {
    setPlaceQuery('');
    setPlaceResults([]);
    setFocusedPlaceId(null);
    setHighlightedSearchPlaceId(null);
  };

  const handleOpenRenameDialog = () => {
    if (!category) return;
    setRenameTitle(category.title);
    setRenameDialogOpen(true);
  };

  const handleRenameCategory = async () => {
    if (!category) return;
    if (!renameTitle.trim()) {
      toast.error(UI_COPY.myCategory.nameRequired);
      return;
    }

    if (isUnchangedRenameTitle) {
      return;
    }

    try {
      await updateSavedCategoryMutation.mutateAsync({
        id: category.id,
        title: renameTitle,
        originalPlaceIds: category.places.map((place) => place.id),
        places: category.places.map(toEditablePlace),
      });
      setRenameDialogOpen(false);
    } catch {
      // UserRequest: 이름 변경 실패 시 다이얼로그를 유지한다.
    }
  };

  const handleOpenAddPlaceMode = () => {
    if (!category) return;

    setSelectedPlaces(category.places.map(toEditablePlace));
    resetPlaceEditingState();
    setIsAddingPlace(true);
  };

  const handleCancelAddPlaceMode = () => {
    setIsAddingPlace(false);
    resetPlaceEditingState();
  };

  const handleSearchPlaces = async () => {
    if (!placeQuery.trim()) {
      toast.error(UI_COPY.myCategory.placeSearchKeywordRequired);
      return;
    }

    setPlaceSearchLoading(true);
    const { searchedPlaces, error } = await placeApi.search({ keyword: placeQuery.trim() });
    if (error) {
      toast.error(error || MESSAGES.place.searchFailed);
      setPlaceResults([]);
    } else {
      setPlaceResults(searchedPlaces ?? []);
      setHighlightedSearchPlaceId(null);
      if (!searchedPlaces || searchedPlaces.length === 0) {
        toast.info(UI_COPY.myCategory.placeSearchNoResult);
      }
    }
    setPlaceSearchLoading(false);
  };

  const handleAddPlace = (place: SearchedPlace) => {
    const exists = selectedPlaces.some((item) => item.id === place.id);
    if (exists) {
      toast.info(UI_COPY.myCategory.placeAlreadyAdded);
      return;
    }

    setSelectedPlaces((previous) => [...previous, place]);
  };

  const handleSelectSearchPlace = (placeId: string) => {
    // UserRequest: 검색 결과 카드를 클릭하면 해당 장소의 지도 점만 파란색으로 강조한다.
    setHighlightedSearchPlaceId(placeId);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((previous) => previous.filter((place) => place.id !== placeId));
    if (focusedPlaceId === placeId) {
      setFocusedPlaceId(null);
    }
  };

  const handleFocusPlace = (placeId: string) => {
    // UserRequest: 장소 목록 클릭 시 해당 장소로 이동하면서 이름표를 함께 표시한다.
    setHighlightedSearchPlaceId(null);
    setFocusedPlaceId(placeId);
  };

  const handleSavePlaces = async () => {
    if (!category) return;
    if (selectedPlaces.length === 0) {
      toast.error(UI_COPY.myCategory.atLeastOnePlace);
      return;
    }

    try {
      await updateSavedCategoryMutation.mutateAsync({
        id: category.id,
        title: category.title,
        originalPlaceIds: category.places.map((place) => place.id),
        places: selectedPlaces,
      });
      setIsAddingPlace(false);
      setPlaceQuery('');
      setPlaceResults([]);
      setHighlightedSearchPlaceId(null);
    } catch {
      // UserRequest: 장소 추가 실패 시 편집 영역을 유지한다.
    }
  };

  return {
    focusedPlaceId,
    renameDialogOpen,
    renameTitle,
    isAddingPlace,
    placeQuery,
    placeResults,
    placeSearchLoading,
    selectedPlaces,
    highlightedSearchPlaceId,
    detailPlaces,
    currentPlaces,
    isUnchangedRenameTitle,
    isUnchangedPlaceSelection,
    setRenameDialogOpen,
    setRenameTitle,
    setPlaceQuery,
    handleOpenRenameDialog,
    handleRenameCategory,
    handleOpenAddPlaceMode,
    handleCancelAddPlaceMode,
    handleSearchPlaces,
    handleAddPlace,
    handleSelectSearchPlace,
    handleRemovePlace,
    handleFocusPlace,
    handleSavePlaces,
  };
};
