import { useEffect, useRef, useState } from 'react';
import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, Check, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { placeApi, categoryApi } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PlaceItemProps {
  categoryPlaceId: string;
  place: Place;
  categoryId: string;
  workspaceIdentifier: string;
  isRepresentative: boolean;
  hasRepresentative: boolean;
  onPlaceClick?: (place: Place) => void;
}

// 장소 아이템 컴포넌트 - 카테고리 내 장소 정보를 표시하며 대표 장소 설정 및 삭제 기능 제공
// 사용 위치: features/categories/category-card
export const PlaceItem = ({
  categoryPlaceId,
  place,
  categoryId,
  workspaceIdentifier,
  isRepresentative,
  hasRepresentative,
  onPlaceClick,
}: PlaceItemProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];
  // UserRequest: 케밥 메뉴를 항상 노출하고 버튼 클릭 시에만 대표/삭제 액션을 펼치도록 처리
  const [showActions, setShowActions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showActions) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActions]);

  // 장소 삭제 처리 - API 서비스 레이어를 통해 카테고리와의 연결 제거
  const deletePlaceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await placeApi.remove(categoryId, categoryPlaceId);
      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('장소가 삭제되었습니다.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '장소 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  // 대표 장소 설정/해제 처리
  const toggleRepresentativeMutation = useMutation({
    mutationFn: async (nextIsRepresentative: boolean) => {
      const { error } = nextIsRepresentative
        ? await categoryApi.setRepresentativePlace(categoryId, categoryPlaceId)
        : await categoryApi.unsetRepresentativePlace(categoryId);

      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '대표 장소 설정에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (deletePlaceMutation.isPending) return;
    deletePlaceMutation.mutate();
    setShowActions(false);
  };

  const handleSetRepresentative = () => {
    if (toggleRepresentativeMutation.isPending) return;
    toggleRepresentativeMutation.mutate(!isRepresentative);
    setShowActions(false);
  };

  const isProcessing = deletePlaceMutation.isPending || toggleRepresentativeMutation.isPending;

  return (
    <div
      ref={containerRef}
      className={`flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-all ${hasRepresentative && !isRepresentative ? 'opacity-50' : ''}`}
    >
      <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isRepresentative ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'}`} />
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onPlaceClick?.(place)}
      >
        <p className={`text-sm truncate ${isRepresentative ? 'font-semibold' : 'font-medium'}`}>{place.name}</p>
        <p className="text-xs text-muted-foreground truncate">{place.addressName}</p>
      </div>
      <div className="flex items-center">
        {showActions ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
              disabled={isProcessing}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isRepresentative ? 'bg-primary/10' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                handleSetRepresentative();
              }}
              disabled={toggleRepresentativeMutation.isPending}
            >
              <Check
                className={`w-4 h-4 ${isRepresentative ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'}`}
              />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(event) => {
              event.stopPropagation();
              setShowActions(true);
            }}
            aria-label="장소 메뉴 열기"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};
