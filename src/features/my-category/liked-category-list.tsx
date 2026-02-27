import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Heart, User as UserIcon } from 'lucide-react';
import type { SharedSavedCategory } from '@/entities/types';

type LikedCategoryListProps = {
  categories: SharedSavedCategory[];
  isAuthenticated: boolean;
  likePulse: Record<string, boolean>;
  removingLikedIds: Record<string, boolean>;
  onOpenDetail: (category: SharedSavedCategory) => void;
  onRequestUnlike: (categoryId: string, title: string) => void;
};

// UserRequest: 내 카테고리 페이지의 찜 카드 렌더링 중복을 공통 컴포넌트로 분리
export const LikedCategoryList = ({
  categories,
  isAuthenticated,
  likePulse,
  removingLikedIds,
  onOpenDetail,
  onRequestUnlike,
}: LikedCategoryListProps) => (
  <div className="space-y-2">
    {categories.map((category) => (
      <Card
        key={category.id}
        className={`hover-lift transition-all duration-200 ${removingLikedIds[category.id] ? 'opacity-0 scale-95 translate-y-1 pointer-events-none' : ''}`}
        onClick={() => onOpenDetail(category)}
      >
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted/40 text-muted-foreground">
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
              onRequestUnlike(category.id, category.title);
            }}
            aria-label={`${category.title} 찜 해제`}
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
);
