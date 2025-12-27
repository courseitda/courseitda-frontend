import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/header/user-menu';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo-no-background.png';

type PageHeaderProps = {
  title?: string;
  showLogo?: boolean;
  onBack?: () => void;
  onLogoClick?: () => void;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  showUserMenu?: boolean;
  className?: string;
};

// UserRequest: 헤더 구성을 공통 컴포넌트로 분리
const PageHeader = ({
  title,
  showLogo = false,
  onBack,
  onLogoClick,
  centerContent,
  rightContent,
  showUserMenu = true,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => {
    // UserRequest: 히스토리가 없을 때는 홈으로 이동해 뒤로가기 무반응을 방지
    if (window.history.length <= 1) {
      navigate('/');
      return;
    }
    navigate(-1);
  });
  // UserRequest: 헤더 중앙/우측 커스텀 콘텐츠를 지원
  const resolvedCenter = centerContent ?? (showLogo ? (
    <div
      className="flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onLogoClick ?? (() => navigate('/'))}
    >
      <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
      <span className="font-bold text-lg whitespace-nowrap text-primary">코스잇다</span>
    </div>
  ) : (
    <span className="text-lg font-semibold whitespace-nowrap">{title}</span>
  ));
  const resolvedRight = rightContent ?? (showUserMenu ? <UserMenu /> : <div className="w-10" />);

  return (
    <header className={`border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className ?? ''}`}>
      <div className="container mx-auto px-4 py-4 md:py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center">
            {resolvedCenter}
          </div>
          <div className="flex items-center justify-end">
            {resolvedRight}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
