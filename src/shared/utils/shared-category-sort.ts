import type { SharedSavedCategory } from '@/entities/types';

// UserRequest: 카테고리 게시판 정렬 로직을 재사용 가능한 유틸로 분리
export const sortSharedCategoriesByLatest = (
  categories: SharedSavedCategory[],
): SharedSavedCategory[] =>
  [...categories].sort((a, b) => {
    const aTime = new Date(a.uploadedAt).getTime();
    const bTime = new Date(b.uploadedAt).getTime();
    return bTime - aTime;
  });

export const sortSharedCategoriesById = (
  categories: SharedSavedCategory[],
): SharedSavedCategory[] =>
  [...categories].sort((a, b) => {
    const aId = Number(a.id.replace(/[^\d]/g, ''));
    const bId = Number(b.id.replace(/[^\d]/g, ''));
    if (Number.isNaN(aId) || Number.isNaN(bId)) {
      return a.id.localeCompare(b.id);
    }
    return aId - bId;
  });
