import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Route } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';
import UserMenu from '@/components/header/user-menu';
import logo from '@/assets/logo-no-background.png';

/**
 * 애플리케이션의 랜딩 페이지 컴포넌트
 * 서비스 소개와 주요 기능을 안내하며, 인증 상태에 따라 다른 액션 버튼 제공
 * UserRequest: 백엔드 API 연동을 위해 토큰 기반 인증으로 변경, 사용자 정보는 API 호출로 조회
 */
const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* UserRequest: 랜딩 페이지에 로그인 상태 표시 - 로그인된 경우 오른쪽 상단에 프로필 아바타 드롭다운, 미로그인 시 로그인 버튼 표시하여 편의성 향상 */}
      {/* UserRequest: 모바일 뷰에서 헤더의 코스잇다를 왼쪽으로 더 붙이기 위해 px-4로 조정하여 모바일 UI 최적화 */}
      {/* UserRequest: 모든 페이지 헤더를 동일한 구조로 통일하여 일관성 유지 (px-4 py-4 md:py-3, 3열 그리드) - 프로필 아이콘이 물리적으로 정확히 동일한 위치에 고정 */}
      {/* 헤더 */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="w-10" />
            
            <div className="flex items-center justify-center gap-1.5 md:gap-2">
              <img src={logo} alt="코스잇다 로고" className="w-10 h-10 object-contain rounded-lg" />
              <span className="font-bold text-lg whitespace-nowrap text-primary">코스잇다</span>
            </div>
            
            <div className="flex items-center justify-end">
              <UserMenu />
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
              코스를 쉽고 빠르게 계획하세요.
              <br />
              카테고리별로 장소를 정리하고, 지도에서 한눈에 확인하세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {isAuthenticated ? (
              <div className="flex flex-col items-center gap-3">
                <Button size="lg" onClick={() => navigate('/workspaces')} className="gap-2 w-full sm:w-auto">
                  내 워크스페이스로 이동
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/community')} className="gap-2 w-full sm:w-auto">
                  커뮤니티 바로가기
                </Button>
              </div>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/auth?tab=register')} className="gap-2">
                  시작하기
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  로그인
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/community')} className="gap-2">
                  커뮤니티 둘러보기
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mt-16">
            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <Calendar className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">카테고리 관리</h3>
              <p className="text-sm text-muted-foreground">
                점심, 카페, 산책 등 <br />카테고리별로 장소를 체계적으로 정리
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <MapPin className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">지도 시각화</h3>
              <p className="text-sm text-muted-foreground">
                카테고리별 색상으로 <br />장소를 지도에 표시하고 경로 확인
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border/50 hover-lift">
              <Route className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">경로 생성</h3>
              <p className="text-sm text-muted-foreground">
                대표 장소를 선택하면 <br />자동으로 이동 경로 생성
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
