import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Heart, MapPin, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { useSharedCategoryDetail } from '@/shared/hooks/use-community';
import { Spinner } from '@/components/ui/spinner';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useQueryErrorToast } from '@/shared/hooks/use-query-error-toast';

type SharedCategoryDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SharedSavedCategory | null;
  onFavoriteClick?: (category: SharedSavedCategory) => boolean | void;
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
  onFavoriteClick,
}: SharedCategoryDetailDialogProps) => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [likePulse, setLikePulse] = useState(false);
  const {
    data: detailCategory,
    isLoading: detailLoading,
    error: detailError,
  } = useSharedCategoryDetail(category?.id ?? null, open);
  const displayCategory = detailCategory ?? category;

  useEffect(() => {
    // UserRequest: 팝업 재진입 시 이전 선택 상태를 초기화
    if (open) {
      setFocusedPlaceId(null);
      setLikePulse(false);
    }
  }, [open, category?.id]);

  // UserRequest: 공유 카테고리 상세 조회 실패를 모달 내부에서 즉시 안내한다.
  useQueryErrorToast(detailError, MESSAGES.sharedCategory.fetchDetailFailed, open);

  const handleFavoriteClick = () => {
    if (!displayCategory) return;
    if (onFavoriteClick?.(displayCategory) === false) {
      return;
    }

    // UserRequest: 공유 카테고리 상세보기 좌측 상단 하트도 카드와 동일한 펄스 애니메이션을 사용한다.
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* UserRequest: 공유 카테고리 상세보기 창 좌측 상단에 카드와 동일한 하트 찜 표시를 노출한다. */}
        <button
          type="button"
          aria-label={displayCategory ? `${displayCategory.title} 찜 표시` : '찜 표시'}
          onClick={handleFavoriteClick}
          className={`absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${
            likePulse ? 'scale-110' : ''
          }`}
        >
          {likePulse && (
            <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
          )}
          <Heart
            className={`${displayCategory?.liked ? 'like-heart' : 'text-muted-foreground'} w-7 h-7 transition-transform duration-150 ${
              likePulse ? 'scale-110' : ''
            }`}
            fill={displayCategory?.liked ? 'currentColor' : 'none'}
            strokeWidth={displayCategory?.liked ? 0 : 1.5}
          />
        </button>
        <DialogHeader>
          <DialogTitle className="text-center">{displayCategory?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-primary" />
              {displayCategory?.uploader}
            </span>
            {displayCategory?.uploadedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {new Date(displayCategory.uploadedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          {detailLoading && !detailCategory ? (
            <div className="h-64 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          ) : (
            <SharedCategoryMap open={open} places={displayCategory?.places ?? []} focusedPlaceId={focusedPlaceId} />
          )}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              {UI_COPY.sharedCategoryDetail.placeListTitle}
              {displayCategory?.placeCount !== undefined && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({displayCategory.placeCount}{UI_COPY.common.placeCountSuffix})
                </span>
              )}
            </p>
            {/* UserRequest: 장소 목록은 3개까지만 보이고 이후는 스크롤로 확인 */}
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {displayCategory?.places.map((place) => (
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
