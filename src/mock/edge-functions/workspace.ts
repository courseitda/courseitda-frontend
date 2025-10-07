import { db } from '../db';
import type { Workspace } from '@/entities/types';

export const createWorkspace = async (input: {
  ownerId: string;
  title: string;
  headcount?: number;
  date?: string;
}): Promise<{ workspace?: Workspace; error?: string }> => {
  try {
    // Validation
    if (!input.title || input.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }

    if (input.headcount !== undefined && input.headcount < 1) {
      return { error: '인원은 최소 1명 이상이어야 합니다.' };
    }

    const workspace: Workspace = {
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      title: input.title.trim(),
      headcount: input.headcount,
      date: input.date,
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

export const updateWorkspace = async (
  id: string,
  updates: Partial<Pick<Workspace, 'title' | 'headcount' | 'date'>>
): Promise<{ error?: string }> => {
  try {
    const workspace = await db.workspaces.get(id);
    if (!workspace) {
      return { error: '워크스페이스를 찾을 수 없습니다.' };
    }

    if (updates.title !== undefined && updates.title.trim().length === 0) {
      return { error: '워크스페이스 제목을 입력해주세요.' };
    }

    if (updates.headcount !== undefined && updates.headcount < 1) {
      return { error: '인원은 최소 1명 이상이어야 합니다.' };
    }

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

export const deleteWorkspace = async (id: string): Promise<{ error?: string }> => {
  try {
    // Delete related categories and their places
    const categories = await db.categories.where('workspaceId').equals(id).toArray();
    
    for (const category of categories) {
      await db.categoryPlaces.where('categoryId').equals(category.id).delete();
    }
    
    await db.categories.where('workspaceId').equals(id).delete();
    await db.workspaces.delete(id);

    return {};
  } catch (error) {
    console.error('Delete workspace error:', error);
    return { error: '워크스페이스 삭제 중 오류가 발생했습니다.' };
  }
};

export const getWorkspacesByOwner = async (ownerId: string): Promise<Workspace[]> => {
  return await db.workspaces.where('ownerId').equals(ownerId).toArray();
};
