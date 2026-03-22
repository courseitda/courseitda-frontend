export const MY_STORAGE_QUERY_KEYS = {
  mySavedCategories: ['my-storage', 'saved-categories', 'me'] as const,
  savedCategoryDetail: (savedCategoryId: string) => ['my-storage', 'saved-categories', savedCategoryId] as const,
  savedCategoryPlaces: (savedCategoryId: string) =>
    ['my-storage', 'saved-categories', savedCategoryId, 'places'] as const,
};
