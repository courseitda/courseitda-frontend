import type { QueryClient } from '@tanstack/react-query';
import type { MySharedCategory, SharedSavedCategory } from '@/entities/types';
import { COMMUNITY_QUERY_KEYS } from '@/shared/hooks/use-community';

const updateForkCount = <T extends { id: string; forkCount: number }>(
  categories: T[] | undefined,
  sharedCategoryId: string,
  delta: number,
): T[] | undefined =>
  categories?.map((category) =>
    category.id === sharedCategoryId
      ? { ...category, forkCount: Math.max(0, category.forkCount + delta) }
      : category,
  );

// 커뮤니티 캐시 전반의 fork 수를 함께 갱신하여 토글 직후 UI를 즉시 동기화
export const syncSharedCategoryForkCount = (
  queryClient: QueryClient,
  sharedCategoryId: string,
  delta: number,
) => {
  queryClient.setQueryData<SharedSavedCategory[]>(
    COMMUNITY_QUERY_KEYS.recommended,
    (previous) => updateForkCount(previous, sharedCategoryId, delta),
  );

  queryClient.setQueryData<MySharedCategory[]>(
    COMMUNITY_QUERY_KEYS.myShared,
    (previous) => updateForkCount(previous, sharedCategoryId, delta),
  );

  const searchQueries = queryClient.getQueriesData<SharedSavedCategory[]>({
    queryKey: ['community', 'shared-categories', 'search'],
  });

  searchQueries.forEach(([queryKey]) => {
    queryClient.setQueryData<SharedSavedCategory[]>(
      queryKey,
      (previous) => updateForkCount(previous, sharedCategoryId, delta),
    );
  });
};
