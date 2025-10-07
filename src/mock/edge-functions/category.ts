import { db } from '../db';
import type { Category } from '@/entities/types';

export const addCategory = async (input: {
  workspaceId: string;
  name: string;
  color: string;
}): Promise<{ category?: Category; error?: string }> => {
  try {
    // Validation
    if (!input.name || input.name.trim().length === 0) {
      return { error: '카테고리 이름을 입력해주세요.' };
    }

    // Get current categories count for sort order
    const existingCategories = await db.categories
      .where('workspaceId')
      .equals(input.workspaceId)
      .toArray();

    const sortOrder = existingCategories.length;

    const category: Category = {
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      color: input.color,
      sortOrder,
      representativePlaceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.categories.add(category);

    return { category };
  } catch (error) {
    console.error('Add category error:', error);
    return { error: '카테고리 추가 중 오류가 발생했습니다.' };
  }
};

export const updateCategory = async (
  id: string,
  updates: Partial<Pick<Category, 'name' | 'color'>>
): Promise<{ error?: string }> => {
  try {
    const category = await db.categories.get(id);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      return { error: '카테고리 이름을 입력해주세요.' };
    }

    await db.categories.update(id, {
      ...updates,
      name: updates.name?.trim(),
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Update category error:', error);
    return { error: '카테고리 수정 중 오류가 발생했습니다.' };
  }
};

export const deleteCategory = async (id: string): Promise<{ error?: string }> => {
  try {
    // Delete related category places
    await db.categoryPlaces.where('categoryId').equals(id).delete();
    await db.categories.delete(id);

    return {};
  } catch (error) {
    console.error('Delete category error:', error);
    return { error: '카테고리 삭제 중 오류가 발생했습니다.' };
  }
};

export const reorderCategories = async (
  workspaceId: string,
  orderedIds: string[]
): Promise<{ error?: string }> => {
  try {
    // Update sortOrder for each category
    const updates = orderedIds.map((id, index) =>
      db.categories.update(id, {
        sortOrder: index,
        updatedAt: new Date().toISOString(),
      })
    );

    await Promise.all(updates);

    return {};
  } catch (error) {
    console.error('Reorder categories error:', error);
    return { error: '카테고리 순서 변경 중 오류가 발생했습니다.' };
  }
};

export const setRepresentativePlace = async (
  categoryId: string,
  placeId: string | null
): Promise<{ error?: string }> => {
  try {
    const category = await db.categories.get(categoryId);
    if (!category) {
      return { error: '카테고리를 찾을 수 없습니다.' };
    }

    // Verify place exists in this category if placeId is provided
    if (placeId) {
      const categoryPlace = await db.categoryPlaces
        .where('[categoryId+placeId]')
        .equals([categoryId, placeId])
        .first();

      if (!categoryPlace) {
        return { error: '해당 카테고리에 속하지 않은 장소입니다.' };
      }
    }

    await db.categories.update(categoryId, {
      representativePlaceId: placeId,
      updatedAt: new Date().toISOString(),
    });

    return {};
  } catch (error) {
    console.error('Set representative place error:', error);
    return { error: '대표 장소 설정 중 오류가 발생했습니다.' };
  }
};
