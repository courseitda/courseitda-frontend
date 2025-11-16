import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';
import { useAuthStore } from '@/shared/stores/auth-store';
import { MapPin } from 'lucide-react';

/**
 * 로그인 및 회원가입을 처리하는 인증 페이지 컴포넌트
 * 이미 인증된 사용자는 자동으로 워크스페이스 목록으로 리다이렉트
 */
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // URL 쿼리 파라미터에서 탭 정보를 읽어 초기 탭 설정 (기본값: login)
  const defaultTab = searchParams.get('tab') || 'login';

  // 이미 로그인된 사용자가 인증 페이지 접근 시 워크스페이스 목록으로 자동 이동
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/workspaces');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-8 md:p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">코스잇다</h1>
          <p className="text-muted-foreground">코스 계획을 시작해보세요 ☺️</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>계정</CardTitle>
            <CardDescription>로그인하거나 새 계정을 만드세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="register">회원가입</TabsTrigger>
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
    </div>
  );
};

export default Auth;
