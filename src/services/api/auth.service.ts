// 인증 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화
// 현재는 mock edge-function을 래핑하지만, 추후 Axios 기반 HTTP 요청으로 전환 예정

import { loginUser, registerUser, verifyToken } from '@/mock/edge-functions/auth';
import type { User } from '@/entities/types';

// 로그인 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 명시적 정의
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 타입 - user 정보와 인증 토큰을 포함
export interface LoginResponse {
  user?: User;
  token?: string;
  error?: string;
}

// 회원가입 요청 파라미터 타입
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

// 회원가입 응답 타입
export interface RegisterResponse {
  user?: User;
  error?: string;
}

// 토큰 검증 응답 타입
export interface VerifyTokenResponse {
  userId?: string;
  error?: string;
}

// 인증 API 서비스 객체 - 모든 인증 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const authApi = {
  /**
   * 로그인 API 호출
   * @param data 이메일과 비밀번호
   * @returns 사용자 정보와 인증 토큰 또는 에러 메시지
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.post('/api/auth/login', data)
    return await loginUser(data);
  },

  /**
   * 회원가입 API 호출
   * @param data 이메일, 비밀번호, 닉네임
   * @returns 생성된 사용자 정보 또는 에러 메시지
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.post('/api/auth/register', data)
    return await registerUser(data);
  },

  /**
   * 토큰 검증 API 호출 - 세션 복원 시 사용
   * @param token JWT 토큰 문자열
   * @returns 사용자 ID 또는 에러 메시지
   */
  verifyToken: async (token: string): Promise<VerifyTokenResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.post('/api/auth/verify', { token })
    return await verifyToken(token);
  },
};

