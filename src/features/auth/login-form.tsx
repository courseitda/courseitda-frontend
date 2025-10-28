import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { authApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

// 로그인 폼 컴포넌트 - 이메일과 비밀번호를 입력받아 인증 처리
// UserRequest: 백엔드 API 연동을 위해 토큰만 저장하도록 변경
// 사용 위치: pages/Auth
export const LoginForm = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 로그인 요청을 처리하고 성공 시 토큰만 저장한 뒤 워크스페이스 목록으로 이동
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // API 서비스 레이어를 통해 로그인 인증 수행 (백엔드 연동 시 authApi만 수정)
    const response = await authApi.login({ email, password });

    // 로그인 실패 시 에러 메시지 표시 후 종료
    if (!response.success || !response.data) {
      toast.error(response.error?.message || '로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 로그인 성공 시 전역 상태에 토큰만 저장 (사용자 정보는 필요할 때 API 호출)
    // UserRequest: Step 3 — 백엔드 토큰 타입을 함께 저장하여 axios 인터셉터가 Authorization 헤더를 구성
    setToken(response.data.accessToken, response.data.tokenType);
    toast.success('로그인 성공!');
    navigate('/workspaces');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
};
