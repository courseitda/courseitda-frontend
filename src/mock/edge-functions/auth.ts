import { db } from '../db';
import type { User } from '@/entities/types';

// 인증 관련 Edge Functions
// 사용 위치: features/auth (login-form, register-form)

// Mock 비밀번호 해싱 - 실제 운영에서는 bcrypt 등 보안 라이브러리 사용 필요
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 인코딩 (데모용)
};

// 비밀번호 검증 - 입력된 비밀번호와 저장된 해시 비교
const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

// 회원가입 Edge Function - 입력 검증 후 사용자 생성
export const registerUser = async (input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<{ user?: User; error?: string }> => {
  try {
    // 필수 입력값 검증
    if (!input.email || !input.password || !input.nickname) {
      return { error: '모든 필드를 입력해주세요.' };
    }

    // UserRequest: 비밀번호 최소 길이를 6자에서 8자로 변경하여 프론트엔드 검증과 일치시킴
    if (input.password.length < 8) {
      return { error: '비밀번호는 최소 8자 이상이어야 합니다.' };
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { error: '올바른 이메일 형식이 아닙니다.' };
    }

    // 이메일 중복 확인 - 동일한 이메일로 가입 방지
    const existing = await db.users.where('email').equals(input.email).first();
    if (existing) {
      return { error: '이미 사용 중인 이메일입니다.' };
    }

    // 사용자 생성 및 DB 저장
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      password: hashPassword(input.password),
      nickname: input.nickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.users.add(user);

    return { user };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: '회원가입 중 오류가 발생했습니다.' };
  }
};

// 로그인 Edge Function - 이메일과 비밀번호로 사용자 인증
export const loginUser = async (input: {
  email: string;
  password: string;
}): Promise<{ user?: User; token?: string; error?: string }> => {
  try {
    // 필수 입력값 검증
    if (!input.email || !input.password) {
      return { error: '이메일과 비밀번호를 입력해주세요.' };
    }

    // 이메일로 사용자 조회
    const user = await db.users.where('email').equals(input.email).first();
    if (!user) {
      return { error: '존재하지 않는 계정입니다.' };
    }

    // 비밀번호 검증 - 해시 비교
    if (!verifyPassword(input.password, user.password)) {
      return { error: '비밀번호가 일치하지 않습니다.' };
    }

    // Mock 토큰 생성 - 실제 운영에서는 JWT 등 사용
    const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

    return { user, token };
  } catch (error) {
    console.error('Login error:', error);
    return { error: '로그인 중 오류가 발생했습니다.' };
  }
};

// 토큰 검증 Edge Function - 토큰의 유효성 확인
export const verifyToken = async (token: string): Promise<{ userId?: string; error?: string }> => {
  try {
    // 토큰 디코딩 및 사용자 존재 여부 확인
    const decoded = JSON.parse(atob(token));
    const user = await db.users.get(decoded.userId);
    
    if (!user) {
      return { error: '유효하지 않은 토큰입니다.' };
    }

    return { userId: user.id };
  } catch (error) {
    return { error: '유효하지 않은 토큰입니다.' };
  }
};

// 이메일 중복 검증 Edge Function - 회원가입 전 이메일 중복 여부 확인
export const checkEmailDuplicate = async (email: string): Promise<{ isDuplicate: boolean; error?: string }> => {
  try {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isDuplicate: false, error: '올바른 이메일 형식이 아닙니다.' };
    }

    // 이메일 중복 확인
    const existing = await db.users.where('email').equals(email).first();
    
    return { isDuplicate: !!existing };
  } catch (error) {
    console.error('Email check error:', error);
    return { isDuplicate: false, error: '이메일 확인 중 오류가 발생했습니다.' };
  }
};

// 닉네임 중복 검증 Edge Function - 회원가입 전 닉네임 중복 여부 확인
export const checkNicknameDuplicate = async (nickname: string): Promise<{ isDuplicate: boolean; error?: string }> => {
  try {
    // 닉네임 길이 검증
    if (!nickname || nickname.trim().length < 2) {
      return { isDuplicate: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
    }

    if (nickname.length > 20) {
      return { isDuplicate: false, error: '닉네임은 최대 20자까지 가능합니다.' };
    }

    // 닉네임 중복 확인
    const existing = await db.users.where('nickname').equals(nickname.trim()).first();
    
    return { isDuplicate: !!existing };
  } catch (error) {
    console.error('Nickname check error:', error);
    return { isDuplicate: false, error: '닉네임 확인 중 오류가 발생했습니다.' };
  }
};

// 사용자 ID로 사용자 정보 조회 Edge Function
// 백엔드 연동 시: GET /api/me/profile 등으로 변경
export const getUserById = async (userId: string): Promise<{ user?: User; error?: string }> => {
  try {
    // 사용자 ID로 조회
    const user = await db.users.get(userId);
    
    if (!user) {
      return { error: '사용자를 찾을 수 없습니다.' };
    }

    return { user };
  } catch (error) {
    console.error('Get user error:', error);
    return { error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
};

// 네비게이터 정보 조회 Edge Function - 헤더 네비게이터에 표시할 사용자 닉네임
// 백엔드 연동 시: GET /api/me/navigator
export const getNavigatorInfo = async (token: string): Promise<{ nickname?: string; error?: string }> => {
  try {
    // 토큰 검증 및 사용자 조회
    const decoded = JSON.parse(atob(token));
    const user = await db.users.get(decoded.userId);
    
    if (!user) {
      return { error: '유효하지 않은 토큰입니다.' };
    }

    // 백엔드 API 스펙: { nickname: string }
    return { nickname: user.nickname };
  } catch (error) {
    console.error('Get navigator info error:', error);
    return { error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
};

// 드롭다운 정보 조회 Edge Function - 사용자 드롭다운 메뉴에 표시할 정보
// 백엔드 연동 시: GET /api/me/dropdown
export const getDropdownInfo = async (token: string): Promise<{ nickname?: string; email?: string; error?: string }> => {
  try {
    // 토큰 검증 및 사용자 조회
    const decoded = JSON.parse(atob(token));
    const user = await db.users.get(decoded.userId);
    
    if (!user) {
      return { error: '유효하지 않은 토큰입니다.' };
    }

    // 백엔드 API 스펙: { nickname: string, email: string }
    return { 
      nickname: user.nickname,
      email: user.email 
    };
  } catch (error) {
    console.error('Get dropdown info error:', error);
    return { error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
};

// 프로필 정보 조회 Edge Function - 마이페이지에 표시할 사용자 정보
// 백엔드 연동 시: GET /api/me/profile
export const getProfileInfo = async (token: string): Promise<{ nickname?: string; email?: string; error?: string }> => {
  try {
    // 토큰 검증 및 사용자 조회
    const decoded = JSON.parse(atob(token));
    const user = await db.users.get(decoded.userId);
    
    if (!user) {
      return { error: '유효하지 않은 토큰입니다.' };
    }

    // 백엔드 API 스펙: { nickname: string, email: string }
    return { 
      nickname: user.nickname,
      email: user.email 
    };
  } catch (error) {
    console.error('Get profile info error:', error);
    return { error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
};