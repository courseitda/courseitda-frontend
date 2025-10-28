import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryCard } from './category-card';
import { AddCategoryDialog } from './add-category-dialog';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { categoryApi } from '@/services/api';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceCategory } from '@/services/api/category.service';

interface CategoryListProps {
  workspaceIdentifier: string;
  categories: WorkspaceCategory[];
  onPlaceClick?: (place: Place) => void;
  isError?: boolean;
}

// 카테고리 목록 컴포넌트 - 드래그 앤 드롭으로 순서 변경 가능한 카테고리 카드 목록 표시
// 사용 위치: pages/WorkspaceDetail
export const CategoryList = ({
  workspaceIdentifier,
  categories,
  onPlaceClick,
  isError,
}: CategoryListProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  const reorderMutation = useMutation<void, Error, Array<{ id: string; sequence: number }>>({
    mutationFn: async (items) => {
      const { error } = await categoryApi.reorder(workspaceIdentifier, items);
      if (error) {
        throw new Error(error);
      }
    },
  });

  // 드래그 앤 드롭으로 카테고리 순서 변경 시 새로운 순서를 DB에 저장
  const handleDragEnd = async (result: DropResult) => {
    // 드롭 위치가 유효하지 않으면 아무것도 하지 않음
    if (!result.destination) return;

    if (reorderMutation.isPending) return;

    if (result.destination.index === result.source.index) return;

    const previous = queryClient.getQueryData<WorkspaceCategory[]>(queryKey);

    const updatedOrder = Array.from(categories);
    const [removed] = updatedOrder.splice(result.source.index, 1);
    updatedOrder.splice(result.destination.index, 0, removed);

    const withUpdatedSequence = updatedOrder.map((item, index) => ({
      category: { ...item.category, sequence: index },
      places: item.places,
    }));

    queryClient.setQueryData<WorkspaceCategory[]>(queryKey, withUpdatedSequence);

    const payload = withUpdatedSequence.map(({ category }, index) => ({
      id: category.id,
      sequence: index,
    }));

    reorderMutation.mutate(payload, {
      onError: (error) => {
        const message = error instanceof Error ? error.message : '카테고리 순서 변경에 실패했습니다.';
        toast.error(message);
        if (previous) {
          queryClient.setQueryData<WorkspaceCategory[]>(queryKey, previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">카테고리</h2>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          추가
        </Button>
      </div>

      {/* UserRequest: 카테고리 카드 사이 여백을 0.5배로 축소하여 공간 효율성 향상 (space-y-3 → space-y-1.5) */}
      {isError ? (
        <div className="border border-destructive/40 bg-destructive/5 text-destructive rounded-xl p-8 text-center text-sm">
          카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">카테고리를 추가해보세요</p>
          <Button onClick={() => setAddDialogOpen(true)}>첫 카테고리 만들기</Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                {categories.map((item, index) => (
                  <Draggable key={item.category.id} draggableId={item.category.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <CategoryCard 
                          category={item.category}
                          places={item.places}
                          workspaceIdentifier={workspaceIdentifier} 
                          index={index}
                          onPlaceClick={onPlaceClick} 
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        workspaceIdentifier={workspaceIdentifier}
        categories={categories.map((item) => item.category)}
      />
    </div>
  );
};
