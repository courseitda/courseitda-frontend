import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Route, LogOut, User as UserIcon, LayoutGrid, Settings } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';
import logo from '@/assets/logo-no-background.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* UserRequest: 랜딩 페이지에 로그인 상태 표시 - 로그인된 경우 오른쪽 상단에 프로필 아바타 드롭다운, 미로그인 시 로그인 버튼 표시 */}
      {/* UserRequest: 모바일 뷰에서 헤더의 코스잇다를 왼쪽으로 더 붙이기 위해 px-4로 조정 */}
      {/* UserRequest: 모든 페이지 헤더를 동일한 구조로 통일 (px-4 py-4 md:py-3, 3열 그리드) - 프로필 아이콘이 물리적으로 정확히 동일한 위치에 고정 */}
      {/* Header */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain" />
              <span className="font-bold text-lg whitespace-nowrap">코스잇다</span>
            </div>
            
            <div></div>
            
            {/* UserRequest: 워크스페이스 상세 페이지의 네비게이션 드로어에서 사용하는 User 아이콘을 아바타에 적용 */}
            {/* UserRequest: 데스크톱 뷰에서 아바타와 닉네임을 함께 표시 (모바일은 아이콘만) */}
            {/* UserRequest: 모든 사용자 메뉴를 마이페이지 / 워크스페이스 / 설정 / 로그아웃 순서로 통일 */}
            <div className="flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-10">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserIcon className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">{user.nickname}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.nickname}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/mypage')} className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/workspaces')} className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    워크스페이스
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
                    <Settings className="w-4 h-4" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                로그인
              </Button>
            )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-20 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">코스잇다</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              당일 일정을 쉽고 빠르게 계획하세요.
              <br />
              카테고리별로 장소를 정리하고, 지도에서 한눈에 확인하세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate('/workspaces')} className="gap-2">
                내 워크스페이스로 이동
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/auth?tab=register')} className="gap-2">
                  시작하기
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  로그인
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mt-16">
            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <Calendar className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">카테고리 관리</h3>
              <p className="text-sm text-muted-foreground">
                점심, 카페, 산책 등 카테고리별로 장소를 체계적으로 정리
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <MapPin className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">지도 시각화</h3>
              <p className="text-sm text-muted-foreground">
                카테고리별 색상으로 장소를 지도에 표시하고 경로 확인
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <Route className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">경로 생성</h3>
              <p className="text-sm text-muted-foreground">
                대표 장소를 선택하면 자동으로 이동 경로 생성
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
