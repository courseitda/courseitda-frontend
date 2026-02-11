import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { Plus, FolderDown, FolderPlus } from 'lucide-react';
import { CategoryCard } from './category-card';
import { AddCategoryDialog } from './add-category-dialog';
import { ImportCategoryDialog } from './import-category-dialog';
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addOptionOpen, setAddOptionOpen] = useState(false);
  const addOptionRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  useEffect(() => {
    if (!addOptionOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!addOptionRef.current) return;
      if (!addOptionRef.current.contains(event.target as Node)) {
        setAddOptionOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAddOptionOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addOptionOpen]);

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
        {/* UserRequest: 카테고리 추가 버튼이 좌/우로 분할되는 마이크로 인터랙션 제공 */}
        <div ref={addOptionRef} className="relative min-h-[2.25rem]">
          <Button
            onClick={() => setAddOptionOpen((prev) => !prev)}
            size="sm"
            className={`gap-2 transition-all duration-200 ${addOptionOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'}`}
          >
            <Plus className="w-4 h-4" />
            추가
          </Button>
          <div
            className={`absolute right-0 top-0 flex items-center gap-2 transition-all duration-200 ${addOptionOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-2 order-1"
              onClick={() => {
                setAddOptionOpen(false);
                setImportDialogOpen(true);
              }}
            >
              <FolderDown className="w-4 h-4" />
              불러오기
            </Button>
            <Button
              size="sm"
              className="gap-2 order-2"
              onClick={() => {
                setAddOptionOpen(false);
                setAddDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              생성하기
            </Button>
          </div>
        </div>
      </div>

      {/* UserRequest: 카테고리 카드 사이 여백을 0.5배로 축소하여 공간 효율성 향상 (space-y-3 → space-y-1.5) */}
      {isError ? (
        <div className="border border-destructive/40 bg-destructive/5 text-destructive rounded-xl p-8 text-center text-sm">
          카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          {/* UserRequest: 카테고리 없음 상태에 폴더+플러스 아이콘만 크게 노출 */}
          <FolderPlus className="mx-auto mb-3 h-[72px] w-[72px] text-muted-foreground/60" />
          <p className="text-muted-foreground mb-4">카테고리를 추가해보세요</p>
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

      <ImportCategoryDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        workspaceIdentifier={workspaceIdentifier}
        categories={categories.map((item) => item.category)}
      />

    </div>
  );
};
