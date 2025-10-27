// 인증 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화
// 현재는 mock edge-function을 래핑하지만, 추후 Axios 기반 HTTP 요청으로 전환 예정
//
// 백엔드 연동 시 변경 방법:
// 1. import 부분에서 mock edge-function 제거
// 2. axios 인스턴스 import 추가: import { apiClient } from '@/lib/axios';
// 3. 각 메서드의 구현부를 주석에 있는 axios 코드로 교체

import { 
  loginUser, 
  registerUser, 
  verifyToken, 
  checkEmailDuplicate, 
  checkNicknameDuplicate,
  getUserById,
  getNavigatorInfo,
  getDropdownInfo,
  getProfileInfo
} from '@/mock/edge-functions/auth';
import type { User } from '@/entities/types';
import type { ApiResponse } from '@/types/api';
import { adaptMockResponse } from '@/types/api';

// 로그인 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 명시적 정의
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터 타입 - 토큰만 포함 (백엔드 API 스펙과 일치)
export interface LoginData {
  tokenType: string;    // 토큰 타입 (항상 "Bearer")
  accessToken: string;  // JWT 액세스 토큰
}

// 회원가입 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 순서 정의
export interface RegisterRequest {
  nickname: string;   // 사용자 닉네임
  email: string;      // 이메일
  password: string;   // 비밀번호 (6자 이상 20자 이하)
}

// 회원가입 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface RegisterData {
  id: string;         // 회원 ID (백엔드는 number이지만 JSON에서 string으로 처리)
  nickname: string;   // 닉네임
  email: string;      // 이메일 (비밀번호는 응답에 포함되지 않음)
}

// 토큰 검증 응답 데이터 타입
export interface VerifyTokenData {
  userId: string;
}

// 이메일 중복 검증 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CheckEmailDuplicateData {
  isDuplicated: boolean;  // 중복 여부 (true: 중복/사용불가, false: 사용가능)
}

// 닉네임 중복 검증 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CheckNicknameDuplicateData {
  isDuplicated: boolean;  // 중복 여부 (true: 중복/사용불가, false: 사용가능)
}

// 사용자 정보 조회 응답 데이터 타입
export interface UserInfoData {
  user: User;
}

// 네비게이터 정보 조회 응답 데이터 타입 - 헤더 네비게이터용
export interface NavigatorInfoData {
  nickname: string;
}

// 드롭다운 정보 조회 응답 데이터 타입 - 드롭다운 메뉴용
export interface DropdownInfoData {
  nickname: string;
  email: string;
}

// 프로필 정보 조회 응답 데이터 타입 - 마이페이지용
export interface ProfileInfoData {
  nickname: string;
  email: string;
}

// 인증 API 서비스 객체 - 모든 인증 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const authApi = {
  /**
   * 로그인 API 호출
   * @param data 이메일과 비밀번호
   * @returns API 응답 (성공 시 토큰, 실패 시 에러 정보)
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
    
    // 백엔드 API 스펙에 맞춰 토큰만 반환 (사용자 정보는 별도 API로 조회)
    return {
      success: true,
      data: {
        tokenType: 'Bearer',
        accessToken: mockResponse.token!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 회원가입 API 호출
   * @param data 닉네임, 이메일, 비밀번호 (백엔드 API 스펙 순서)
   * @returns API 응답 (성공 시 생성된 사용자 정보, 실패 시 에러 정보)
   * 
   * 백엔드 엔드포인트: POST /api/members
   * 백엔드 응답 예시: { id: 1, nickname: "홍길동", email: "user@example.com" }
   * 백엔드 Location Header: /api/members/{id}
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await registerUser(data);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: 
    // const response = await apiClient.post('/api/members', data);
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
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
    
    // 백엔드 API 스펙에 맞춰 응답: { id, nickname, email }
    return {
      success: true,
      data: {
        id: mockResponse.id!,
        nickname: mockResponse.nickname!,
        email: mockResponse.email!,
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
   * 
   * 백엔드 엔드포인트: GET /api/members/validations/email?value={email}
   * 백엔드 응답 예시: { isDuplicated: false } (false = 사용 가능, true = 중복)
   */
  checkEmailDuplicate: async (email: string): Promise<ApiResponse<CheckEmailDuplicateData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await checkEmailDuplicate(email);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.get(`/api/members/validations/email?value=${encodeURIComponent(email)}`);
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
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
    
    // 백엔드 API 스펙에 맞춰 응답: { isDuplicated: boolean }
    return {
      success: true,
      data: {
        isDuplicated: mockResponse.isDuplicated,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 닉네임 중복 검증 API 호출
   * @param nickname 검증할 닉네임
   * @returns API 응답 (성공 시 중복 여부, 실패 시 에러 정보)
   * 
   * 백엔드 엔드포인트: GET /api/members/validations/nickname?value={nickname}
   * 백엔드 응답 예시: { isDuplicated: false } (false = 사용 가능, true = 중복)
   */
  checkNicknameDuplicate: async (nickname: string): Promise<ApiResponse<CheckNicknameDuplicateData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await checkNicknameDuplicate(nickname);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.get(`/api/members/validations/nickname?value=${encodeURIComponent(nickname)}`);
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
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
    
    // 백엔드 API 스펙에 맞춰 응답: { isDuplicated: boolean }
    return {
      success: true,
      data: {
        isDuplicated: mockResponse.isDuplicated,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 사용자 ID로 사용자 정보 조회 API 호출
   * @param userId 사용자 ID
   * @returns API 응답 (성공 시 사용자 정보, 실패 시 에러 정보)
   */
  getUserById: async (userId: string): Promise<ApiResponse<UserInfoData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getUserById(userId);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get(`/api/users/${userId}`)).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: mockResponse.error,
          status: 404,
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
   * 네비게이터 정보 조회 API 호출 - 헤더 네비게이터에 표시할 닉네임
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 닉네임만, 실패 시 에러 정보)
   */
  getNavigatorInfo: async (token: string): Promise<ApiResponse<NavigatorInfoData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getNavigatorInfo(token);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get('/api/me/navigator', { headers: { Authorization: `Bearer ${token}` } })).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: mockResponse.error,
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        nickname: mockResponse.nickname!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 드롭다운 정보 조회 API 호출 - 사용자 드롭다운 메뉴에 표시할 정보
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 닉네임 + 이메일, 실패 시 에러 정보)
   */
  getDropdownInfo: async (token: string): Promise<ApiResponse<DropdownInfoData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getDropdownInfo(token);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get('/api/me/dropdown', { headers: { Authorization: `Bearer ${token}` } })).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: mockResponse.error,
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        nickname: mockResponse.nickname!,
        email: mockResponse.email!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 프로필 정보 조회 API 호출 - 마이페이지에 표시할 사용자 정보
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 닉네임 + 이메일, 실패 시 에러 정보)
   */
  getProfileInfo: async (token: string): Promise<ApiResponse<ProfileInfoData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getProfileInfo(token);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시: return (await apiClient.get('/api/me/profile', { headers: { Authorization: `Bearer ${token}` } })).data
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: mockResponse.error,
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: {
        nickname: mockResponse.nickname!,
        email: mockResponse.email!,
      },
      timestamp: new Date().toISOString(),
    };
  },
};

