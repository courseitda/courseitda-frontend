import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';

type SharedCategoryDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SharedSavedCategory | null;
};

// UserRequest: 공유 카테고리 상세 다이얼로그를 공통 컴포넌트로 분리
const SharedCategoryDetailDialog = ({
  open,
  onOpenChange,
  category,
}: SharedCategoryDetailDialogProps) => (
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
        <div className="w-full h-96 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
          지도 영역 (임시)
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            장소 목록
            {category?.placeCount !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({category.placeCount}곳)
              </span>
            )}
          </p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {category?.places.map((place) => (
              <div key={place.id} className="p-3 flex flex-col gap-1">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {place.name}
                </span>
                <span className="text-xs text-muted-foreground">{place.addressName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default SharedCategoryDetailDialog;
