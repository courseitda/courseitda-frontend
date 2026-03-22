import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserDropdown, useUserNickname } from '@/shared/hooks/use-user-info';
import { useLocation, useNavigate } from 'react-router-dom';
import { CornerDownRight, FileText, Folder, House, LayoutGrid, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { UI_COPY } from '@/shared/constants/ui-copy';

type UserMenuProps = {
  onBeforeNavigate?: (proceed: () => void) => void;
  currentMyCategoryLabel?: string;
  currentWorkspaceLabel?: string;
};

const UserMenu = ({ onBeforeNavigate, currentMyCategoryLabel, currentWorkspaceLabel }: UserMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const { nickname: navNickname } = useUserNickname();
  const { nickname: dropdownNickname } = useUserDropdown();
  const [open, setOpen] = useState(false);

  const handleInterceptedAction = (action: () => void) => {
    if (!onBeforeNavigate) {
      action();
      return;
    }

    // UserRequest: 생성 페이지 이탈 경고가 햄버거 메뉴 뒤에 가려지지 않도록 Sheet를 먼저 닫고 확인 모달을 연다.
    setOpen(false);
    window.setTimeout(() => {
      onBeforeNavigate(action);
    }, 0);
  };

  const handleLogout = () => {
    const proceed = () => {
      setOpen(false);
      logout();
      navigate('/');
    };
    handleInterceptedAction(proceed);
  };

  const handleNavigate = (path: string) => {
    const proceed = () => {
      setOpen(false);
      navigate(path);
    };
    handleInterceptedAction(proceed);
  };

  const handleLoginClick = () => {
    // UserRequest: 닉네임 조회에 실패한 잔존 토큰 상태에서는 로그인 진입 전에 인증 정보를 정리한다.
    if (isAuthenticated && !navNickname) {
      logout();
    }

    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;
  const isWorkspaceDetailActive = location.pathname.startsWith('/workspace/');
  const isMyWorkspaceSectionActive = location.pathname === '/my-workspaces';
  const isMyCategoryDetailActive = location.pathname.startsWith('/my-category/');
  const isMyCategorySectionActive = location.pathname === '/my-category';
  const menuItemClassName = (active: boolean) =>
    [
      'w-full justify-start gap-2 transition-all duration-150',
      'hover:bg-accent/60 hover:text-foreground',
      'focus-visible:ring-2 focus-visible:ring-primary/30',
      'active:scale-[0.98]',
      active ? 'bg-primary/10 text-primary' : '',
    ].join(' ');

  if (!isAuthenticated || !navNickname) {
    return (
      <Button onClick={handleLoginClick}>
        {UI_COPY.userMenu.login}
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* UserRequest: 헤더 햄버거 메뉴를 드롭다운 대신 우측 Sheet/Drawer 형태로 전환 */}
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={UI_COPY.userMenu.triggerAriaLabel}>
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] max-w-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>{UI_COPY.userMenu.sheetTitle}</SheetTitle>
        </SheetHeader>

        {/* UserRequest: 로그아웃은 마이페이지 바로 아래가 아닌 메뉴 하단 고정 영역에 배치 */}
        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="w-full rounded-lg border border-border/60 bg-card p-3 text-left">
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <UserIcon className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-none truncate">{dropdownNickname}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground">{UI_COPY.userMenu.storageSection}</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isMyWorkspaceSectionActive)}
                onClick={() => handleNavigate('/my-workspaces')}
              >
                <LayoutGrid className="w-4 h-4" />
                {UI_COPY.userMenu.myWorkspace}
              </Button>
              {currentWorkspaceLabel && (
                <button
                  type="button"
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-5 py-2 text-left text-sm transition-colors hover:bg-accent/60',
                    isWorkspaceDetailActive ? 'bg-primary/10 text-primary' : 'text-primary',
                  ].join(' ')}
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {/* UserRequest: 워크스페이스 상세보기에서는 햄버거 메뉴에 현재 워크스페이스를 하위 페이지처럼 표시한다. */}
                  <CornerDownRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">{currentWorkspaceLabel}</span>
                </button>
              )}
              <Button
                variant="ghost"
                className={menuItemClassName(isMyCategorySectionActive)}
                onClick={() => handleNavigate('/my-category')}
              >
                <Folder className="w-4 h-4" />
                {UI_COPY.userMenu.myCategory}
              </Button>
              {currentMyCategoryLabel && (
                <button
                  type="button"
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-5 py-2 text-left text-sm transition-colors hover:bg-accent/60',
                    isMyCategoryDetailActive ? 'bg-primary/10 text-primary' : 'text-primary',
                  ].join(' ')}
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {/* UserRequest: 카테고리 상세보기에서는 햄버거 메뉴에 현재 카테고리를 하위 페이지처럼 표시한다. */}
                  <CornerDownRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">{currentMyCategoryLabel}</span>
                </button>
              )}
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground">{UI_COPY.userMenu.communitySection}</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/community'))}
                onClick={() => handleNavigate('/community')}
              >
                <House className="w-4 h-4" />
                {UI_COPY.userMenu.communityExplore}
              </Button>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/my-posts'))}
                onClick={() => handleNavigate('/my-posts')}
              >
                <FileText className="w-4 h-4" />
                {UI_COPY.userMenu.myPosts}
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground">{UI_COPY.userMenu.accountSection}</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/mypage'))}
                onClick={() => handleNavigate('/mypage')}
              >
                <UserIcon className="w-4 h-4" />
                {UI_COPY.userMenu.myPage}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 pb-1">
          <Separator className="mb-2" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive transition-all duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98]"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {UI_COPY.userMenu.logout}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserMenu;
