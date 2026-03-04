import { useEffect, useRef, useState } from 'react';
import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { Plus, Inbox, FolderPlus, SquarePen, ListOrdered } from 'lucide-react';
import { CategoryCard } from './category-card';
import { AddCategoryDialog } from './add-category-dialog';
import { ImportCategoryDialog } from './import-category-dialog';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { categoryApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceCategory } from '@/services/api/category.service';
import { UI_COPY } from '@/shared/constants/ui-copy';

interface CategoryListProps {
  workspaceIdentifier: string;
  categories: WorkspaceCategory[];
  onPlaceClick?: (place: Place) => void;
  isError?: boolean;
}

// 카테고리 목록 컴포넌트 - 버튼 기반으로 카테고리 순서를 변경 가능한 카드 목록 표시
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
  // UserRequest: 워크스페이스 상세보기 진입 시 기본 화면을 보기 모드로 노출한다.
  const [isOrderEditMode, setIsOrderEditMode] = useState(true);
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

  // UserRequest: 드래그 대신 위/아래 이동 버튼으로 카테고리 순서를 재배치한다.
  const handleMoveCategory = (sourceIndex: number, targetIndex: number) => {
    if (reorderMutation.isPending) return;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    if (targetIndex === sourceIndex) return;

    const previous = queryClient.getQueryData<WorkspaceCategory[]>(queryKey);

    const updatedOrder = Array.from(categories);
    const [removed] = updatedOrder.splice(sourceIndex, 1);
    updatedOrder.splice(targetIndex, 0, removed);

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
        const message = error instanceof Error ? error.message : MESSAGES.workspaceCategory.reorderFailed;
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
        <h2 className="text-lg font-semibold">{UI_COPY.categoryList.title}</h2>
        {/* UserRequest: 모드 토글은 아이콘 형태를 유지하되 헤더 오른쪽에 배치한다. */}
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={`rounded-full p-2 transition-colors ${
              !isOrderEditMode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/55 hover:text-muted-foreground'
            }`}
            onClick={() => {
              setIsOrderEditMode(false);
              setAddOptionOpen(false);
            }}
            aria-pressed={!isOrderEditMode}
            aria-label="편집 모드"
            title="편집 모드"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`rounded-full p-2 transition-colors ${
              isOrderEditMode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/55 hover:text-muted-foreground'
            }`}
            onClick={() => {
              setIsOrderEditMode(true);
              setAddOptionOpen(false);
            }}
            aria-pressed={isOrderEditMode}
            aria-label="보기 모드"
            title="보기 모드"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* UserRequest: 카테고리 카드 사이 여백을 0.5배로 축소하여 공간 효율성 향상 (space-y-3 → space-y-1.5) */}
      {isError ? (
        <div className="border border-destructive/40 bg-destructive/5 text-destructive rounded-xl p-8 text-center text-sm">
          {UI_COPY.categoryList.loadFailed}
        </div>
      ) : categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          {/* UserRequest: 카테고리 없음 상태에 폴더+플러스 아이콘만 크게 노출 */}
          <FolderPlus className="mx-auto mb-3 h-[72px] w-[72px] text-muted-foreground/60" />
          <p className="text-muted-foreground mb-4">{UI_COPY.categoryList.emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {categories.map((item, index) => (
            <CategoryCard
              key={item.category.id}
              category={item.category}
              places={item.places}
              workspaceIdentifier={workspaceIdentifier}
              index={index}
              onPlaceClick={onPlaceClick}
              onMoveUp={() => handleMoveCategory(index, index - 1)}
              onMoveDown={() => handleMoveCategory(index, index + 1)}
              canMoveUp={index > 0}
              canMoveDown={index < categories.length - 1}
              isReordering={reorderMutation.isPending}
              isOrderEditMode={isOrderEditMode}
            />
          ))}
        </div>
      )}

      {!isOrderEditMode && (
        <div
          ref={addOptionRef}
          className="fixed right-4 bottom-4 md:right-8 md:bottom-8 z-40 flex flex-col items-end gap-2"
        >
          <div
            className={`flex flex-col items-end gap-2 transition-all duration-200 ease-out ${
              addOptionOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}
          >
            {/* UserRequest: 펼쳐진 추가 액션은 상하 구조를 유지한 하나의 컨테이너 안에서 반씩 나뉜 2분할 버튼으로 표현한다. */}
            <div className="flex w-full min-w-[9.25rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
              <button
                type="button"
                className="flex h-14 items-center gap-2 pl-4 pr-3 text-sm font-semibold transition-colors hover:bg-accent/60"
                onClick={() => {
                  setAddOptionOpen(false);
                  setImportDialogOpen(true);
                }}
              >
                <Inbox className="h-6 w-6" />
                {UI_COPY.categoryList.importAction}
              </button>
              <button
                type="button"
                className="flex h-14 items-center gap-2 pl-4 pr-3 text-sm font-semibold transition-colors hover:bg-accent/60"
                onClick={() => {
                  setAddOptionOpen(false);
                  setAddDialogOpen(true);
                }}
              >
                <FolderPlus className="h-6 w-6" />
                {UI_COPY.categoryList.createAction}
              </button>
            </div>
          </div>
          <Button
            onClick={() => setAddOptionOpen((prev) => !prev)}
            size="default"
            className={`relative z-10 inline-flex h-14 items-center overflow-hidden rounded-full px-5 font-semibold shadow-xl transition-all duration-200 ease-out origin-right ${
              addOptionOpen
                ? 'w-14 justify-center border-transparent bg-white px-0 text-black shadow-[0_10px_24px_rgba(15,23,42,0.18)] hover:bg-primary/5'
                : 'gap-2 whitespace-nowrap'
            }`}
            aria-label={UI_COPY.categoryList.addAction}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                addOptionOpen ? 'bg-white' : 'bg-primary'
              }`}
            />
            {/* UserRequest: 닫기 상태 전환 시 + 회전이 더 잘 보이도록 확대와 느린 이징을 함께 적용한다. */}
            <Plus
              className={`z-10 h-6 w-6 transition-transform duration-300 ease-in-out ${
                addOptionOpen
                  ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 scale-110 stroke-[3.1]'
                  : 'rotate-0 scale-100 stroke-[2.6]'
              }`}
            />
            <span
              className={`relative z-10 overflow-hidden text-sm font-bold transition-all duration-200 ease-out ${
                addOptionOpen ? 'ml-0 max-w-0 opacity-0' : 'ml-0.5 max-w-20 opacity-100'
              }`}
            >
              추가하기
            </span>
          </Button>
        </div>
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
