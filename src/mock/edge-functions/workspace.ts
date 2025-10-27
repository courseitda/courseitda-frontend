import { db } from '../db';
import type { Workspace } from '@/entities/types';

// 워크스페이스 관련 Edge Functions
// 사용 위치: features/workspaces (create-workspace-dialog, edit-workspace-dialog), features/layout (navigation-drawer), pages (Workspaces, WorkspaceDetail)

// 워크스페이스 생성 Edge Function - 새로운 여행 계획/코스 컨테이너 생성
// 백엔드 연동 시: POST /api/workspaces
export const createWorkspace = async (input: {
  token: string;
  title: string;
}): Promise<{ 
  identifier?: string;
  title?: string;
  modifiedAt?: string;
  error?: string;
}> => {
  try {
    // 토큰에서 사용자 ID 추출
    const decoded = JSON.parse(atob(input.token));
    const ownerId = decoded.userId;

    // 워크스페이스 제목 필수 입력 검증
    if (!input.title || input.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }

    // 백엔드 검증: 제목 최대 20자
    if (input.title.trim().length > 20) {
      return { error: '워크스페이스 제목은 최대 20자까지 가능합니다.' };
    }

    // 워크스페이스 생성 및 DB 저장
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      identifier: crypto.randomUUID(), // UUID 고유 식별자
      ownerId: ownerId,
      title: input.title.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.workspaces.add(workspace);

    // 백엔드 API 스펙에 맞춰 응답: { identifier, title, modifiedAt }
    // Location Header: /api/workspaces/{identifier}
    return { 
      identifier: workspace.identifier,
      title: workspace.title,
      modifiedAt: workspace.updatedAt,
    };
  } catch (error) {
    console.error('Create workspace error:', error);
    return { error: '워크스페이스 생성 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 수정 Edge Function - 제목 변경
// 백엔드 연동 시: PATCH /api/workspaces/{workspaceIdentifier}
export const updateWorkspace = async (
  identifier: string,
  updates: { title: string }
): Promise<{ 
  identifier?: string;
  title?: string;
  modifiedAt?: string;
  error?: string;
}> => {
  try {
    // identifier로 워크스페이스 조회
    const workspace = await db.workspaces.where('identifier').equals(identifier).first();
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 제목 필수 입력 검증
    if (!updates.title || updates.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }

    // 백엔드 검증: 제목 최대 20자
    if (updates.title.trim().length > 20) {
      return { error: '워크스페이스 제목은 최대 20자까지 가능합니다.' };
    }

    // 워크스페이스 정보 업데이트
    const updatedAt = new Date().toISOString();
    await db.workspaces.update(workspace.id, {
      title: updates.title.trim(),
      updatedAt: updatedAt,
    });

    // 백엔드 API 스펙에 맞춰 응답: { identifier, title, modifiedAt }
    return {
      identifier: workspace.identifier,
      title: updates.title.trim(),
      modifiedAt: updatedAt,
    };
  } catch (error) {
    console.error('Update workspace error:', error);
    return { error: '워크스페이스 수정 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 삭제 Edge Function - 워크스페이스와 하위 모든 데이터 삭제
// 백엔드 연동 시: DELETE /api/workspaces/{workspaceIdentifier}
export const deleteWorkspace = async (workspaceIdentifier: string): Promise<{ error?: string }> => {
  try {
    // identifier로 워크스페이스 조회
    const workspace = await db.workspaces.where('identifier').equals(workspaceIdentifier).first();
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    // 워크스페이스에 속한 카테고리 조회
    const categories = await db.categories.where('workspaceId').equals(workspace.id).toArray();
    
    // 각 카테고리의 장소 연결 정보 삭제 (cascade delete)
    for (const category of categories) {
      await db.categoryPlaces.where('categoryId').equals(category.id).delete();
    }
    
    // 워크스페이스의 모든 카테고리 삭제
    await db.categories.where('workspaceId').equals(workspace.id).delete();
    // 워크스페이스 자체 삭제
    await db.workspaces.delete(workspace.id);

    return {};
  } catch (error) {
    console.error('Delete workspace error:', error);
    return { error: '워크스페이스 삭제 중 오류가 발생했습니다.' };
  }
};

// 워크스페이스 단일 조회 Edge Function - identifier로 워크스페이스 상세 정보 조회
// 백엔드 연동 시: GET /api/workspaces/{workspaceIdentifier}
export const getWorkspaceByIdentifier = async (
  identifier: string
): Promise<{ 
  identifier?: string;
  title?: string;
  modifiedAt?: string;
  error?: string;
}> => {
  try {
    // identifier로 워크스페이스 조회
    const workspace = await db.workspaces.where('identifier').equals(identifier).first();
    
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }
    
    // 백엔드 API 스펙에 맞춰 응답: { identifier, title, modifiedAt }
    // 필드 선택: identifier, title, modifiedAt만 반환 (id, ownerId, createdAt 제외)
    return { 
      identifier: workspace.identifier,
      title: workspace.title,
      modifiedAt: workspace.updatedAt,
    };
  } catch (error) {
    console.error('Get workspace by identifier error:', error);
    return { error: '워크스페이스 조회 중 오류가 발생했습니다.' };
  }
};

// 내 워크스페이스 목록 조회 Edge Function - 토큰에서 사용자를 추출하여 워크스페이스 목록 반환
// 백엔드 연동 시: GET /api/me/workspaces
export const getMyWorkspaces = async (token: string): Promise<{ 
  workspaces: Array<{
    identifier: string;
    title: string;
    modifiedAt: string;
  }>;
  error?: string;
}> => {
  try {
    // 토큰에서 사용자 ID 추출
    const decoded = JSON.parse(atob(token));
    const userId = decoded.userId;
    
    // 사용자 소유 워크스페이스 조회
    const allWorkspaces = await db.workspaces.where('ownerId').equals(userId).toArray();
    
    // 백엔드 API 스펙에 맞춰 응답 변환: { workspaces: [{ identifier, title, modifiedAt }] }
    // 필드 선택: identifier, title, modifiedAt만 반환 (id, ownerId, createdAt 제외)
    const workspaces = allWorkspaces.map(w => ({
      identifier: w.identifier,
      title: w.title,
      modifiedAt: w.updatedAt, // 백엔드는 modifiedAt, 프론트는 updatedAt 사용
    }));
    
    return { workspaces };
  } catch (error) {
    console.error('Get my workspaces error:', error);
    return { workspaces: [], error: '워크스페이스 목록 조회 중 오류가 발생했습니다.' };
  }
};

// 소유자별 워크스페이스 조회 - 사용자가 생성한 모든 워크스페이스 목록 반환
// 내부 사용 또는 관리자용 API로 유지 (getMyWorkspaces 사용 권장)
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