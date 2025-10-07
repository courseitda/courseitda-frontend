import { db } from '../db';
import type { User } from '@/entities/types';

// Mock password hashing (simple for demo)
const hashPassword = (password: string): string => {
  return btoa(password); // In real app, use bcrypt
};

const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

export const registerUser = async (input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<{ user?: User; error?: string }> => {
  try {
    // Validation
    if (!input.email || !input.password || !input.nickname) {
      return { error: '모든 필드를 입력해주세요.' };
    }

    if (input.password.length < 6) {
      return { error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { error: '올바른 이메일 형식이 아닙니다.' };
    }

    // Check duplicate email
    const existing = await db.users.where('email').equals(input.email).first();
    if (existing) {
      return { error: '이미 사용 중인 이메일입니다.' };
    }

    // Create user
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      password: hashPassword(input.password),
      nickname: input.nickname,
      createdAt: new Date().toISOString(),
    };

    await db.users.add(user);

    return { user };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: '회원가입 중 오류가 발생했습니다.' };
  }
};

export const loginUser = async (input: {
  email: string;
  password: string;
}): Promise<{ user?: User; token?: string; error?: string }> => {
  try {
    // Validation
    if (!input.email || !input.password) {
      return { error: '이메일과 비밀번호를 입력해주세요.' };
    }

    // Find user
    const user = await db.users.where('email').equals(input.email).first();
    if (!user) {
      return { error: '존재하지 않는 계정입니다.' };
    }

    // Verify password
    if (!verifyPassword(input.password, user.password)) {
      return { error: '비밀번호가 일치하지 않습니다.' };
    }

    // Generate mock token
    const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

    return { user, token };
  } catch (error) {
    console.error('Login error:', error);
    return { error: '로그인 중 오류가 발생했습니다.' };
  }
};

export const verifyToken = async (token: string): Promise<{ userId?: string; error?: string }> => {
  try {
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
