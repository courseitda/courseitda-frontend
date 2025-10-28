import { apiClient } from '@/lib/axios';
import type { User } from '@/entities/types';
import type { ApiResponse } from '@/types/api';
import { toSuccess, toError } from './http';

// 인증 관련 백엔드 엔드포인트 상수 정의
const LOGIN_ENDPOINT = '/api/auth/login';
const REGISTER_ENDPOINT = '/api/members';
const VERIFY_ENDPOINT = '/api/auth/verify';
const EMAIL_VALIDATION_ENDPOINT = '/api/members/validations/email';
const NICKNAME_VALIDATION_ENDPOINT = '/api/members/validations/nickname';
const USER_ENDPOINT = '/api/users';
const NAVIGATOR_ENDPOINT = '/api/me/navigator';
const DROPDOWN_ENDPOINT = '/api/me/dropdown';
const PROFILE_ENDPOINT = '/api/me/profile';

// 로그인 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 명시적 정의
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터 타입 - 토큰만 포함 (백엔드 API 스펙과 일치)
export interface LoginData {
  tokenType: string;    // 토큰 타입 (기본값: "Bearer")
  accessToken: string;  // JWT 액세스 토큰
}

type LoginApiResponse = {
  tokenType?: string;
  accessToken: string;
};

// 회원가입 요청 파라미터 타입 - 백엔드 API 스펙과 일치하도록 순서 정의
export interface RegisterRequest {
  nickname: string;   // 사용자 닉네임
  email: string;      // 이메일
  password: string;   // 비밀번호 (6자 이상 20자 이하)
}

type RegisterApiResponse = {
  id: number | string;
  nickname: string;
  email: string;
};

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

type VerifyApiResponse = {
  userId: string;
};

// 이메일 중복 검증 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CheckEmailDuplicateData {
  isDuplicated: boolean;  // 중복 여부 (true: 중복/사용불가, false: 사용가능)
}

type EmailDuplicateApiResponse = {
  isDuplicated: boolean;
};

// 닉네임 중복 검증 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CheckNicknameDuplicateData {
  isDuplicated: boolean;  // 중복 여부 (true: 중복/사용불가, false: 사용가능)
}

type NicknameDuplicateApiResponse = {
  isDuplicated: boolean;
};

// 사용자 정보 조회 응답 데이터 타입
export interface UserInfoData {
  user: User;
}

type UserInfoApiResponse = User;

// 네비게이터 정보 조회 응답 데이터 타입 - 헤더 네비게이터용
export interface NavigatorInfoData {
  nickname: string;
}

type NavigatorInfoApiResponse = {
  nickname: string;
};

// 드롭다운 정보 조회 응답 데이터 타입 - 드롭다운 메뉴용
export interface DropdownInfoData {
  nickname: string;
  email: string;
}

type DropdownInfoApiResponse = {
  nickname: string;
  email: string;
};

// 프로필 정보 조회 응답 데이터 타입 - 마이페이지용
export interface ProfileInfoData {
  nickname: string;
  email: string;
}

type ProfileInfoApiResponse = {
  nickname: string;
  email: string;
};

// 인증 API 서비스 객체 - 모든 인증 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const authApi = {
  /**
   * 로그인 API 호출
   * @param data 이메일과 비밀번호
   * @returns API 응답 (성공 시 토큰, 실패 시 에러 정보)
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginData>> => {
    try {
      const response = await apiClient.post<LoginApiResponse>(LOGIN_ENDPOINT, data);
      const payload = response.data;

      return toSuccess<LoginData>({
        tokenType: payload.tokenType ?? 'Bearer',
        accessToken: payload.accessToken,
      });
    } catch (error) {
      return toError(error, 'LOGIN_FAILED', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  },

  /**
   * 회원가입 API 호출
   * @param data 닉네임, 이메일, 비밀번호 (백엔드 API 스펙 순서)
   * @returns API 응답 (성공 시 생성된 사용자 정보, 실패 시 에러 정보)
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterData>> => {
    try {
      const response = await apiClient.post<RegisterApiResponse>(REGISTER_ENDPOINT, data);
      const payload = response.data;

      return toSuccess<RegisterData>({
        id: String(payload.id),
        nickname: payload.nickname,
        email: payload.email,
      });
    } catch (error) {
      return toError(error, 'REGISTER_FAILED', '회원가입에 실패했습니다.');
    }
  },

  /**
   * 토큰 검증 API 호출 - 세션 복원 시 사용
   * 백엔드에서는 별도 검증 엔드포인트가 없으므로 호출 시 501 에러를 반환
   * @param token JWT 토큰 문자열
   */
  verifyToken: async (token: string): Promise<ApiResponse<VerifyTokenData>> => {
    try {
      const response = await apiClient.post<VerifyApiResponse>(VERIFY_ENDPOINT, { token });
      return toSuccess<VerifyTokenData>({
        userId: response.data.userId,
      });
    } catch (error) {
      return toError(error, 'VERIFY_TOKEN_FAILED', '토큰 검증에 실패했습니다.');
    }
  },

  /**
   * 이메일 중복 검증 API 호출
   * @param email 검증할 이메일 주소
   * @returns API 응답 (성공 시 중복 여부, 실패 시 에러 정보)
   */
  checkEmailDuplicate: async (email: string): Promise<ApiResponse<CheckEmailDuplicateData>> => {
    try {
      const response = await apiClient.get<EmailDuplicateApiResponse>(EMAIL_VALIDATION_ENDPOINT, {
        params: { value: email },
      });

      return toSuccess<CheckEmailDuplicateData>({
        isDuplicated: response.data.isDuplicated,
      });
    } catch (error) {
      return toError(error, 'CHECK_EMAIL_DUPLICATE_FAILED', '이메일 중복 확인에 실패했습니다.');
    }
  },

  /**
   * 닉네임 중복 검증 API 호출
   * @param nickname 검증할 닉네임
   * @returns API 응답 (성공 시 중복 여부, 실패 시 에러 정보)
   */
  checkNicknameDuplicate: async (nickname: string): Promise<ApiResponse<CheckNicknameDuplicateData>> => {
    try {
      const response = await apiClient.get<NicknameDuplicateApiResponse>(NICKNAME_VALIDATION_ENDPOINT, {
        params: { value: nickname },
      });

      return toSuccess<CheckNicknameDuplicateData>({
        isDuplicated: response.data.isDuplicated,
      });
    } catch (error) {
      return toError(error, 'CHECK_NICKNAME_DUPLICATE_FAILED', '닉네임 중복 확인에 실패했습니다.');
    }
  },

  /**
   * 사용자 ID로 사용자 정보 조회 API 호출
   * @param userId 사용자 ID
   * @returns API 응답 (성공 시 사용자 정보, 실패 시 에러 정보)
   */
  getUserById: async (userId: string): Promise<ApiResponse<UserInfoData>> => {
    try {
      const response = await apiClient.get<UserInfoApiResponse>(`${USER_ENDPOINT}/${userId}`);

      return toSuccess<UserInfoData>({
        user: response.data,
      });
    } catch (error) {
      return toError(error, 'USER_NOT_FOUND', '사용자 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 네비게이터 정보 조회 API 호출 - 헤더 네비게이터에 표시할 닉네임
   * @param token 인증 토큰 (Authorization 헤더에 적용)
   * @returns API 응답 (성공 시 닉네임만, 실패 시 에러 정보)
   */
  getNavigatorInfo: async (token: string): Promise<ApiResponse<NavigatorInfoData>> => {
    try {
      const response = await apiClient.get<NavigatorInfoApiResponse>(NAVIGATOR_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<NavigatorInfoData>({
        nickname: response.data.nickname,
      });
    } catch (error) {
      return toError(error, 'UNAUTHORIZED', '사용자 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 드롭다운 정보 조회 API 호출 - 사용자 드롭다운 메뉴에 표시할 정보
   * @param token 인증 토큰 (Authorization 헤더에 적용)
   * @returns API 응답 (성공 시 닉네임 + 이메일, 실패 시 에러 정보)
   */
  getDropdownInfo: async (token: string): Promise<ApiResponse<DropdownInfoData>> => {
    try {
      const response = await apiClient.get<DropdownInfoApiResponse>(DROPDOWN_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<DropdownInfoData>({
        nickname: response.data.nickname,
        email: response.data.email,
      });
    } catch (error) {
      return toError(error, 'UNAUTHORIZED', '사용자 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 프로필 정보 조회 API 호출 - 마이페이지에 표시할 사용자 정보
   * @param token 인증 토큰 (Authorization 헤더에 적용)
   * @returns API 응답 (성공 시 닉네임 + 이메일, 실패 시 에러 정보)
   */
  getProfileInfo: async (token: string): Promise<ApiResponse<ProfileInfoData>> => {
    try {
      const response = await apiClient.get<ProfileInfoApiResponse>(PROFILE_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<ProfileInfoData>({
        nickname: response.data.nickname,
        email: response.data.email,
      });
    } catch (error) {
      return toError(error, 'UNAUTHORIZED', '사용자 정보를 불러올 수 없습니다.');
    }
  },
};
