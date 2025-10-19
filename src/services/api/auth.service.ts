// 인증 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화
// 현재는 mock edge-function을 래핑하지만, 추후 Axios 기반 HTTP 요청으로 전환 예정

import { loginUser, registerUser, verifyToken, checkEmailDuplicate, checkNicknameDuplicate } from '@/mock/edge-functions/auth';
import type { User } from '@/entities/types';
import type { ApiResponse } from '@/types/api';
import { adaptMockResponse } from '@/types/api';

// 로그인 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 명시적 정의
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터 타입 - user 정보와 인증 토큰을 포함
export interface LoginData {
  user: User;
  token: string;
}

// 회원가입 요청 파라미터 타입
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

// 회원가입 응답 데이터 타입
export interface RegisterData {
  user: User;
}

// 토큰 검증 응답 데이터 타입
export interface VerifyTokenData {
  userId: string;
}

// 이메일 중복 검증 응답 데이터 타입
export interface CheckEmailDuplicateData {
  isDuplicate: boolean;
}

// 닉네임 중복 검증 응답 데이터 타입
export interface CheckNicknameDuplicateData {
  isDuplicate: boolean;
}

// 인증 API 서비스 객체 - 모든 인증 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const authApi = {
  /**
   * 로그인 API 호출
   * @param data 이메일과 비밀번호
   * @returns API 응답 (성공 시 사용자 정보와 토큰, 실패 시 에러 정보)
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await loginUser(data);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.post('/api/auth/login', data)).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: mockResponse.error,
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        user: mockResponse.user!,
        token: mockResponse.token!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 회원가입 API 호출
   * @param data 이메일, 비밀번호, 닉네임
   * @returns API 응답 (성공 시 생성된 사용자 정보, 실패 시 에러 정보)
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await registerUser(data);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.post('/api/auth/register', data)).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'REGISTER_FAILED',
          message: mockResponse.error,
          status: 400,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        user: mockResponse.user!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 토큰 검증 API 호출 - 세션 복원 시 사용
   * @param token JWT 토큰 문자열
   * @returns API 응답 (성공 시 사용자 ID, 실패 시 에러 정보)
   */
  verifyToken: async (token: string): Promise<ApiResponse<VerifyTokenData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await verifyToken(token);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.post('/api/auth/verify', { token })).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: mockResponse.error,
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        userId: mockResponse.userId!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 이메일 중복 검증 API 호출
   * @param email 검증할 이메일 주소
   * @returns API 응답 (성공 시 중복 여부, 실패 시 에러 정보)
   */
  checkEmailDuplicate: async (email: string): Promise<ApiResponse<CheckEmailDuplicateData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await checkEmailDuplicate(email);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get(`/api/auth/check-email?email=${email}`)).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'EMAIL_CHECK_FAILED',
          message: mockResponse.error,
          status: 400,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        isDuplicate: mockResponse.isDuplicate,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 닉네임 중복 검증 API 호출
   * @param nickname 검증할 닉네임
   * @returns API 응답 (성공 시 중복 여부, 실패 시 에러 정보)
   */
  checkNicknameDuplicate: async (nickname: string): Promise<ApiResponse<CheckNicknameDuplicateData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await checkNicknameDuplicate(nickname);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get(`/api/auth/check-nickname?nickname=${nickname}`)).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'NICKNAME_CHECK_FAILED',
          message: mockResponse.error,
          status: 400,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        isDuplicate: mockResponse.isDuplicate,
      },
      timestamp: new Date().toISOString(),
    };
  },
};

