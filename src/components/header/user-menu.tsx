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
import { FileText, Folder, House, LayoutGrid, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const UserMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const { nickname: navNickname } = useUserNickname();
  const { nickname: dropdownNickname } = useUserDropdown();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;
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
      <Button onClick={() => navigate('/auth')}>
        로그인
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* UserRequest: 헤더 햄버거 메뉴를 드롭다운 대신 우측 Sheet/Drawer 형태로 전환 */}
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="사용자 메뉴">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] max-w-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
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
              <p className="px-2 text-xs font-semibold text-muted-foreground">보관함</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/my-workspaces'))}
                onClick={() => handleNavigate('/my-workspaces')}
              >
                <LayoutGrid className="w-4 h-4" />
                내 워크스페이스
              </Button>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/my-category'))}
                onClick={() => handleNavigate('/my-category')}
              >
                <Folder className="w-4 h-4" />
                내 카테고리
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground">커뮤니티</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/community'))}
                onClick={() => handleNavigate('/community')}
              >
                <House className="w-4 h-4" />
                커뮤니티 둘러보기
              </Button>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/my-posts'))}
                onClick={() => handleNavigate('/my-posts')}
              >
                <FileText className="w-4 h-4" />
                내 공유 목록
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground">계정</p>
              <Button
                variant="ghost"
                className={menuItemClassName(isActive('/mypage'))}
                onClick={() => handleNavigate('/mypage')}
              >
                <UserIcon className="w-4 h-4" />
                마이페이지
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
            로그아웃
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserMenu;
