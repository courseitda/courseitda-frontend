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
import { FileText, Folder, LayoutGrid, LogOut, Menu, User as UserIcon } from 'lucide-react';

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
        {/* UserRequest: 모든 페이지의 사용자 드롭다운 트리거를 아바타 대신 햄버거 메뉴 아이콘으로 표시 */}
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="사용자 메뉴">
          <Menu className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          {/* UserRequest: 사용자 메뉴 프로필 요약 영역에 아바타 아이콘을 왼쪽에 배치하고 우측에 닉네임/이메일을 기존 형태로 배치 */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{dropdownNickname}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
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
        {/* UserRequest: 커뮤니티 관리 페이지를 내 게시물 페이지로 노출 */}
        <DropdownMenuItem onClick={() => navigate('/my-posts')} className="gap-2">
          <FileText className="w-4 h-4" />
          내 게시물
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
