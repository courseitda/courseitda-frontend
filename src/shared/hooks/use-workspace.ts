import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/mock/db';
import type { Workspace } from '@/entities/types';

/**
 * 워크스페이스 단일 조회 커스텀 훅
 * 현재: useLiveQuery로 IndexedDB에서 실시간 조회
 * 백엔드 연동 시: workspaceApi.getByIdentifier() 호출로 변경하고 useQuery 등으로 캐싱
 * 
 * @param workspaceIdentifier - 워크스페이스 식별자 (URL 파라미터로 전달되는 identifier)
 * @returns 워크스페이스 객체 (없으면 undefined)
 */
export const useWorkspace = (workspaceIdentifier?: string): Workspace | undefined => {
  // 현재: IndexedDB에서 실시간 조회 (useLiveQuery)
  // 백엔드 연동 시: 아래와 같이 변경
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ['workspace', workspaceIdentifier],
  //   queryFn: () => workspaceApi.getByIdentifier(workspaceIdentifier),
  //   enabled: !!workspaceIdentifier,
  // });
  // return data?.workspace;
  
  return useLiveQuery(
    () => (workspaceIdentifier ? db.workspaces.where('identifier').equals(workspaceIdentifier).first() : undefined),
    [workspaceIdentifier]
  );
};

/**
 * 사용자 소유 워크스페이스 목록 조회 커스텀 훅 (레거시)
 * @deprecated useMyWorkspaces 사용 권장 (백엔드 API 스펙에 맞춤)
 * 현재: useLiveQuery로 IndexedDB에서 실시간 조회
 * 백엔드 연동 시: workspaceApi.getMyWorkspaces() 호출로 변경하고 useQuery 등으로 캐싱
 * 
 * @param userId - 사용자 ID
 * @returns 워크스페이스 배열 (없으면 빈 배열)
 */
export const useWorkspacesByOwner = (userId?: string): Workspace[] | undefined => {
  // 현재: IndexedDB에서 실시간 조회 (useLiveQuery)
  // 백엔드 연동 시: workspaceApi.getMyWorkspaces() 사용 권장
  // const { data } = useQuery({
  //   queryKey: ['workspaces', 'me'],
  //   queryFn: () => workspaceApi.getMyWorkspaces(token),
  //   enabled: !!token,
  // });
  // return data?.workspaces.map(w => ({ ...w, id: w.identifier, ... }));
  
  return useLiveQuery(
    () => (userId ? db.workspaces.where('ownerId').equals(userId).toArray() : []),
    [userId]
  );
};

