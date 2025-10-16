import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
import { getPlacesByCategory } from '@/mock/edge-functions/place';
import { PlaceSearchDialog } from '@/features/places/place-search-dialog';
import { PlaceItem } from '@/features/places/place-item';
import { EditCategoryDialog } from './edit-category-dialog';
import { deleteCategory } from '@/mock/edge-functions/category';
import { toast } from 'sonner';

interface CategoryCardProps {
  category: Category;
  workspaceId: string;
  index: number;
  onPlaceClick?: (place: Place) => void;
}

// 카테고리 카드 컴포넌트 - 카테고리 정보와 포함된 장소 목록을 표시하며 접기/펼치기 가능
export const CategoryCard = ({ category, workspaceId, index, onPlaceClick }: CategoryCardProps) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // 카테고리에 속한 장소 목록을 실시간으로 조회하여 변경사항 자동 반영
  const places = useLiveQuery(async () => {
    return await getPlacesByCategory(category.id);
  }, [category.id]);

  // 삭제 버튼 클릭 시 확인 다이얼로그 표시
  const handleDeleteClick = () => {
    setDeleteAlertOpen(true);
  };
  
  // 삭제 확인 후 Edge Function을 통해 카테고리와 연결된 모든 장소 함께 삭제
  const handleDeleteConfirm = async () => {
    const { error } = await deleteCategory(category.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('카테고리가 삭제되었습니다.');
    }
    setDeleteAlertOpen(false);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="hover-lift">
          <CollapsibleTrigger asChild>
            {/* UserRequest: 카테고리 색상 표시를 지도 마커처럼 동그란 색상 안에 순서 번호를 흰색 숫자로 표시 */}
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
              {places && places.length > 0 ? (
                <div className="space-y-2">
                  {places.map((place) => (
                    <PlaceItem
                      key={place.id}
                      place={place}
                      categoryId={category.id}
                      isRepresentative={place.id === category.representativePlaceId}
                      hasRepresentative={!!category.representativePlaceId}
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
        workspaceId={workspaceId}
      />

      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        category={category}
      />
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "<strong>{category.name}</strong>" 카테고리를 정말 삭제하시겠습니까?
              <br />
              <span className="text-destructive">이 작업은 되돌릴 수 없으며, 카테고리에 포함된 모든 장소 연결이 함께 삭제됩니다.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
