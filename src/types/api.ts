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
  // 에러 코드 - 백엔드에서 정의한 에러 식별자 (예: "2003", "INVALID_EMAIL")
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
  TEMPORARY_ERROR: '0000',
  REQUEST_VALIDATION_FAILED: '0001',
  MISSING_AUTH_HEADER: '1001',
  MALFORMED_BEARER_TOKEN: '1002',
  INVALID_TOKEN: '1003',
  INCORRECT_PASSWORD: '1004',
  ACCESS_FORBIDDEN: '1005',
  WORKSPACE_TITLE_EMPTY: '2001',
  WORKSPACE_MODIFY_FORBIDDEN: '2002',
  WORKSPACE_NOT_FOUND: '2003',
  DUPLICATE_WORKSPACE_TITLE: '2004',
  WORKSPACE_TITLE_LENGTH_EXCEEDED: '2005',
  CATEGORY_NAME_EMPTY: '3001',
  CATEGORY_COLOR_EMPTY: '3002',
  DUPLICATE_CATEGORY_ORDER_IN_REQUEST: '3003',
  DUPLICATE_CATEGORY_ID_IN_REQUEST: '3004',
  CATEGORY_MODIFY_FORBIDDEN: '3005',
  CATEGORY_OUT_OF_WORKSPACE: '3006',
  INVALID_REPRESENTATIVE_PLACE_ASSIGNMENT: '3007',
  CATEGORY_NOT_FOUND: '3008',
  PARTIAL_CATEGORY_NOT_FOUND: '3009',
  CATEGORY_NAME_LENGTH_EXCEEDED: '3010',
  INVALID_CATEGORY_COLOR_FORMAT: '3011',
  PLACE_NAME_EMPTY: '4001',
  PLACE_ADDRESS_EMPTY: '4002',
  INVALID_LATITUDE_RANGE: '4003',
  INVALID_LONGITUDE_RANGE: '4004',
  PLACE_NOT_BELONG_TO_CATEGORY: '4005',
  CATEGORY_PLACE_NOT_FOUND: '4006',
  MEMBER_NICKNAME_EMPTY: '5001',
  MEMBER_EMAIL_EMPTY: '5002',
  INVALID_NICKNAME_LENGTH: '5003',
  INVALID_EMAIL_FORMAT: '5004',
  MEMBER_NOT_FOUND: '5005',
  MEMBER_NOT_FOUND_BY_EMAIL: '5006',
  DUPLICATE_EMAIL: '5007',
  DUPLICATE_NICKNAME: '5008',
  PLACE_SEARCH_KEYWORD_EMPTY: '6001',
  INVALID_PLACE_SEARCH_SIZE: '6002',
  SEARCHED_PLACE_NAME_EMPTY: '6003',
  SEARCHED_PLACE_ADDRESS_EMPTY: '6004',
  INVALID_SEARCHED_PLACE_LATITUDE: '6005',
  INVALID_SEARCHED_PLACE_LONGITUDE: '6006',
  KAKAO_PLACE_SEARCH_RESPONSE_NULL: '6007',
  KAKAO_PLACE_SEARCH_STATUS_CHECK_ERROR: '6008',
  KAKAO_PLACE_SEARCH_ERROR: '6009',
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

