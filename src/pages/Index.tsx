import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Route } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth-store';

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-8 md:px-4 py-20 md:py-16">
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
