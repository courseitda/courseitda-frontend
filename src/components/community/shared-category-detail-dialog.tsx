import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, GitFork, MapPin, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { CategoryPlacesMap } from '@/components/map/category-places-map';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { useSharedCategoryDetail } from '@/shared/hooks/use-community';
import { Spinner } from '@/components/ui/spinner';
import { MESSAGES } from '@/shared/constants/messages';

type SharedCategoryDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SharedSavedCategory | null;
  isForked?: boolean;
  onToggleFork?: (category: SharedSavedCategory) => Promise<'forked' | 'unforked' | false> | 'forked' | 'unforked' | false;
  forkPending?: boolean;
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
  isForked = false,
  onToggleFork,
  forkPending = false,
}: SharedCategoryDetailDialogProps) => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [displayForkCount, setDisplayForkCount] = useState(0);
  const [displayIsForked, setDisplayIsForked] = useState(isForked);
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
      setConfirmOpen(false);
    }
  }, [open, category?.id]);

  useEffect(() => {
    setDisplayIsForked(isForked);
  }, [isForked, category?.id]);

  useEffect(() => {
    setDisplayForkCount(category?.forkCount ?? 0);
  }, [category?.forkCount, category?.id]);

  useEffect(() => {
    // UserRequest: 공유 카테고리 상세 조회 실패를 모달 내부에서 즉시 안내한다.
    if (detailError && open) {
      toast.error(detailError.message || MESSAGES.sharedCategory.fetchDetailFailed);
    }
  }, [detailError, open]);

  useEffect(() => {
    if (detailCategory) {
      setDisplayForkCount(detailCategory.forkCount);
    }
  }, [detailCategory]);

  const runToggleFork = async () => {
    if (!displayCategory || !onToggleFork || forkPending) return;

    const result = await onToggleFork(displayCategory);
    if (result === 'forked') {
      setDisplayIsForked(true);
      setDisplayForkCount((previous) => previous + 1);
      return;
    }
    if (result === 'unforked') {
      setDisplayIsForked(false);
      setDisplayForkCount((previous) => Math.max(0, previous - 1));
    }
  };

  const handleForkClick = async () => {
    if (displayIsForked) {
      setConfirmOpen(true);
      return;
    }

    await runToggleFork();
  };

  const handleConfirmUnfork = async () => {
    setConfirmOpen(false);
    await runToggleFork();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
            {displayCategory && onToggleFork && (
              <button
                type="button"
                onClick={() => void handleForkClick()}
                disabled={forkPending}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition-all',
                  displayIsForked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-primary/30 bg-primary/10 text-primary hover:scale-105 hover:bg-primary/15',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                ].join(' ')}
                aria-label={displayIsForked ? `${displayCategory.title} fork 해제` : `${displayCategory.title} 내 카테고리로 복사`}
                title={displayIsForked ? 'fork 해제' : '내 카테고리로 복사'}
              >
                <GitFork className="h-4 w-4" />
                <span>{displayForkCount}</span>
              </button>
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
              장소 목록
              {displayCategory?.placeCount !== undefined && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({displayCategory.placeCount}곳)
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
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UI_COPY.sharedCategoryDetail.unforkDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {displayCategory ? UI_COPY.sharedCategoryDetail.unforkDialog.description(displayCategory.title) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forkPending}>{UI_COPY.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmUnfork()} disabled={forkPending}>
              {UI_COPY.sharedCategoryDetail.unforkDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default SharedCategoryDetailDialog;
