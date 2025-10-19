// Axios HTTP 클라이언트 설정 파일
// 목적: API 요청에 대한 공통 설정 및 인터셉터를 통한 자동화 처리
// - 인증 토큰 자동 추가
// - 에러 응답 자동 처리
// - 백엔드 전환 시 baseURL만 변경하면 전체 API 엔드포인트 자동 전환

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Axios 인스턴스 생성 - 모든 API 요청에 공통 설정 적용
export const apiClient: AxiosInstance = axios.create({
  // 백엔드 API 기본 URL (환경 변수로 관리)
  // 기본값: http://localhost:3000 (프론트엔드와 같은 서버)
  // 백엔드 연동 시: VITE_API_BASE_URL을 백엔드 서버 주소로 변경 (예: https://dev.courseitda.me)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // 요청 타임아웃 설정 (10초) - 느린 네트워크 환경 대응
  timeout: 10000,
  
  // 기본 헤더 설정 - JSON 형식으로 데이터 송수신
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 API 요청 전에 자동 실행
// 주요 기능: 인증 토큰을 Authorization 헤더에 자동 추가
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // localStorage에서 인증 토큰 조회
    // 토큰 키는 auth-store.ts와 동일하게 유지 (courseitda_token)
    const token = localStorage.getItem('courseitda_token');
    
    // 토큰이 존재하면 Authorization 헤더에 Bearer 방식으로 추가
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('courseitda_token');
      localStorage.removeItem('courseitda_user');
      
      // 로그인 페이지로 강제 리다이렉트
      // 현재 페이지 정보는 유지하지 않음 (보안상 이유)
      window.location.href = '/auth';
      
      // 에러 메시지를 더 명확하게 변경
      return Promise.reject(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
    }
    
    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      return Promise.reject(new Error('접근 권한이 없습니다.'));
    }
    
    // 404 Not Found - 리소스를 찾을 수 없음
    if (error.response?.status === 404) {
      return Promise.reject(new Error('요청한 리소스를 찾을 수 없습니다.'));
    }
    
    // 500 Internal Server Error - 서버 오류
    if (error.response?.status === 500) {
      return Promise.reject(new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
    }
    
    // 네트워크 에러 (timeout, connection refused 등)
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return Promise.reject(new Error('네트워크 연결을 확인해주세요.'));
    }
    
    // 타임아웃 에러
    if (error.code === 'ETIMEDOUT') {
      return Promise.reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.'));
    }
    
    // 기타 에러는 원본 에러 또는 서버 응답 메시지 반환
    const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
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

