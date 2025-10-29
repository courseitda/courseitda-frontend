import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';

/** Naver 지도 Key ID 안내 - 환경 변수로 주입되며 사용자 입력 불필요 */
const Settings = () => {
  const navigate = useNavigate();
  const keyId = useSettingsStore((state) => state.naverMapKeyId);
  const maskedValue =
    keyId && keyId.length > 8 ? `${keyId.slice(0, 6)}****${keyId.slice(-2)}` : keyId ?? '환경 변수에서 Key ID를 찾을 수 없습니다';

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 다른 페이지와 통일성 유지 (px-8 → px-4) */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* 좌측: 뒤로가기 버튼 */}
            {/* UserRequest: 설정 페이지에 뒤로가기 버튼 추가하여 이전 페이지로 쉽게 이동 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* 중앙: 제목 */}
            {/* UserRequest: 제목을 가운데 정렬하여 시각적 균형 유지 */}
            <h1 className="text-lg font-bold text-center">설정</h1>
            
            {/* 우측: 대칭을 위한 빈 공간 */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-8 max-w-2xl">

        <Card>
          <CardHeader>
            <CardTitle>Naver Maps SDK Key ID</CardTitle>
            <CardDescription>
              REST API 키는 백엔드에서 관리되고, JavaScript SDK용 Key ID는 환경 변수에서 자동으로 주입됩니다. 사용자는 별도로 입력할 필요가 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                JavaScript SDK Key ID는 빌드 시 <code className="text-xs">VITE_NAVER_MAP_KEY_ID</code> 환경 변수에서 자동으로 주입됩니다.
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-mono break-all">{maskedValue}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              키 설정을 변경해야 한다면 관리자 또는 운영 팀에 문의해주세요.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
