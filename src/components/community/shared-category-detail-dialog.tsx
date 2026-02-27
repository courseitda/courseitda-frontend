import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { CategoryPlacesMap } from '@/components/map/category-places-map';

type SharedCategoryDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SharedSavedCategory | null;
};

type SharedCategoryMapProps = {
  open: boolean;
  places: SharedSavedCategory['places'];
  focusedPlaceId: string | null;
};

const SharedCategoryMap = ({ open, places, focusedPlaceId }: SharedCategoryMapProps) => (
  <CategoryPlacesMap
    open={open}
    places={places.map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    }))}
    focusedPlaceId={focusedPlaceId}
  />
);

// UserRequest: 공유 카테고리 상세 다이얼로그를 공통 컴포넌트로 분리
const SharedCategoryDetailDialog = ({
  open,
  onOpenChange,
  category,
}: SharedCategoryDetailDialogProps) => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    if (open) {
      setFocusedPlaceId(null);
    }
  }, [open, category?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">{category?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-primary" />
              {category?.uploader}
            </span>
            {category?.uploadedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {new Date(category.uploadedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          <SharedCategoryMap open={open} places={category?.places ?? []} focusedPlaceId={focusedPlaceId} />
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              장소 목록
              {category?.placeCount !== undefined && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({category.placeCount}곳)
                </span>
              )}
            </p>
            {/* UserRequest: 장소 목록은 3개까지만 보이고 이후는 스크롤로 확인 */}
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {category?.places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setFocusedPlaceId(place.id)}
                  className="w-full text-left p-3 flex flex-col gap-1 hover:bg-accent/40 transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {place.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{place.addressName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharedCategoryDetailDialog;
