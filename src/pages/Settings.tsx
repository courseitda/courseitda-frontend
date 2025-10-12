import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/shared/stores/settings-store';

const Settings = () => {
  const navigate = useNavigate();
  const { kakaoRestApiKey, kakaoJsApiKey, setKakaoRestApiKey, setKakaoJsApiKey } = useSettingsStore();
  
  const [restKey, setRestKey] = useState(kakaoRestApiKey || '');
  const [jsKey, setJsKey] = useState(kakaoJsApiKey || '');

  const handleSave = () => {
    if (!restKey || !jsKey) {
      toast.error('모든 API 키를 입력해주세요.');
      return;
    }

    setKakaoRestApiKey(restKey);
    setKakaoJsApiKey(jsKey);
    toast.success('API 키가 저장되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* UserRequest: 좌우 여백을 0.5배로 축소하여 통일 (px-8 → px-4) */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 md:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left: Back Button */}
            {/* UserRequest: 설정 페이지에 뒤로가기 버튼 추가 */}
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
            <h1 className="text-lg font-bold text-center">설정</h1>
            
            {/* Right: Empty space for symmetry */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-8 max-w-2xl">

        <Card>
          <CardHeader>
            <CardTitle>Kakao API 키</CardTitle>
            <CardDescription>
              장소 검색 및 지도 기능을 사용하려면 Kakao API 키가 필요합니다.
              <br />
              <a
                href="https://developers.kakao.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Kakao Developers
              </a>
              에서 키를 발급받으세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rest-key">REST API 키</Label>
              <Input
                id="rest-key"
                type="password"
                placeholder="REST API 키 입력"
                value={restKey}
                onChange={(e) => setRestKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">장소 검색에 사용됩니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="js-key">JavaScript 키</Label>
              <Input
                id="js-key"
                type="password"
                placeholder="JavaScript 키 입력"
                value={jsKey}
                onChange={(e) => setJsKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">지도 표시에 사용됩니다.</p>
            </div>

            <Button onClick={handleSave} className="w-full">
              저장
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
