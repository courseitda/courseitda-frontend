import { useState } from 'react';
import type { Place } from '@/entities/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Trash2, Check, MoreHorizontal, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { placeApi, categoryApi } from '@/services/api';
import { MESSAGES } from '@/shared/constants/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UI_COPY } from '@/shared/constants/ui-copy';

interface PlaceItemProps {
  categoryPlaceId: string;
  place: Place;
  categoryId: string;
  workspaceIdentifier: string;
  isRepresentative: boolean;
  hasRepresentative: boolean;
  onPlaceClick?: (place: Place) => void;
  isViewMode?: boolean;
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
  isViewMode = false,
}: PlaceItemProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceIdentifier, 'categories'];
  const [menuOpen, setMenuOpen] = useState(false);

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
      toast.success(MESSAGES.place.removeSuccess);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : MESSAGES.place.removeFailed;
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
      const message = error instanceof Error ? error.message : MESSAGES.place.representativeFailed;
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (deletePlaceMutation.isPending) return;
    deletePlaceMutation.mutate();
    setMenuOpen(false);
  };

  // UserRequest: 네이버 지도 바로가기 메뉴 추가 - placeUrl로 새 창을 열어 외부 지도를 확인
  const handleOpenInMap = () => {
    if (!place.placeUrl) {
      toast.error(UI_COPY.place.linkMissing);
      return;
    }
    window.open(place.placeUrl, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
  };

  const handleSetRepresentative = () => {
    if (toggleRepresentativeMutation.isPending) return;
    toggleRepresentativeMutation.mutate(!isRepresentative);
    setMenuOpen(false);
  };

  const isProcessing = deletePlaceMutation.isPending || toggleRepresentativeMutation.isPending;

  return (
    <div
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
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={UI_COPY.place.menuOpenAriaLabel}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          alignOffset={-8}
          side="bottom"
          className="w-36"
        >
          {/* UserRequest: 롱프레스 컨텍스트 메뉴처럼 대표 지정/삭제를 메뉴 내부로 이동 */}
          <DropdownMenuItem
            onSelect={() => handleOpenInMap()}
            className="gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {UI_COPY.place.openInMapAction}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              handleSetRepresentative();
            }}
            disabled={toggleRepresentativeMutation.isPending}
            className={isRepresentative ? 'font-semibold text-primary' : ''}
          >
            <Check className="w-3.5 h-3.5 mr-2" />
            {isRepresentative ? UI_COPY.place.unsetRepresentativeAction : UI_COPY.place.setRepresentativeAction}
          </DropdownMenuItem>
          {!isViewMode && (
            <>
              {/* UserRequest: 보기 모드에서는 장소 삭제 액션을 숨겨 정렬 중심 흐름을 유지한다. */}
              <DropdownMenuItem
                onSelect={() => {
                  handleDelete();
                }}
                disabled={isProcessing}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                {UI_COPY.place.deleteAction}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
