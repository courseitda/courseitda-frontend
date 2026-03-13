import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUserNickname } from '@/shared/hooks/use-user-info';
import PageHeader from '@/components/layout/page-header';
import { UI_COPY } from '@/shared/constants/ui-copy';

/**
 * 로그인 및 회원가입을 처리하는 인증 페이지 컴포넌트
 * 이미 인증된 사용자는 자동으로 커뮤니티 페이지로 리다이렉트
 */
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { nickname, loading } = useUserNickname();

  // URL 쿼리 파라미터에서 탭 정보를 읽어 초기 탭 설정 (기본값: login)
  const defaultTab = searchParams.get('tab') || 'login';
  const isRegisterPage = defaultTab === 'register';

  // 실제 사용자 조회가 성공한 경우에만 커뮤니티로 이동
  useEffect(() => {
    if (!isAuthenticated || loading) {
      return;
    }

    if (nickname) {
      // UserRequest: 로그인 후 커뮤니티 페이지로 이동한다.
      // UserRequest: 로그인 직후 뒤로가기가 인증 페이지로 되돌아가지 않도록 히스토리를 대체
      navigate('/community', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, nickname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* UserRequest: 인증 페이지 헤더에서는 좌측 브랜드와 우측 로그인 버튼을 숨긴다. */}
      <PageHeader
        title={UI_COPY.auth.pageTitle}
        showBackButton
        showBorder={false}
        rightContent={<div className="h-10 w-10" aria-hidden="true" />}
      />
      <main className="flex justify-center px-8 pb-8 pt-8 md:px-8 md:pb-4 md:pt-4">
        <div className="w-full max-w-md space-y-20">
          {/* UserRequest: 로그인/회원가입 폼 상단 중앙에 클릭 기능 없는 브랜드 워드마크를 배치한다. */}
          <div className="flex justify-center">
            <span className="brand-wordmark text-[2rem] whitespace-nowrap text-primary md:text-[2.2rem]">코스잇다</span>
          </div>
          {/* UserRequest: 인증 페이지는 박스형 카드 대신 열린 레이아웃으로 폼을 노출한다. */}
          <section className="space-y-6">
            {isRegisterPage ? <RegisterForm /> : <LoginForm />}
            {!isRegisterPage && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>아직 계정이 없나요?</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-sm font-semibold text-primary hover:bg-transparent hover:text-primary/80"
                  onClick={() => navigate('/auth?tab=register')}
                >
                  {UI_COPY.auth.registerTab}
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Auth;
