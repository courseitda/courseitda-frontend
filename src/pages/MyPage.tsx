import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';

const MyPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-card">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-8 md:px-4 py-6 md:py-4">
          <h1 className="text-xl font-bold text-center">마이페이지</h1>
        </div>
      </header>

      <main className="container mx-auto px-8 md:px-4 py-12 md:py-8 max-w-2xl">
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

