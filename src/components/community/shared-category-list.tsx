import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Heart, SearchX, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';

type SharedCategoryListProps = {
  categories: SharedSavedCategory[];
  isAuthenticated: boolean;
  likePulse: Record<string, boolean>;
  onOpenDetail: (category: SharedSavedCategory) => void;
  onToggleLike: (category: SharedSavedCategory) => void;
  showEmptyState?: boolean;
};

// UserRequest: 공유 카테고리 목록 렌더링을 공통 컴포넌트로 분리
const SharedCategoryList = ({
  categories,
  isAuthenticated,
  likePulse,
  onOpenDetail,
  onToggleLike,
  showEmptyState = false,
}: SharedCategoryListProps) => (
  <div className="h-[520px] overflow-y-auto pr-1">
    {/* UserRequest: 검색 결과가 없을 때 검색 결과 영역에 이모티콘을 표시 */}
    {showEmptyState && categories.length === 0 ? (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        {/* UserRequest: 검색 결과가 없을 때 이모티콘 대신 적절한 아이콘 사용 */}
        <SearchX className="w-10 h-10 text-muted-foreground/70" />
        <p className="text-sm">검색 결과가 없습니다.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 items-start auto-rows-min">
        {categories.map((category) => (
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
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-primary" />
                  {category.uploader}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleLike(category);
                }}
                aria-label={`${category.title} 찜하기`}
                aria-pressed={category.liked}
                className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-90 focus:outline-none ${likePulse[category.id] ? 'scale-110' : ''}`}
              >
                {likePulse[category.id] && (
                  <span className="absolute inset-0 rounded-full like-heart-ping animate-ping" />
                )}
                <Heart
                  className={`w-7 h-7 ${isAuthenticated ? 'like-heart' : 'text-muted-foreground'} transition-transform duration-150 ${likePulse[category.id] ? 'scale-110' : ''}`}
                  fill={isAuthenticated && category.liked ? 'currentColor' : 'none'}
                  strokeWidth={isAuthenticated && category.liked ? 0 : 1.5}
                />
              </button>
            </CardHeader>
          </Card>
        ))}
      </div>
    )}
  </div>
);

export default SharedCategoryList;
