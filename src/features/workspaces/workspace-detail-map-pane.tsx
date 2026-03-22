import { Button } from '@/components/ui/button';
import { MapCanvas } from '@/features/map/map-canvas';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { Place } from '@/entities/types';
import type { WorkspaceCategory } from '@/services/api/category.service';
import { UI_COPY } from '@/shared/constants/ui-copy';

type CategorySummaryItem = {
  sequence: number;
  color: string;
  categoryName: string;
  representativePlace: Place | null;
  representativePlaceName: string;
};

type WorkspaceDetailMapPaneProps = {
  workspaceId: string;
  workspaceIdentifier: string;
  categories: WorkspaceCategory[];
  categorySummaryItems: CategorySummaryItem[];
  focusedPlace: Place | null;
  fullscreenActive: boolean;
  isSheetExpanded: boolean;
  isMapFullscreen: boolean;
  naverMapKeyId: string | null;
  mobileMapHeight: string;
  onToggleFullscreen: () => void;
  onSelectSummaryPlace: (place: Place) => void;
};

// 워크스페이스 상세의 지도 패널을 분리하여 페이지가 레이아웃 조합에 집중하도록 정리
export const WorkspaceDetailMapPane = ({
  workspaceId,
  workspaceIdentifier,
  categories,
  categorySummaryItems,
  focusedPlace,
  fullscreenActive,
  isSheetExpanded,
  isMapFullscreen,
  naverMapKeyId,
  mobileMapHeight,
  onToggleFullscreen,
  onSelectSummaryPlace,
}: WorkspaceDetailMapPaneProps) => (
  <div
    className="relative z-0 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg transition-all duration-300 ease-out md:!h-full"
    style={{ height: mobileMapHeight, opacity: fullscreenActive ? 1 : isSheetExpanded ? 0 : 1 }}
  >
    {fullscreenActive && (
      <div className="absolute bottom-3 left-3 z-20 w-[min(14rem,calc(100%-5rem))] rounded-xl border border-border/60 bg-background/88 p-2 shadow-xl backdrop-blur-sm">
        {/* UserRequest: 지도 크게 보기에서는 좌상단 요약 창을 더 작게 유지하고 불필요한 제목 문구는 제거한다. */}
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
          {categorySummaryItems.map((item) => (
            <button
              type="button"
              key={item.categoryName}
              className={`flex w-full items-center gap-2 rounded-lg border border-border/50 bg-card/85 px-2 py-1.5 text-left transition-colors ${
                item.representativePlace
                  ? 'hover:bg-accent/70 active:bg-accent'
                  : 'cursor-default opacity-70'
              }`}
              onClick={() => {
                if (!item.representativePlace) return;
                onSelectSummaryPlace(item.representativePlace);
              }}
              disabled={!item.representativePlace}
            >
              {/* UserRequest: 지도 요약 창에도 카테고리 목록과 같은 색상 원형 배지와 순번을 함께 표시한다. */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.sequence}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-xs font-semibold">{item.categoryName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.representativePlaceName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}
    {/* UserRequest: 지도 전체 화면 토글 버튼을 아이콘 형태로 배치 */}
    <div className="absolute top-3 right-3 z-20 flex gap-2 md:hidden">
      <Button
        size="icon"
        variant="ghost"
        className="rounded-full border border-transparent bg-background/70 text-foreground hover:bg-background/60 active:bg-background/50 focus-visible:outline-none focus-visible:ring-0"
        onClick={onToggleFullscreen}
        aria-label={isMapFullscreen ? '지도 일반 보기' : '지도 전체 화면 보기'}
      >
        {isMapFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </Button>
    </div>
    {naverMapKeyId ? (
      <MapCanvas
        workspaceId={workspaceId}
        workspaceIdentifier={workspaceIdentifier}
        categories={categories}
        focusedPlace={focusedPlace}
        isFullscreen={fullscreenActive}
      />
    ) : (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {UI_COPY.workspaceDetail.mapNotReady}
          </p>
        </div>
      </div>
    )}
  </div>
);
