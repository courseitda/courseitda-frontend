import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { registerUser, loginUser } from '@/mock/edge-functions/auth';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Check, X, AlertCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
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

  // 비밀번호 검증 규칙
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

  // 비밀번호 입력 핸들러 (한글 차단)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문, 숫자, 특수문자만 허용 (한글 제외)
    const filteredValue = value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    setPassword(filteredValue);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문, 숫자, 특수문자만 허용 (한글 제외)
    const filteredValue = value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    setConfirmPassword(filteredValue);
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameChecked(false); // 닉네임이 변경되면 중복 확인 상태 초기화
    setNicknameError('');
  };

  // 닉네임 중복 확인 버튼 클릭 핸들러
  const handleNicknameCheck = async () => {
    if (nickname.length < 2) {
      setNicknameError('닉네임은 2자 이상 입력해주세요');
      return;
    }

    setNicknameCheckLoading(true);
    
    // 실제로는 서버 API를 호출해야 함
    setTimeout(() => {
      const usedNicknames = ['admin', 'user', 'test', 'manager', 'guest'];
      if (usedNicknames.includes(nickname.toLowerCase())) {
        setNicknameError('사용중인 닉네임입니다');
        setNicknameChecked(false);
      } else {
        setNicknameError('');
        setNicknameChecked(true);
      }
      setNicknameCheckLoading(false);
    }, 1000); // 1초 딜레이로 로딩 상태 시뮬레이션
  };

  // 이메일 변경 핸들러
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailChecked(false);
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError('유효하지 않은 이메일 형식입니다');
    } else {
      setEmailError('');
    }
  };

  // 이메일 중복 확인
  const handleEmailCheck = async () => {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('유효하지 않은 이메일 형식입니다');
      return;
    }

    setEmailCheckLoading(true);
    
    // 실제로는 서버 API를 호출해야 함
    setTimeout(() => {
      // 예시: 특정 이메일들을 이미 사용 중으로 가정
      const usedEmails = ['test@example.com', 'admin@example.com', 'user@example.com'];
      if (usedEmails.includes(email.toLowerCase())) {
        setEmailError('이미 사용중인 이메일입니다');
        setEmailChecked(false);
      } else {
        setEmailError('');
        setEmailChecked(true);
      }
      setEmailCheckLoading(false);
    }, 1000); // 1초 딜레이로 로딩 상태 시뮬레이션
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 닉네임 중복 확인 검사
    if (!nicknameChecked) {
      setLoading(false);
      return;
    }

    if (nicknameError) {
      setLoading(false);
      return;
    }

    // 이메일 중복 확인 검증
    if (!emailChecked) {
      setLoading(false);
      return;
    }

    if (emailError) {
      setLoading(false);
      return;
    }

    // 비밀번호 검증 확인
    if (!isPasswordValid) {
      setLoading(false);
      return;
    }

    const { user, error } = await registerUser({ email, password, nickname });

    // UserRequest: Display error toast message when registration fails
    if (error || !user) {
      toast.error(error || '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // UserRequest: Display success toast message when registration succeeds
    toast.success('회원가입이 완료되었습니다!');

    // Auto-login after successful registration
    const loginResult = await loginUser({ email, password });
    
    // UserRequest: Display error toast message when auto-login fails
    if (loginResult.error || !loginResult.user || !loginResult.token) {
      toast.error('자동 로그인에 실패했습니다. 다시 로그인해주세요.');
      setLoading(false);
      navigate('/auth?tab=login');
      return;
    }

    setAuth(loginResult.user, loginResult.token);
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
