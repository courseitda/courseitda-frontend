import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Category, Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryCard } from './category-card';
import { AddCategoryDialog } from './add-category-dialog';
import { reorderCategories } from '@/mock/edge-functions/category';
import { toast } from 'sonner';

interface CategoryListProps {
  workspaceId: string;
  categories: Category[];
  onPlaceClick?: (place: Place) => void;
}

// 카테고리 목록 컴포넌트 - 드래그 앤 드롭으로 순서 변경 가능한 카테고리 카드 목록 표시
export const CategoryList = ({ workspaceId, categories, onPlaceClick }: CategoryListProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 드래그 앤 드롭으로 카테고리 순서 변경 시 새로운 순서를 DB에 저장
  const handleDragEnd = async (result: DropResult) => {
    // 드롭 위치가 유효하지 않으면 아무것도 하지 않음
    if (!result.destination) return;

    // 배열을 복사하여 순서 변경 작업 수행
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 변경된 순서를 ID 배열로 변환하여 Edge Function을 통해 DB에 저장
    const orderedIds = items.map((item) => item.id);
    const { error } = await reorderCategories(workspaceId, orderedIds);

    if (error) {
      toast.error(error);
    }
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

      {/* UserRequest: 카테고리 카드 사이 여백을 0.5배로 축소 (space-y-3 → space-y-1.5) */}
      {categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">카테고리를 추가해보세요</p>
          <Button onClick={() => setAddDialogOpen(true)}>첫 카테고리 만들기</Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <CategoryCard 
                          category={category} 
                          workspaceId={workspaceId} 
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
        workspaceId={workspaceId}
      />
    </div>
  );
};
