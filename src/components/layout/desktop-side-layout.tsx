import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DesktopSideLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  sideClassName?: string;
};

// UserRequest: 워크스페이스 상세/카테고리 상세를 제외한 데스크톱 페이지에 좌우 빈 영역을 공통 레이아웃으로 제공한다.
// UserRequest: 일반 페이지의 데스크톱 화면은 모바일 화면이 가운데에 놓인 형태처럼 보이도록 중앙 콘텐츠 폭을 좁게 고정한다.
const DesktopSideLayout = ({
  children,
  className,
  contentClassName,
  sideClassName,
}: DesktopSideLayoutProps) => (
  <div className={cn('md:grid md:grid-cols-[1fr_minmax(0,30rem)_1fr]', className)}>
    <div className={cn('hidden md:block bg-primary/5', sideClassName)} />
    <div className={cn('min-w-0', contentClassName)}>{children}</div>
    <div className={cn('hidden md:block bg-primary/5', sideClassName)} />
  </div>
);

export default DesktopSideLayout;
