import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserNickname } from '@/shared/hooks/use-user-info';
import { MapPin } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 로그인 및 회원가입을 처리하는 인증 페이지 컴포넌트
 * 이미 인증된 사용자는 자동으로 커뮤니티 페이지로 리다이렉트
 */
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, logout } = useAuthStore();
  const { nickname, loading } = useUserNickname();

  // URL 쿼리 파라미터에서 탭 정보를 읽어 초기 탭 설정 (기본값: login)
  const defaultTab = searchParams.get('tab') || 'login';

  // 토큰만 남은 비정상 상태를 정리하고, 실제 사용자 조회 성공 시에만 커뮤니티로 이동
  useEffect(() => {
    if (!isAuthenticated || loading) {
      return;
    }

    if (nickname) {
      // UserRequest: 로그인 후 커뮤니티 페이지로 이동한다.
      // UserRequest: 로그인 직후 뒤로가기가 인증 페이지로 되돌아가지 않도록 히스토리를 대체
      navigate('/community', { replace: true });
      return;
    }

    // UserRequest: 비로그인 상태에서 로그인 버튼 클릭 시 인증 화면에 머물도록 잔존 토큰을 정리한다.
    logout();
  }, [isAuthenticated, loading, logout, navigate, nickname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* UserRequest: 인증 페이지도 공통 헤더를 사용해 전 페이지 헤더 구조 통일 */}
      <PageHeader title={UI_COPY.auth.pageTitle} />
      <main className="flex items-center justify-center p-8 md:p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">{UI_COPY.auth.brandTitle}</h1>
            <p className="text-muted-foreground">{UI_COPY.auth.subtitle}</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>{UI_COPY.auth.accountCardTitle}</CardTitle>
              <CardDescription>{UI_COPY.auth.accountCardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{UI_COPY.auth.loginTab}</TabsTrigger>
                  <TabsTrigger value="register">{UI_COPY.auth.registerTab}</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-6">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register" className="mt-6">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
