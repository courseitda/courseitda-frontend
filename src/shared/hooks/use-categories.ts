import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { categoryApi } from '@/services/api';
import type { WorkspaceCategory } from '@/services/api/category.service';

const EMPTY_IDENTIFIER_ERROR = '워크스페이스 식별자가 필요합니다.';

// 워크스페이스 카테고리/장소를 React Query로 가져와 Dexie 의존성 제거
export const useWorkspaceCategories = (
  workspaceIdentifier?: string,
): UseQueryResult<WorkspaceCategory[], Error> => {
  return useQuery<WorkspaceCategory[], Error>({
    queryKey: ['workspace', workspaceIdentifier, 'categories'],
    enabled: !!workspaceIdentifier,
    staleTime: 30_000,
    queryFn: async () => {
      if (!workspaceIdentifier) {
        throw new Error(EMPTY_IDENTIFIER_ERROR);
      }

      const { categories, error } = await categoryApi.getByWorkspace(workspaceIdentifier);

      if (error) {
        throw new Error(error);
      }

      return categories;
    },
  });
};
