import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { removePlace } from '@/mock/edge-functions/place';
import { setRepresentativePlace } from '@/mock/edge-functions/category';

interface PlaceItemProps {
  place: Place;
  categoryId: string;
  isRepresentative: boolean;
  hasRepresentative: boolean;
  onPlaceClick?: (place: Place) => void;
}

// 장소 아이템 컴포넌트 - 카테고리 내 장소 정보를 표시하며 대표 장소 설정 및 삭제 기능 제공
export const PlaceItem = ({ place, categoryId, isRepresentative, hasRepresentative, onPlaceClick }: PlaceItemProps) => {
  // 장소 삭제 처리 - Edge Function을 통해 카테고리와의 연결 제거
  const handleDelete = async () => {
    const { error } = await removePlace(place.id, categoryId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('장소가 삭제되었습니다.');
    }
  };

  // 대표 장소 설정/해제 처리 - 이미 대표 장소면 해제, 아니면 설정
  const handleSetRepresentative = async () => {
    const newPlaceId = isRepresentative ? null : place.id;
    const { error } = await setRepresentativePlace(categoryId, newPlaceId);
    
    if (error) {
      toast.error(error);
    }
    // UserRequest: 대표장소 설정 시 토스트 메시지를 제거하여 불필요한 알림 방지
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-all group ${hasRepresentative && !isRepresentative ? 'opacity-50' : ''}`}>
      <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isRepresentative ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'}`} />
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onPlaceClick?.(place)}
      >
        <p className={`text-sm truncate ${isRepresentative ? 'font-semibold' : 'font-medium'}`}>{place.name}</p>
        <p className="text-xs text-muted-foreground truncate">{place.address}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${isRepresentative ? 'bg-primary/10' : ''}`}
          onClick={handleSetRepresentative}
        >
          <Check
            className={`w-4 h-4 ${isRepresentative ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
};
