import type { ReactNode } from 'react';

type WorkspaceDetailCategoryPanelsProps = {
  categoryListSection: ReactNode;
  fullscreenActive: boolean;
  mobileSheetHeight: string;
  onSheetDragStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onToggleSheetExpanded: () => void;
};

// 카테고리 목록의 데스크톱/모바일 패널을 분리하여 페이지 JSX 중복을 줄임
export const WorkspaceDetailCategoryPanels = ({
  categoryListSection,
  fullscreenActive,
  mobileSheetHeight,
  onSheetDragStart,
  onToggleSheetExpanded,
}: WorkspaceDetailCategoryPanelsProps) => (
  <>
    {/* 카테고리 영역 - 데스크톱에서는 기존 카드 유지 */}
    {/* UserRequest: 카테고리 영역 패딩을 0.5배로 축소하여 공간 효율성 향상 (p-8 → p-4) */}
    {/* UserRequest: 전체 화면에서도 카테고리 칼럼 폭은 유지하되 콘텐츠만 숨겨 지도 폭이 변하지 않도록 처리 */}
    <div
      className={`hidden md:flex md:h-full md:min-h-0 md:flex-col transition-opacity duration-300 ${
        fullscreenActive ? 'md:pointer-events-none md:opacity-0' : 'md:opacity-100'
      }`}
      aria-hidden={fullscreenActive}
    >
      {/* UserRequest: 데스크톱에서도 사용자가 카테고리 목록을 드래그(스크롤)할 수 있도록 min-height 제약을 적용 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full min-h-0 overflow-y-auto rounded-xl border border-border/50 bg-card p-4">
          {categoryListSection}
        </div>
      </div>
    </div>

    {/* Bottom Sheet - 모바일에서만 노출 */}
    {/* UserRequest: Bottom Sheet가 네이버 지도 로고/워터마크보다 위에 렌더되도록 z-index 보정 */}
    {/* UserRequest: 모바일에서는 시트가 화면 하단과 바로 맞닿도록 바깥 여백 제거 */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div
        // UserRequest: 모바일에서 지도 전체보기 전환 시에도 카테고리 영역을 언마운트하지 않고 접어서 모드 상태를 유지한다.
        className={`flex flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-card shadow-xl transition-[height,transform,opacity] duration-300 ease-out ${
          fullscreenActive ? 'pointer-events-none translate-y-full opacity-0' : 'pointer-events-auto translate-y-0 opacity-100'
        }`}
        style={{ height: fullscreenActive ? '0px' : mobileSheetHeight }}
      >
        {/* UserRequest: 시각적으로 강조된 Grabber Handle 제공 */}
        <div className="flex justify-center py-3">
          <div
            className="h-2 w-20 cursor-grab rounded-full bg-muted-foreground/50 touch-none select-none active:cursor-grabbing"
            role="button"
            tabIndex={fullscreenActive ? -1 : 0}
            aria-label="카테고리 패널 높이 조절"
            onPointerDown={onSheetDragStart}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleSheetExpanded();
              }
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {categoryListSection}
        </div>
      </div>
    </div>
  </>
);
