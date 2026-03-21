import type { ReactNode, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/header/user-menu';
import DesktopSideLayout from '@/components/layout/desktop-side-layout';
import { ArrowLeft } from 'lucide-react';

type PageHeaderProps = {
  title?: string;
  onBack?: () => void;
  onLogoClick?: () => void;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  showBackButton?: boolean;
  showBrand?: boolean;
  showBrandText?: boolean;
  showBorder?: boolean;
  desktopSideLayout?: boolean;
  headerRef?: RefObject<HTMLElement | null>;
  className?: string;
};

// UserRequest: 헤더 구성을 공통 컴포넌트로 분리
const PageHeader = ({
  title,
  onBack,
  onLogoClick,
  centerContent,
  rightContent,
  showBackButton = false,
  showBrand = true,
  showBrandText = true,
  showBorder = true,
  desktopSideLayout = false,
  headerRef,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => {
    if (window.history.length <= 1) {
      navigate('/');
      return;
    }
    navigate(-1);
  });
  // UserRequest: 기본 중앙 문구는 숨기되, 워크스페이스 상세보기처럼 전달된 커스텀 중앙 콘텐츠는 예외로 노출
  const resolvedCenter = centerContent ?? <div />;
  const resolvedRight = rightContent ?? <UserMenu />;
  const headerContent = (
    <div className={desktopSideLayout ? 'safe-top-header px-8 py-4 md:py-3' : 'safe-top-header container mx-auto px-8 py-4 md:py-3'}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : showBrand ? (
            <button
              type="button"
              className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onLogoClick ?? (() => navigate('/'))}
              aria-label="홈으로 이동"
            >
              {showBrandText && (
                <span className="brand-wordmark text-[1.4rem] whitespace-nowrap text-primary">코스잇다</span>
              )}
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
        <div className="flex items-center justify-center">
          {resolvedCenter}
        </div>
        <div className="flex items-center justify-end">
          {resolvedRight}
        </div>
      </div>
    </div>
  );

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 bg-background ${showBorder ? 'border-b border-border/50' : ''} ${className ?? ''}`}
    >
      {/* UserRequest: 일반 페이지는 헤더도 본문과 같은 데스크톱 좌우 빈 영역 구조를 공유한다. */}
      {desktopSideLayout ? (
        <DesktopSideLayout
          contentClassName="bg-background"
          sideClassName="bg-primary/5"
        >
          {headerContent}
        </DesktopSideLayout>
      ) : (
        headerContent
      )}
    </header>
  );
};

export default PageHeader;
