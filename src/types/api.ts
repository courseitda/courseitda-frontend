// API 응답 공통 타입 정의 파일
// 목적: Spring 백엔드와 프론트엔드 간 일관된 응답 형식을 유지하여 타입 안정성 확보
// Spring의 ResponseEntity 패턴과 호환되는 구조

/**
 * API 응답 공통 인터페이스
 * Spring 백엔드의 표준 응답 형식과 일치하도록 설계
 * 
 * @template T - 응답 데이터의 타입
 * 
 * 예시 (성공):
 * {
 *   success: true,
 *   data: { id: "123", name: "홍대 데이트" },
 *   message: "워크스페이스가 생성되었습니다.",
 *   timestamp: "2025-10-17T08:30:00Z"
 * }
 * 
 * 예시 (실패):
 * {
 *   success: false,
 *   error: {
 *     code: "WORKSPACE_NOT_FOUND",
 *     message: "워크스페이스를 찾을 수 없습니다.",
 *     details: { workspaceId: "123" }
 *   },
 *   timestamp: "2025-10-17T08:30:00Z"
 * }
 */
export interface ApiResponse<T = any> {
  // 요청 성공 여부 - true: 성공, false: 실패
  success: boolean;
  
  // 응답 데이터 (성공 시에만 존재)
  data?: T;
  
  // 성공 메시지 (선택 사항)
  message?: string;
  
  // 에러 정보 (실패 시에만 존재)
  error?: ApiError;
  
  // 응답 시각 (ISO 8601 형식)
  timestamp?: string;
}

/**
 * API 에러 정보 인터페이스
 * 구조화된 에러 정보를 제공하여 클라이언트에서 적절한 처리 가능
 */
export interface ApiError {
  // 에러 코드 - 백엔드에서 정의한 에러 식별자 (예: "INVALID_EMAIL", "WORKSPACE_NOT_FOUND")
  code: string;
  
  // 에러 메시지 - 사용자에게 표시할 친화적인 메시지
  message: string;
  
  // 에러 상세 정보 - 디버깅용 추가 정보 (선택 사항)
  details?: Record<string, any>;
  
  // HTTP 상태 코드
  status?: number;
}

/**
 * 페이지네이션 응답 인터페이스
 * 리스트 API에서 페이징 처리된 데이터 반환 시 사용
 * 
 * @template T - 리스트 아이템의 타입
 */
export interface PaginatedResponse<T> {
  // 현재 페이지의 데이터 배열
  content: T[];
  
  // 페이지 정보
  page: {
    // 현재 페이지 번호 (0부터 시작)
    number: number;
    
    // 페이지당 아이템 수
    size: number;
    
    // 전체 페이지 수
    totalPages: number;
    
    // 전체 아이템 수
    totalElements: number;
    
    // 첫 페이지 여부
    first: boolean;
    
    // 마지막 페이지 여부
    last: boolean;
  };
}

/**
 * 공통 에러 코드 상수
 * 백엔드와 동기화 필요 - Spring에서 정의한 에러 코드와 일치해야 함
 */
export const ApiErrorCode = {
  // 인증 관련
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // 권한 관련
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',
  
  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  
  // 유효성 검증 관련
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  
  // 비즈니스 로직 관련
  DUPLICATE_PLACE: 'DUPLICATE_PLACE',
  PLACE_NOT_IN_CATEGORY: 'PLACE_NOT_IN_CATEGORY',
  
  // 서버 오류
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCodeType = typeof ApiErrorCode[keyof typeof ApiErrorCode];

/**
 * HTTP 메서드 타입
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API 요청 설정 인터페이스
 */
export interface ApiRequestConfig {
  // HTTP 메서드
  method: HttpMethod;
  
  // API 엔드포인트 (baseURL 이후 경로)
  url: string;
  
  // 요청 파라미터 (query string)
  params?: Record<string, any>;
  
  // 요청 본문 (body)
  data?: any;
  
  // 추가 헤더
  headers?: Record<string, string>;
  
  // 타임아웃 (밀리초)
  timeout?: number;
}

/**
 * Mock 응답을 API 응답 형식으로 변환하는 어댑터 함수
 * 현재 mock edge-function의 { data?, error? } 형식을 표준 형식으로 변환
 * 
 * @param mockResponse - Mock API 응답 (현재 형식)
 * @returns 표준 API 응답 형식
 */
export function adaptMockResponse<T>(mockResponse: { 
  error?: string; 
  [key: string]: any 
}): ApiResponse<T> {
  // 에러가 있는 경우
  if (mockResponse.error) {
    return {
      success: false,
      error: {
        code: 'MOCK_ERROR',
        message: mockResponse.error,
        status: 400,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  // 성공한 경우 - error 키를 제외한 나머지를 data로 변환
  const { error, ...data } = mockResponse;
  
  return {
    success: true,
    data: (Object.keys(data).length === 1 && data[Object.keys(data)[0]]) 
      ? data[Object.keys(data)[0]] as T  // 단일 필드면 그 값을 data로
      : data as T,  // 여러 필드면 전체 객체를 data로
    timestamp: new Date().toISOString(),
  };
}

/**
 * Spring 백엔드 응답을 프론트엔드 형식으로 변환하는 어댑터 함수
 * 백엔드 연동 시 사용 예정
 * 
 * @param response - Axios 응답 객체
 * @returns 표준 API 응답 형식
 */
export function adaptBackendResponse<T>(response: any): ApiResponse<T> {
  // Spring의 ResponseEntity는 이미 표준 형식일 가능성이 높음
  // 필요시 변환 로직 추가
  return response.data;
}

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 * 
 * @param error - API 에러 객체
 * @returns 사용자에게 표시할 메시지
 */
export function getErrorMessage(error: ApiError | undefined): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다.';
  }
  
  // 에러 코드별 기본 메시지 매핑
  const defaultMessages: Record<string, string> = {
    [ApiErrorCode.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
    [ApiErrorCode.TOKEN_EXPIRED]: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
    [ApiErrorCode.UNAUTHORIZED]: '로그인이 필요합니다.',
    [ApiErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
    [ApiErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
    [ApiErrorCode.DUPLICATE_EMAIL]: '이미 사용 중인 이메일입니다.',
    [ApiErrorCode.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  };
  
  // 에러 메시지가 있으면 우선 사용, 없으면 기본 메시지 사용
  return error.message || defaultMessages[error.code] || '오류가 발생했습니다.';
}

