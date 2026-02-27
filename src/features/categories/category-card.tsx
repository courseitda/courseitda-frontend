import { useState } from 'react';
import type { Category, Place } from '@/entities/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GripVertical, Plus, Trash2, ChevronDown, Pencil } from 'lucide-react';
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

interface CategoryCardProps {
  category: Category;
  places: CategoryPlaceView[];
  workspaceIdentifier: string;
  index: number;
  onPlaceClick?: (place: Place) => void;
}

// 카테고리 카드 컴포넌트 - 카테고리 정보와 포함된 장소 목록을 표시하며 접기/펼치기 가능
// 사용 위치: features/categories/category-list
export const CategoryCard = ({ category, places, workspaceIdentifier, index, onPlaceClick }: CategoryCardProps) => {
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

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="hover-lift">
          <CollapsibleTrigger asChild>
            {/* UserRequest: 카테고리 색상을 지도 마커처럼 동그란 색상 안에 순서 번호를 흰색 숫자로 표시하여 시각적 일관성 유지 */}
            <CardHeader className="flex-row items-center space-y-0 py-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab mr-3" onClick={(e) => e.stopPropagation()} />
              <div
                className="w-6 h-6 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {index + 1}
              </div>
              <CardTitle className={`text-base flex-1 md:truncate ${!isOpen ? 'truncate' : ''}`}>{category.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 ml-2" 
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
                className="h-8 w-8 ml-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
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
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  장소를 추가해보세요
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setSearchDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                장소 검색
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <PlaceSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        categoryId={category.id}
        workspaceIdentifier={workspaceIdentifier}
      />

      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        category={category}
        workspaceIdentifier={workspaceIdentifier}
      />
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.myCategory.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {UI_COPY.myCategory.deleteDialog.description(category.name)}
              <br />
              <span className="text-destructive">{UI_COPY.myCategory.deleteDialog.warning}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{UI_COPY.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? UI_COPY.common.deleting : UI_COPY.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
