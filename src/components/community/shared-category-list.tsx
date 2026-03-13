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
  renderTrailingAction,
}: SharedCategoryListProps) => (
  <div className={`${viewportClassName} overflow-y-auto pr-1`}>
    {/* UserRequest: 검색 결과가 없을 때 검색 결과 영역에 이모티콘을 표시 */}
    {showEmptyState && categories.length === 0 ? (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        {/* UserRequest: 검색 결과가 없을 때 이모티콘 대신 적절한 아이콘 사용 */}
        <SearchX className="w-10 h-10 text-muted-foreground/70" />
        <p className="text-sm">{UI_COPY.community.emptySearchResult}</p>
      </div>
    ) : (
      <div
        className="grid gap-1.5 items-start auto-rows-min"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
      >
        {categories.map((category) => {
          const isForked = !!forkedSharedCategoryMap[category.id];
          const forkMetaClassName = isForked ? 'text-violet-600' : 'text-muted-foreground/70';

          return (
            <Card
              key={category.id}
              className="hover-lift cursor-pointer"
              onClick={() => onOpenDetail(category)}
            >
              <CardHeader className="flex flex-row items-center gap-3 py-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] leading-none px-1.5 py-0.5 rounded-full">
                    {category.placeCount}
                  </span>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{category.title}</CardTitle>
                  {/* UserRequest: 작성자 닉네임 길이와 무관하게 등록일 위치를 고정한다. */}
                  <div className="text-xs flex items-center gap-2 min-w-0">
                    {/* UserRequest: 목록 카드 메타 정보를 달력 아이콘 + 날짜 형식으로 표시한다. */}
                    {category.uploadedAt && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatUploadedDate(category.uploadedAt)}
                      </span>
                    )}
                    <span className={`shrink-0 inline-flex items-center gap-1 ${forkMetaClassName}`}>
                      <GitFork className="w-3.5 h-3.5" />
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

export default SharedCategoryList;
