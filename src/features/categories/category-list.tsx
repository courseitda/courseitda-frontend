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

export const CategoryList = ({ workspaceId, categories, onPlaceClick }: CategoryListProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

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

      {categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">카테고리를 추가해보세요</p>
          <Button onClick={() => setAddDialogOpen(true)}>첫 카테고리 만들기</Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <CategoryCard category={category} workspaceId={workspaceId} onPlaceClick={onPlaceClick} />
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
