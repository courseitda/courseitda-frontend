import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserDropdown, useUserNickname } from '@/shared/hooks/use-user-info';
import { useNavigate } from 'react-router-dom';
import { Folder, LayoutGrid, LogOut, User as UserIcon } from 'lucide-react';

const UserMenu = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { nickname: navNickname } = useUserNickname();
  const { nickname: dropdownNickname, email } = useUserDropdown();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || !navNickname) {
    return (
      <Button onClick={() => navigate('/auth')}>
        로그인
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-10">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-medium">{navNickname}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{dropdownNickname}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/mypage')} className="gap-2">
          <UserIcon className="w-4 h-4" />
          마이페이지
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-workspaces')} className="gap-2">
          <LayoutGrid className="w-4 h-4" />
          내 워크스페이스
        </DropdownMenuItem>
        {/* UserRequest: 내 카테고리 메뉴를 사용자 드롭다운에 추가해 별도 페이지로 이동 */}
        <DropdownMenuItem onClick={() => navigate('/my-category')} className="gap-2">
          <Folder className="w-4 h-4" />
          내 카테고리
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
          <LogOut className="w-4 h-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
