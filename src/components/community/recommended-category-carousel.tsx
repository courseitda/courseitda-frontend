import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { SharedSavedCategory } from '@/entities/types';
import { Calendar, Sparkles } from 'lucide-react';
import { useCommunityRecommendCarousel } from '@/shared/hooks/use-community-recommend-carousel';
import { UI_COPY } from '@/shared/constants/ui-copy';

type RecommendedCategoryCarouselProps = {
  categories: SharedSavedCategory[];
  onOpenDetail: (category: SharedSavedCategory) => void;
};

const formatUploadedDate = (uploadedAt: string): string => {
  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) return uploadedAt;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 커뮤니티 추천 캐러셀을 페이지 본문에서 분리하여 렌더 책임을 축소
const RecommendedCategoryCarousel = ({
  categories,
  onOpenDetail,
}: RecommendedCategoryCarouselProps) => {
  const {
    sliderRef,
    trackRef,
    sliderCategories,
    activeIndex,
    isAnimating,
    hasLoop,
    recommendIndex,
    sliderWidth,
    cardWidth,
    cardGap,
    cardImageHeight,
    handleSelectRecommend,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTransitionEnd,
  } = useCommunityRecommendCarousel(categories);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="px-8 pb-4 pt-6 md:pt-8">
      {/* UserRequest: 검색 제거 후 섹션 간 여백 재조정 */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold tracking-tight">{UI_COPY.community.recommendedTitle}</h2>
        </div>
      </div>
      <div className="relative">
        <div className="flex items-center justify-center">
          <div
            ref={sliderRef}
            className="w-full overflow-hidden"
            onPointerDown={(event) => handlePointerDown(event.clientX)}
            onPointerMove={(event) => handlePointerMove(event.clientX)}
            onPointerUp={(event) => handlePointerUp(event.clientX)}
            onPointerLeave={handlePointerLeave}
          >
            <div
              ref={trackRef}
              className={`flex items-center gap-4 ease-out ${isAnimating ? 'transition-transform duration-500' : 'transition-none'}`}
              style={{
                transform: `translateX(${sliderWidth ? (sliderWidth - cardWidth) / 2 - recommendIndex * (cardWidth + cardGap) : 0}px)`,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {sliderCategories.map((category, index) => {
                const normalizedIndex = hasLoop
                  ? (index - 1 + categories.length) % categories.length
                  : index;
                const rawDiff = Math.abs(normalizedIndex - activeIndex);
                const diff = hasLoop
                  ? Math.min(rawDiff, categories.length - rawDiff)
                  : rawDiff;
                const scale = diff === 0 ? 1 : 0.94;
                const opacity = diff === 0 ? 1 : 0.55;
                const blur = diff === 0 ? 'blur(0)' : 'blur(2px)';

                return (
                  <Card
                    key={`${category.id}-${index}`}
                    className="hover-lift flex-shrink-0 cursor-pointer"
                    onClick={() => onOpenDetail(category)}
                    style={{
                      width: cardWidth,
                      transform: `scale(${scale})`,
                      opacity,
                      filter: blur,
                      transition: 'transform 0.35s ease, opacity 0.35s ease, filter 0.35s ease',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-t-xl border-b border-border bg-muted/60 text-xs text-muted-foreground"
                      style={{ height: cardImageHeight }}
                    >
                      이미지 영역
                    </div>
                    <CardContent className="p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <CardTitle className="truncate text-base">{category.title}</CardTitle>
                        <div className="flex min-w-0 items-center gap-2 text-xs">
                          {category.uploadedAt && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatUploadedDate(category.uploadedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        {/* UserRequest: 카드 슬라이더 하단에 현재 위치를 표시하는 pagination dots 추가 */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {categories.map((category, index) => (
            <button
              key={category.id}
              type="button"
              aria-label={`추천 카드 ${index + 1}번으로 이동`}
              aria-pressed={activeIndex === index}
              onClick={() => handleSelectRecommend(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                activeIndex === index ? 'scale-110 bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedCategoryCarousel;
