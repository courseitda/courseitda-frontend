import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
// API 서비스 레이어로 변경 - 백엔드 연동 시 서비스 레이어만 수정하면 됨
import { authApi } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Check, X, AlertCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

// 회원가입 폼 컴포넌트 - 닉네임, 이메일, 비밀번호 입력 및 검증 후 회원 등록
// UserRequest: 백엔드 API 연동을 위해 토큰만 저장하도록 변경
// 사용 위치: pages/Auth
export const RegisterForm = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameCheckLoading, setNicknameCheckLoading] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  // 비밀번호 보안 요구사항(8자 이상, 영문/숫자/특수문자 포함)을 실시간으로 검증
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordRequirementsMet = Object.values(passwordValidation).every(Boolean);
  const isPasswordValid = isPasswordRequirementsMet && passwordsMatch;

  // 비밀번호 입력 시 한글을 자동으로 제거하여 영문/숫자/특수문자만 입력 가능하도록 제한
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    setPassword(filteredValue);
  };

  // 비밀번호 확인 입력 시에도 한글을 자동으로 제거하여 일관성 유지
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    setConfirmPassword(filteredValue);
  };

  // 닉네임 입력 시 중복 확인 상태를 초기화하여 재검증 유도
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameChecked(false);
    setNicknameError('');
  };

  // 닉네임 중복 확인을 API 서비스 레이어를 통해 검증
  const handleNicknameCheck = async () => {
    // 최소 길이 검증 - 2자 미만은 서버 요청 없이 클라이언트에서 차단
    if (nickname.length < 2) {
      setNicknameError('닉네임은 2자 이상 입력해주세요');
      return;
    }

    setNicknameCheckLoading(true);
    
    // API 서비스 레이어를 통해 닉네임 중복 확인 (백엔드 연동 시 authApi만 수정)
    const response = await authApi.checkNicknameDuplicate(nickname);
    
    setNicknameCheckLoading(false);
    
    // API 호출 실패 시 에러 처리
    if (!response.success || !response.data) {
      setNicknameError(response.error?.message || '닉네임 확인 중 오류가 발생했습니다');
      setNicknameChecked(false);
      return;
    }
    
    // 백엔드 API 스펙: isDuplicated = true(중복), false(사용가능)
    if (response.data.isDuplicated) {
      setNicknameError('사용중인 닉네임입니다');
      setNicknameChecked(false);
    } else {
      setNicknameError('');
      setNicknameChecked(true);
    }
  };

  // 이메일 입력 시 형식을 실시간 검증하고 중복 확인 상태 초기화
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailChecked(false);
    
    // 정규식을 통한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError('유효하지 않은 이메일 형식입니다');
    } else {
      setEmailError('');
    }
  };

  // 이메일 중복 확인을 API 서비스 레이어를 통해 검증
  const handleEmailCheck = async () => {
    // 형식 검증 후 서버 요청 - 불필요한 API 호출 방지
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('유효하지 않은 이메일 형식입니다');
      return;
    }

    setEmailCheckLoading(true);
    
    // API 서비스 레이어를 통해 이메일 중복 확인 (백엔드 연동 시 authApi만 수정)
    const response = await authApi.checkEmailDuplicate(email);
    
    setEmailCheckLoading(false);
    
    // API 호출 실패 시 에러 처리
    if (!response.success || !response.data) {
      setEmailError(response.error?.message || '이메일 확인 중 오류가 발생했습니다');
      setEmailChecked(false);
      return;
    }
    
    // 백엔드 API 스펙: isDuplicated = true(중복), false(사용가능)
    if (response.data.isDuplicated) {
      setEmailError('이미 사용중인 이메일입니다');
      setEmailChecked(false);
    } else {
      setEmailError('');
      setEmailChecked(true);
    }
  };

  // 회원가입 폼 제출 - 모든 검증을 통과한 경우에만 회원 등록 진행
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 닉네임 중복 확인 완료 여부 검증
    if (!nicknameChecked) {
      setLoading(false);
      return;
    }

    if (nicknameError) {
      setLoading(false);
      return;
    }

    // 이메일 중복 확인 완료 여부 검증
    if (!emailChecked) {
      setLoading(false);
      return;
    }

    if (emailError) {
      setLoading(false);
      return;
    }

    // 비밀번호 보안 요구사항 및 일치 여부 검증
    if (!isPasswordValid) {
      setLoading(false);
      return;
    }

    // API 서비스 레이어를 통해 회원가입 요청 수행 (백엔드 연동 시 authApi만 수정)
    // 백엔드 API 스펙에 맞춰 파라미터 순서: nickname, email, password
    const registerResponse = await authApi.register({ nickname, email, password });

    // UserRequest: 회원가입 실패 시 에러 토스트 메시지 표시하여 사용자에게 실패 원인 안내
    if (!registerResponse.success || !registerResponse.data) {
      toast.error(registerResponse.error?.message || '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // UserRequest: 회원가입 성공 시 성공 토스트 메시지 표시하여 사용자에게 피드백 제공
    toast.success('회원가입이 완료되었습니다!');

    // 회원가입 성공 후 자동 로그인 처리하여 사용자 경험 개선 (API 서비스 레이어 사용)
    const loginResponse = await authApi.login({ email, password });
    
    // UserRequest: 자동 로그인 실패 시 에러 토스트 메시지 표시 후 로그인 페이지로 이동하여 수동 로그인 유도
    if (!loginResponse.success || !loginResponse.data) {
      toast.error('자동 로그인에 실패했습니다. 다시 로그인해주세요.');
      setLoading(false);
      navigate('/auth?tab=login');
      return;
    }

    // 자동 로그인 성공 시 전역 상태에 토큰만 저장 후 워크스페이스로 이동
    setToken(loginResponse.data.accessToken);
    navigate('/workspaces');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="nickname"
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={handleNicknameChange}
            required
            className="pl-10 pr-24"
          />
          <button
            type="button"
            onClick={handleNicknameCheck}
            disabled={nicknameCheckLoading || nickname.length < 2}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {nicknameCheckLoading ? '확인 중...' : '확인'}
          </button>
        </div>
        {nicknameError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            ✗ {nicknameError}
          </p>
        )}
        {nicknameChecked && !nicknameError && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            ✓ 사용 가능한 닉네임입니다
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="register-email"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={handleEmailChange}
            required
            className="pl-10 pr-24"
          />
          <button
            type="button"
            onClick={handleEmailCheck}
            disabled={emailCheckLoading || email.length === 0}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {emailCheckLoading ? '확인 중...' : '확인'}
          </button>
        </div>
        {emailError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            ✗ {emailError}
          </p>
        )}
        {emailChecked && !emailError && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            ✓ 사용 가능한 이메일입니다
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
            required
            className={`pl-10 ${isPasswordRequirementsMet ? 'pr-20' : 'pr-10'}`}
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
          {isPasswordRequirementsMet && (
            <Check className="absolute right-11 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
          )}
        </div>
      </div>

      {/* 비밀번호 요구사항 체크리스트 */}
      {password && !isPasswordRequirementsMet && (
        <div className="rounded-md border p-3 bg-muted/50">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              {passwordValidation.minLength ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'}>
                최소 8자 이상
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {passwordValidation.hasLetter ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordValidation.hasLetter ? 'text-green-600' : 'text-muted-foreground'}>
                영문자(대소문자) 포함
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {passwordValidation.hasNumber ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                숫자 포함
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {passwordValidation.hasSpecialChar ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
                특수문자 포함
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            className={`pl-10 ${confirmPassword ? 'pr-20' : 'pr-10'}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          {confirmPassword && passwordsMatch && (
            <Check className="absolute right-11 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
          )}
          {confirmPassword && !passwordsMatch && (
            <AlertCircle className="absolute right-11 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
          )}
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-destructive flex items-center gap-1">
            비밀번호가 일치하지 않습니다.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  );
};
