import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserProfile } from '@/shared/hooks/use-user-info';
import { Spinner } from '@/components/ui/spinner';
import PageHeader from '@/components/layout/page-header';

/**
 * 사용자 프로필 정보를 표시하는 마이페이지 컴포넌트
 * 인증되지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const MyPage = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();
  const { nickname, email, loading } = useUserProfile(); // 토큰으로 프로필 정보 조회 (마이페이지용)

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

  // 사용자 정보 로딩 중 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // 사용자 정보 로딩 전까지 컴포넌트 렌더링 방지
  if (!nickname || !email) return null;

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 헤더 구성 요소를 공통 컴포넌트로 교체 */}
      {/* UserRequest: 마이페이지 우측 상단에도 햄버거 메뉴를 노출 */}
      <PageHeader title="마이페이지" />

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
                  <h2 className="font-semibold text-2xl">{nickname}</h2>
                  <p className="text-sm text-muted-foreground">{email}</p>
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
