// Axios HTTP 클라이언트 설정 파일
// 목적: API 요청에 대한 공통 설정 및 인터셉터를 통한 자동화 처리
// - 인증 토큰 자동 추가
// - 에러 응답 자동 처리
// - 백엔드 전환 시 baseURL만 변경하면 전체 API 엔드포인트 자동 전환

import axios from 'axios';
import { MESSAGES } from '@/shared/constants/messages';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const TOKEN_KEY = 'courseitda_token';
const TOKEN_TYPE_KEY = 'courseitda_token_type';
const DEFAULT_BASE_URL = 'http://localhost:8080';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

const normalizeAuthorizationHeader = (token: string, tokenType: string): string => {
  const normalizedToken = token.replace(/^Bearer\s+/i, '').trim();
  const normalizedTokenType = tokenType.replace(/\s+/g, ' ').trim() || 'Bearer';

  return `${normalizedTokenType} ${normalizedToken}`;
};

// Axios 인스턴스 생성 - 모든 API 요청에 공통 설정 적용
export const apiClient: AxiosInstance = axios.create({
  // 백엔드 API 기본 URL (환경 변수로 관리)
  // 기본값: http://localhost:8080 (백엔드 서버)
  // 환경 변수 미설정 시에도 로컬 백엔드로 연결되도록 기본 URL 유지
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  
  // 요청 타임아웃 설정 (10초) - 느린 네트워크 환경 대응
  timeout: 10000,
  
  // 기본 헤더 설정 - JSON 형식으로 데이터 송수신
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 요청 인터셉터 - 모든 API 요청 전에 자동 실행
// 주요 기능: 인증 토큰을 Authorization 헤더에 자동 추가
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // localStorage에서 인증 토큰 조회
    // 토큰 키는 auth-store.ts와 동일하게 유지 (courseitda_token)
    const token = localStorage.getItem(TOKEN_KEY);
    const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';

    // UserRequest: 실제 API 연동 시 명시된 Authorization 헤더는 유지하고, 저장 토큰은 Bearer 중복 없이 정규화한다.
    const existingAuthorization = config.headers?.Authorization;
    if (existingAuthorization) {
      return config;
    }

    // 토큰이 존재하면 Authorization 헤더에 Bearer 방식으로 추가
    if (token && config.headers) {
      config.headers.Authorization = normalizeAuthorizationHeader(token, tokenType);
    }
    
    return config;
  },
  (error) => {
    // 요청 설정 중 에러 발생 시 Promise reject 반환
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 모든 API 응답 후 자동 실행
// 주요 기능: 에러 응답에 대한 통합 처리 (특히 401 인증 실패)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 정상 응답(2xx)은 그대로 반환
    return response;
  },
  (error: AxiosError) => {
    // 에러 응답 처리
    
    // 401 Unauthorized - 인증 토큰 만료 또는 유효하지 않음
    if (error.response?.status === 401) {
      // localStorage에서 인증 정보 제거하여 로그아웃 처리
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_TYPE_KEY);
      
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        // 로그인 페이지로 강제 리다이렉트
        // 현재 페이지 정보는 유지하지 않음 (보안상 이유)
        window.location.href = '/auth';
      }
      
      // 에러 메시지를 더 명확하게 변경
      return Promise.reject(new Error(MESSAGES.auth.loginExpired));
    }
    
    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      return Promise.reject(new Error(MESSAGES.common.accessForbidden));
    }
    
    // 404 Not Found - 리소스를 찾을 수 없음
    if (error.response?.status === 404) {
      return Promise.reject(new Error(MESSAGES.common.resourceNotFound));
    }
    
    // 500 Internal Server Error - 서버 오류
    if (error.response?.status === 500) {
      return Promise.reject(new Error(MESSAGES.common.serverError));
    }
    
    // 네트워크 에러 (timeout, connection refused 등)
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return Promise.reject(new Error(MESSAGES.common.networkError));
    }
    
    // 타임아웃 에러
    if (error.code === 'ETIMEDOUT') {
      return Promise.reject(new Error(MESSAGES.common.timeoutError));
    }
    
    // 기타 에러는 서버 응답 메시지를 우선 사용하되 타입 안전하게 처리
    const rawData = error.response?.data;
    const responseMessage =
      rawData && typeof rawData === 'object' && 'message' in rawData
        ? (rawData as { message?: string }).message
        : undefined;

    const errorMessage = responseMessage || error.message || MESSAGES.common.unknownError;
    return Promise.reject(new Error(errorMessage));
  }
);

// 추가 유틸리티 함수: API 클라이언트 baseURL 동적 변경 (개발/운영 환경 전환 시 유용)
export const setApiBaseUrl = (url: string): void => {
  apiClient.defaults.baseURL = url;
};

// 추가 유틸리티 함수: 요청 타임아웃 동적 변경
export const setApiTimeout = (timeout: number): void => {
  apiClient.defaults.timeout = timeout;
};

// 추가 유틸리티 함수: 401 Unauthorized 대응 핸들러 등록
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  unauthorizedHandler = handler;
};
