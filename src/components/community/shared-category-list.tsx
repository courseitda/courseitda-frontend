import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Folder, GitFork, SearchX } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

type SharedCategoryListProps = {
  categories: SharedSavedCategory[];
  forkedSharedCategoryMap?: Record<string, boolean>;
  onOpenDetail: (category: SharedSavedCategory) => void;
  showEmptyState?: boolean;
  viewportClassName?: string;
  size?: 'default' | 'compact';
  renderTrailingAction?: (category: SharedSavedCategory) => ReactNode;
};

const formatUploadedDate = (uploadedAt: string): string => {
  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) return uploadedAt;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// UserRequest: 공유 카테고리 목록 렌더링을 공통 컴포넌트로 분리
const SharedCategoryList = ({
  categories,
  forkedSharedCategoryMap = {},
  onOpenDetail,
  showEmptyState = false,
  viewportClassName = 'h-[520px]',
  size = 'default',
  renderTrailingAction,
}: SharedCategoryListProps) => {
  // UserRequest: 커뮤니티 메인 게시판에서는 카드 크기를 5/6 수준으로 축소하고, 다른 화면은 기존 크기를 유지한다.
  const isCompact = size === 'compact';
  const iconWrapperClassName = isCompact
    ? 'h-[1.875rem] w-[1.875rem] rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground'
    : 'w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground';
  const folderIconClassName = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const badgeClassName = isCompact
    ? 'absolute -top-1 -right-1 rounded-full bg-primary px-1 py-0.5 text-[10px] leading-none text-primary-foreground'
    : 'absolute -top-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none text-primary-foreground';
  const cardHeaderClassName = isCompact ? 'flex flex-row items-center gap-2.5 py-2.5' : 'flex flex-row items-center gap-3 py-3';
  const titleClassName = isCompact ? 'truncate text-sm' : 'text-base truncate';
  const metaRowClassName = isCompact ? 'text-[11px] flex items-center gap-1.5 min-w-0' : 'text-xs flex items-center gap-2 min-w-0';
  const metaIconClassName = isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div className={`${viewportClassName} overflow-y-auto pr-1`}>
      {/* UserRequest: 검색 결과가 없을 때 검색 결과 영역에 이모티콘을 표시 */}
      {showEmptyState && categories.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          {/* UserRequest: 검색 결과가 없을 때 이모티콘 대신 적절한 아이콘 사용 */}
          <SearchX className="w-10 h-10 text-muted-foreground/70" />
          <p className="text-sm">{UI_COPY.community.emptySearchResult}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 items-start auto-rows-min">
          {categories.map((category) => {
            const isForked = !!forkedSharedCategoryMap[category.id];
            const forkMetaClassName = isForked ? 'text-violet-600' : 'text-muted-foreground/70';

            return (
              <Card
                key={category.id}
                className="hover-lift cursor-pointer"
                onClick={() => onOpenDetail(category)}
              >
                <CardHeader className={cardHeaderClassName}>
                  <div className="relative">
                    <div className={iconWrapperClassName}>
                      <Folder className={folderIconClassName} />
                    </div>
                    <span className={badgeClassName}>
                      {category.placeCount}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <CardTitle className={titleClassName}>{category.title}</CardTitle>
                    <div className={metaRowClassName}>
                      {/* UserRequest: 목록 카드 메타 정보를 달력 아이콘 + 날짜 형식으로 표시한다. */}
                      {category.uploadedAt && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-muted-foreground">
                          <Calendar className={`${metaIconClassName} text-muted-foreground`} />
                          {formatUploadedDate(category.uploadedAt)}
                        </span>
                      )}
                      <span className={`shrink-0 inline-flex items-center gap-1 ${forkMetaClassName}`}>
                        <GitFork className={metaIconClassName} />
                        {category.forkCount}
                      </span>
                    </div>
                  </div>
                  {renderTrailingAction?.(category)}
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedCategoryList;
