import { useEffect, useState } from 'react';
import type { Category, Place } from '@/entities/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { categoryApi } from '@/services/api';
import { PlaceSearchDialog } from '@/features/places/place-search-dialog';
import { PlaceItem } from '@/features/places/place-item';
import { EditCategoryDialog } from './edit-category-dialog';
import { MESSAGES } from '@/shared/constants/messages';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CategoryPlaceView } from '@/services/api/category.service';
import { UI_COPY } from '@/shared/constants/ui-copy';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

interface CategoryCardProps {
  category: Category;
  places: CategoryPlaceView[];
  workspaceIdentifier: string;
  index: number;
  onPlaceClick?: (place: Place) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReordering: boolean;
  isOrderEditMode: boolean;
  showReorderControls: boolean;
  collapseAllSignal: number;
}

// 카테고리 카드 컴포넌트 - 카테고리 정보와 포함된 장소 목록을 표시하며 접기/펼치기 가능
// 사용 위치: features/categories/category-list
export const CategoryCard = ({
  category,
  places,
  workspaceIdentifier,
  index,
  onPlaceClick,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isReordering,
  isOrderEditMode,
  showReorderControls,
  collapseAllSignal,
}: CategoryCardProps) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];

  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await categoryApi.delete(category.id);
      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(MESSAGES.savedCategory.deleteSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.savedCategory.deleteFailed;
      toast.error(message);
    },
    onSettled: () => {
      setDeleteAlertOpen(false);
    },
  });

  // 삭제 버튼 클릭 시 확인 다이얼로그 표시
  const handleDeleteClick = () => {
    setDeleteAlertOpen(true);
  };
  
  // 삭제 확인 후 API 서비스 레이어를 통해 카테고리와 연결된 모든 장소 함께 삭제 (백엔드 연동 시 categoryApi만 수정)
  const handleDeleteConfirm = () => {
    if (deleteCategoryMutation.isPending) return;
    deleteCategoryMutation.mutate();
  };

  const hasRepresentative = !!category.representativePlaceId;

  useEffect(() => {
    // UserRequest: 순서 조정 시작 시 열려 있던 카테고리를 모두 접어 정렬에 집중할 수 있게 한다.
    setIsOpen(false);
  }, [collapseAllSignal]);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="hover-lift">
          <CollapsibleTrigger asChild>
            {/* UserRequest: 카테고리 색상을 지도 마커처럼 동그란 색상 안에 순서 번호를 흰색 숫자로 표시하여 시각적 일관성 유지 */}
            <CardHeader className="flex-row items-center space-y-0 py-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div
                className="w-6 h-6 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {index + 1}
              </div>
              <CardTitle className={`text-base flex-1 md:truncate ${!isOpen ? 'truncate' : ''}`}>{category.name}</CardTitle>
              <div className="ml-2 flex h-8 w-[4.5rem] shrink-0 items-center justify-end" onClick={(e) => e.stopPropagation()}>
                {showReorderControls ? (
                  <>
                    {/* UserRequest: 보기 모드에서는 위/아래 이동 버튼을 하나의 정렬 컨트롤처럼 보여 조작 대상을 명확히 한다. */}
                    <div className="inline-flex items-center overflow-hidden rounded-full border border-border bg-muted/40 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-background/80 disabled:opacity-35"
                        onClick={onMoveUp}
                        disabled={!canMoveUp || isReordering}
                        aria-label={`${category.name} ${UI_COPY.categoryList.moveUpAriaLabel}`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <div className="h-5 w-px bg-border/80" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-background/80 disabled:opacity-35"
                        onClick={onMoveDown}
                        disabled={!canMoveDown || isReordering}
                        aria-label={`${category.name} ${UI_COPY.categoryList.moveDownAriaLabel}`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : !isOrderEditMode ? (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <div aria-hidden="true" className="h-8 w-full" />
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-2">
              {places.length > 0 ? (
                <div className="space-y-2">
                  {places.map((item) => (
                    <PlaceItem
                      key={item.id}
                      categoryPlaceId={item.id}
                      place={item.place}
                      categoryId={category.id}
                      workspaceIdentifier={workspaceIdentifier}
                      isRepresentative={item.isRepresentative}
                      hasRepresentative={hasRepresentative}
                      onPlaceClick={onPlaceClick}
                      isViewMode={isOrderEditMode}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {UI_COPY.place.emptyPrompt}
                </p>
              )}

              {!isOrderEditMode && !showReorderControls && (
                <>
                  {/* UserRequest: 편집 모드 중에서도 순서 조정이 아닐 때만 장소 검색 버튼을 노출한다. */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setSearchDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {UI_COPY.place.openSearchAction}
                  </Button>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <PlaceSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        categoryId={category.id}
        workspaceIdentifier={workspaceIdentifier}
        existingPlaceIds={places.map((item) => item.place.id)}
      />

      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        category={category}
        workspaceIdentifier={workspaceIdentifier}
      />
      
      <DeleteConfirmDialog
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        title={UI_COPY.myCategory.deleteDialog.title}
        description={
          <>
            {UI_COPY.myCategory.deleteDialog.description(category.name)}
            <br />
            <span className="text-destructive">{UI_COPY.myCategory.deleteDialog.warning}</span>
          </>
        }
        onConfirm={handleDeleteConfirm}
        pending={deleteCategoryMutation.isPending}
      />
    </>
  );
};
