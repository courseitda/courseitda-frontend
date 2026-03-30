import { type ReactNode, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Folder, Heart, SearchX } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';

type SharedCategoryListProps = {
  categories: SharedSavedCategory[];
  onOpenDetail: (category: SharedSavedCategory) => void;
  showEmptyState?: boolean;
  viewportClassName?: string;
  size?: 'default' | 'compact';
  renderTrailingAction?: (category: SharedSavedCategory) => ReactNode;
  onFavoriteClick?: (category: SharedSavedCategory) => boolean | void;
};

type SharedCategoryWithFavoriteMeta = SharedSavedCategory & {
  likeCount?: number;
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
  onOpenDetail,
  showEmptyState = false,
  viewportClassName = 'h-[520px]',
  size = 'default',
  renderTrailingAction,
  onFavoriteClick,
}: SharedCategoryListProps) => {
  const [likePulse, setLikePulse] = useState<Record<string, boolean>>({});
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
  const favoriteButtonClassName = isCompact ? 'h-6 w-6' : 'h-7 w-7';
  const favoriteIconClassName = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const triggerLikePulse = (categoryId: string) => {
    setLikePulse((prev) => ({ ...prev, [categoryId]: true }));
    window.setTimeout(() => {
      setLikePulse((prev) => ({ ...prev, [categoryId]: false }));
    }, 200);
  };

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
            const favoriteMeta = category as SharedCategoryWithFavoriteMeta;
            return (
              <Card
                key={category.id}
                className={`hover-lift cursor-pointer ${
                  category.isDeleted ? 'border-border bg-muted/50 hover:bg-muted/70' : ''
                }`}
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
                    <div className="flex min-w-0 items-center gap-1.5">
                      <CardTitle className={`${titleClassName} ${category.isDeleted ? 'text-muted-foreground line-through' : ''}`}>
                        {category.title}
                      </CardTitle>
                      {category.isDeleted && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                          삭제됨
                        </span>
                      )}
                    </div>
                    <div className={metaRowClassName}>
                      {/* UserRequest: 목록 카드 메타 정보를 달력 아이콘 + 날짜 형식으로 표시한다. */}
                      {category.uploadedAt && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-muted-foreground">
                          <Calendar className={`${metaIconClassName} text-muted-foreground`} />
                          {formatUploadedDate(category.uploadedAt)}
                        </span>
                      )}
                      {/* UserRequest: 카드 하트는 크기를 줄여 날짜 오른쪽 메타 라인으로 이동한다. */}
                      <button
                        type="button"
                        aria-label={`${category.title} 찜 표시`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (onFavoriteClick?.(category) === false) {
                            return;
                          }
                          // UserRequest: 삭제 직전 찜 버튼과 동일한 눌림/펄스 애니메이션을 공통 카드에 적용한다.
                          triggerLikePulse(category.id);
                        }}
                        className={`relative inline-flex ${favoriteButtonClassName} shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${
                          likePulse[category.id] ? 'scale-110' : ''
                        }`}
                      >
                        {likePulse[category.id] && (
                          <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
                        )}
                        <Heart
                          className={`${category.liked ? 'like-heart' : 'text-muted-foreground'} ${favoriteIconClassName} transition-transform duration-150 ${
                            likePulse[category.id] ? 'scale-110' : ''
                          }`}
                          fill={category.liked ? 'currentColor' : 'none'}
                          strokeWidth={category.liked ? 0 : 1.5}
                        />
                      </button>
                      {typeof favoriteMeta.likeCount === 'number' && (
                        <span className="-ml-0.5 shrink-0 text-muted-foreground">{favoriteMeta.likeCount}</span>
                      )}
                    </div>
                  </div>
                  {/* UserRequest: 커뮤니티 공유 카테고리 카드 우측에 하트 모양 찜 표시를 공통 노출한다. */}
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
