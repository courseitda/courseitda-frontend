import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { workspaceApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import type { Workspace } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

type WorkspacePayload = {
  identifier: string;
  title: string;
  modifiedAt: string;
  ownerId?: string;
  createdAt?: string;
};

// UserRequest: Step 4 — 백엔드 워크스페이스 응답을 화면에서 사용하는 Workspace 타입으로 보정
const toWorkspaceEntity = (payload: WorkspacePayload): Workspace => ({
  id: payload.identifier,
  identifier: payload.identifier,
  ownerId: payload.ownerId ?? '',
  title: payload.title,
  createdAt: payload.createdAt ?? payload.modifiedAt,
  updatedAt: payload.modifiedAt,
});

/**
 * 워크스페이스 단일 조회 커스텀 훅
 * UserRequest: Step 4 — React Query로 백엔드 데이터를 캐싱하고 Dexie 의존성을 제거
 */
export const useWorkspace = (workspaceIdentifier?: string): UseQueryResult<Workspace, Error> => {
  // 백엔드 연동을 위해 identifier 기반으로 워크스페이스를 조회하고 캐싱
  return useQuery<Workspace, Error>({
    queryKey: ['workspace', workspaceIdentifier],
    enabled: !!workspaceIdentifier,
    queryFn: async () => {
      if (!workspaceIdentifier) {
        throw new Error(UI_COPY.system.workspaceIdentifierRequired);
      }

      const response = await workspaceApi.getByIdentifier(workspaceIdentifier);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? MESSAGES.workspace.loadFailed);
      }

      return toWorkspaceEntity({
        identifier: response.data.identifier,
        title: response.data.title,
        modifiedAt: response.data.modifiedAt,
      });
    },
    staleTime: 1000 * 30,
  });
};

/**
 * 사용자 소유 워크스페이스 목록 조회 커스텀 훅
 * UserRequest: Step 4 — 내 워크스페이스 목록을 React Query로 가져와 캐시
 */
export const useWorkspacesByOwner = (token?: string): UseQueryResult<Workspace[], Error> => {
  // 인증 토큰을 활용해 내 워크스페이스 목록을 조회하고 캐싱
  return useQuery<Workspace[], Error>({
    queryKey: ['workspaces', 'me'],
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error(UI_COPY.system.authTokenRequired);
      }

      const workspaces: Workspace[] = [];
      let cursor: number | null | undefined = null;
      let hasNext = true;

      while (hasNext) {
        const response = await workspaceApi.getMyWorkspaces(token, { cursor, size: 20 });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message ?? MESSAGES.workspace.loadFailed);
        }

        workspaces.push(
          ...response.data.workspaces.map((workspace) =>
            toWorkspaceEntity({
              identifier: workspace.identifier,
              title: workspace.title,
              modifiedAt: workspace.modifiedAt,
            }),
          ),
        );

        hasNext = response.data.hasNext;
        cursor = response.data.nextCursor;
      }

      return workspaces;
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });
};
