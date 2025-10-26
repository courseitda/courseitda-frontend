import { db } from '../db';
import type { Workspace } from '@/entities/types';

// 워크스페이스 관련 Edge Functions
// 사용 위치: features/workspaces (create-workspace-dialog, edit-workspace-dialog), features/layout (navigation-drawer), pages (Workspaces, WorkspaceDetail)

// 워크스페이스 생성 Edge Function - 새로운 여행 계획/코스 컨테이너 생성
export const createWorkspace = async (input: {
  ownerId: string;
  title: string;
}): Promise<{ workspace?: Workspace; error?: string }> => {
  try {
    // 워크스페이스 제목 필수 입력 검증
    if (!input.title || input.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }


    // 워크스페이스 생성 및 DB 저장
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      identifier: crypto.randomUUID(), // UUID 고유 식별자
      ownerId: input.ownerId,
      title: input.title.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.workspaces.add(workspace);

    return { workspace };
  } catch (error) {
    console.error('Create workspace error:', error);
    return { error: '워크스페이스 생성 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 수정 Edge Function - 제목 변경
export const updateWorkspace = async (
  id: string,
  updates: Partial<Pick<Workspace, 'title'>>
): Promise<{ error?: string }> => {
  try {
    // 워크스페이스 존재 여부 확인
    const workspace = await db.workspaces.get(id);
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 제목 변경 시 빈 문자열 방지
    if (updates.title !== undefined && updates.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }


    // 워크스페이스 정보 업데이트
    await db.workspaces.update(id, {
      ...updates,
      title: updates.title?.trim(),
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Update workspace error:', error);
    return { error: '워크스페이스 수정 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 삭제 Edge Function - 워크스페이스와 하위 모든 데이터 삭제
export const deleteWorkspace = async (id: string): Promise<{ error?: string }> => {
  try {
    // 워크스페이스에 속한 카테고리 조회
    const categories = await db.categories.where('workspaceId').equals(id).toArray();
    
    // 각 카테고리의 장소 연결 정보 삭제 (cascade delete)
    for (const category of categories) {
      await db.categoryPlaces.where('categoryId').equals(category.id).delete();
    }
    
    // 워크스페이스의 모든 카테고리 삭제
    await db.categories.where('workspaceId').equals(id).delete();
    // 워크스페이스 자체 삭제
    await db.workspaces.delete(id);

    return {};
  } catch (error) {
    console.error('Delete workspace error:', error);
    return { error: '워크스페이스 삭제 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 단일 조회 Edge Function - identifier로 워크스페이스 상세 정보 조회
// 백엔드 연동 시: GET /api/workspaces/{identifier}
export const getWorkspaceByIdentifier = async (
  identifier: string
): Promise<{ workspace?: Workspace; error?: string }> => {
  try {
    // identifier로 워크스페이스 조회
    const workspace = await db.workspaces.where('identifier').equals(identifier).first();
    
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }
    
    return { workspace };
  } catch (error) {
    console.error('Get workspace by identifier error:', error);
    return { error: '워크스페이스 조회 중 오류가 발생했습니다.' };
  }
};

// 소유자별 워크스페이스 조회 - 사용자가 생성한 모든 워크스페이스 목록 반환
export const getWorkspacesByOwner = async (ownerId: string): Promise<Workspace[]> => {
  return await db.workspaces.where('ownerId').equals(ownerId).toArray();
};

// 워크스페이스 제목 중복 검증 Edge Function - 같은 사용자가 동일한 제목의 워크스페이스를 생성할 수 있는지 확인
export const checkWorkspaceTitleDuplicate = async (
  ownerId: string, 
  title: string
): Promise<{ isDuplicate: boolean; error?: string }> => {
  try {
    // 제목 길이 검증
    if (!title || title.trim().length === 0) {
      return { isDuplicate: false, error: '워크스페이스 제목을 입력해주세요.' };
    }

    if (title.trim().length > 50) {
      return { isDuplicate: false, error: '워크스페이스 제목은 최대 50자까지 가능합니다.' };
    }

    // 같은 사용자가 동일한 제목의 워크스페이스를 가지고 있는지 확인
    const existing = await db.workspaces
      .where('ownerId')
      .equals(ownerId)
      .and(workspace => workspace.title.trim().toLowerCase() === title.trim().toLowerCase())
      .first();
    
    return { isDuplicate: !!existing };
  } catch (error) {
    console.error('Workspace title check error:', error);
    return { isDuplicate: false, error: '워크스페이스 제목 확인 중 오류가 발생했습니다.' };
  }
};