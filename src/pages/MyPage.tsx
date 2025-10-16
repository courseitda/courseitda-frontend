import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';

/**
 * 사용자 프로필 정보를 표시하는 마이페이지 컴포넌트
 * 인증되지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트
 */
const MyPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  // 미인증 사용자 접근 시 로그인 페이지로 자동 이동하여 보안 유지
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // 로그아웃 처리 후 로그인 페이지로 이동
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // 사용자 정보 로딩 전까지 컴포넌트 렌더링 방지
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 통일 (px-8 → px-4) */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left: Back Button */}
            {/* UserRequest: 마이페이지에 뒤로가기 버튼 추가 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Center: Title */}
            {/* UserRequest: 제목 가운데 정렬 */}
            <h1 className="text-lg font-bold text-center">마이페이지</h1>
            
            {/* Right: Empty space for symmetry */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-8 max-w-2xl">
        <div className="space-y-6">
          {/* 사용자 정보 카드 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6 pb-4">
                <Avatar className="w-32 h-32">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <UserIcon className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h2 className="font-semibold text-2xl">{user.nickname}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 로그아웃 */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MyPage;

