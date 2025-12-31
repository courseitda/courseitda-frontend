import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// 지도 마커 클릭 시 표시되는 정보창 컴포넌트 - 장소명과 대표 장소 설정 버튼 포함
// UserRequest: 폼 디자인 일관성을 위해 인라인 스타일 대신 Tailwind CSS 사용, CSS 변수로 다크모드 지원
interface PlaceInfoWindowProps {
  placeName: string;
  isRepresentative: boolean;
  onToggleRepresentative: () => void;
  showRepresentativeAction?: boolean;
}

export const PlaceInfoWindow = ({
  placeName,
  isRepresentative,
  onToggleRepresentative,
  showRepresentativeAction = true,
}: PlaceInfoWindowProps) => {
  return (
    <div className="relative inline-block pointer-events-auto">
      {/* 메인 컨테이너 - 반응형 및 모바일 최적화 */}
      <div className="min-w-[200px] max-w-[calc(100vw-4rem)] w-auto p-3 bg-card border border-border rounded-lg shadow-lg">
        <div className={cn('flex items-center justify-center', showRepresentativeAction ? 'gap-4' : '')}>
          {/* 장소명 표시 영역 */}
          <div className={cn('text-sm font-semibold text-foreground truncate', showRepresentativeAction ? 'flex-1' : 'px-2')}>
            {placeName}
          </div>

          {/* 대표 장소 설정/해제 버튼 - 터치 영역 최적화 (최소 44x44px) */}
          {showRepresentativeAction && (
            <Button
              type="button"
              size="icon"
              variant={isRepresentative ? 'default' : 'outline'}
              className={cn(
                'h-10 w-10 shrink-0 rounded-md transition-all',
                isRepresentative && 'bg-accent border-primary',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleRepresentative();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              <Check
                className={cn(
                  'h-4 w-4',
                  isRepresentative ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* 정보창 꼬리표 (하단 화살표) - border와 fill 분리하여 입체감 표현 */}
      <div
        className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 pointer-events-none"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid hsl(var(--border))',
        }}
      />
      <div
        className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-0 h-0 pointer-events-none"
        style={{
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid hsl(var(--card))',
        }}
      />
    </div>
  );
};
