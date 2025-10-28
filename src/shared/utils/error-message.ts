import type { ApiError } from '@/types/api';

export const BackendErrorCode = {
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

export type BackendErrorCodeValue =
  typeof BackendErrorCode[keyof typeof BackendErrorCode];

type ErrorMessageMap = Record<BackendErrorCodeValue | string, string>;

const ERROR_MESSAGES: ErrorMessageMap = {
  // 0000 Series: General Errors
  // UserRequest: TEMPORARY_ERROR
  [BackendErrorCode.TEMPORARY_ERROR]: '임시 에러가 발생했습니다.',
  // UserRequest: REQUEST_VALIDATION_FAILED
  [BackendErrorCode.REQUEST_VALIDATION_FAILED]:
    '입력값이 올바르지 않습니다. 다시 확인해주세요.',

  // 1000 Series: Authentication and Authorization Errors
  // UserRequest: MISSING_AUTH_HEADER
  [BackendErrorCode.MISSING_AUTH_HEADER]:
    'Authorization 헤더가 존재하지 않습니다.',
  // UserRequest: MALFORMED_BEARER_TOKEN
  [BackendErrorCode.MALFORMED_BEARER_TOKEN]: 'Bearer 토큰 형식이 아닙니다.',
  // UserRequest: INVALID_TOKEN
  [BackendErrorCode.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',
  // UserRequest: INCORRECT_PASSWORD
  [BackendErrorCode.INCORRECT_PASSWORD]: '비밀번호가 올바르지 않습니다.',
  // UserRequest: ACCESS_FORBIDDEN
  [BackendErrorCode.ACCESS_FORBIDDEN]: '접근 권한이 없습니다.',

  // 2000 Series: Workspace Errors
  // UserRequest: WORKSPACE_TITLE_EMPTY
  [BackendErrorCode.WORKSPACE_TITLE_EMPTY]: '워크스페이스 제목을 입력해주세요.',
  // UserRequest: WORKSPACE_MODIFY_FORBIDDEN
  [BackendErrorCode.WORKSPACE_MODIFY_FORBIDDEN]:
    '해당 워크스페이스의 수정 권한이 없습니다.',
  // UserRequest: WORKSPACE_NOT_FOUND
  [BackendErrorCode.WORKSPACE_NOT_FOUND]: '존재하지 않는 워크스페이스입니다.',
  // UserRequest: DUPLICATE_WORKSPACE_TITLE
  [BackendErrorCode.DUPLICATE_WORKSPACE_TITLE]:
    '이미 사용 중인 워크스페이스 제목입니다.',
  // UserRequest: WORKSPACE_TITLE_LENGTH_EXCEEDED
  [BackendErrorCode.WORKSPACE_TITLE_LENGTH_EXCEEDED]:
    '워크스페이스 제목은 20자 이하이어야 합니다.',

  // 3000 Series: Category Errors
  // UserRequest: CATEGORY_NAME_EMPTY
  [BackendErrorCode.CATEGORY_NAME_EMPTY]: '카테고리 이름을 입력해주세요.',
  // UserRequest: CATEGORY_COLOR_EMPTY
  [BackendErrorCode.CATEGORY_COLOR_EMPTY]: '카테고리 색상을 입력해주세요.',
  // UserRequest: DUPLICATE_CATEGORY_ORDER_IN_REQUEST
  [BackendErrorCode.DUPLICATE_CATEGORY_ORDER_IN_REQUEST]:
    '요청에 중복된 순서 값이 있습니다.',
  // UserRequest: DUPLICATE_CATEGORY_ID_IN_REQUEST
  [BackendErrorCode.DUPLICATE_CATEGORY_ID_IN_REQUEST]:
    '요청에 중복된 카테고리 ID가 있습니다.',
  // UserRequest: CATEGORY_MODIFY_FORBIDDEN
  [BackendErrorCode.CATEGORY_MODIFY_FORBIDDEN]:
    '해당 카테고리의 수정 권한이 없습니다.',
  // UserRequest: CATEGORY_OUT_OF_WORKSPACE
  [BackendErrorCode.CATEGORY_OUT_OF_WORKSPACE]:
    '해당 워크스페이스에 속한 카테고리가 아닙니다.',
  // UserRequest: INVALID_REPRESENTATIVE_PLACE_ASSIGNMENT
  [BackendErrorCode.INVALID_REPRESENTATIVE_PLACE_ASSIGNMENT]:
    '다른 카테고리의 장소를 대표로 지정할 수 없습니다.',
  // UserRequest: CATEGORY_NOT_FOUND
  [BackendErrorCode.CATEGORY_NOT_FOUND]: '존재하지 않는 카테고리입니다.',
  // UserRequest: PARTIAL_CATEGORY_NOT_FOUND
  [BackendErrorCode.PARTIAL_CATEGORY_NOT_FOUND]:
    '일부 카테고리를 찾을 수 없습니다.',
  // UserRequest: CATEGORY_NAME_LENGTH_EXCEEDED
  [BackendErrorCode.CATEGORY_NAME_LENGTH_EXCEEDED]:
    '카테고리 이름은 10자를 초과할 수 없습니다.',
  // UserRequest: INVALID_CATEGORY_COLOR_FORMAT
  [BackendErrorCode.INVALID_CATEGORY_COLOR_FORMAT]:
    '유효하지 않은 색상 형식입니다.',

  // 4000 Series: Category Place Errors
  // UserRequest: PLACE_NAME_EMPTY
  [BackendErrorCode.PLACE_NAME_EMPTY]: '장소 이름을 입력해주세요.',
  // UserRequest: PLACE_ADDRESS_EMPTY
  [BackendErrorCode.PLACE_ADDRESS_EMPTY]: '주소를 입력해주세요.',
  // UserRequest: INVALID_LATITUDE_RANGE
  [BackendErrorCode.INVALID_LATITUDE_RANGE]:
    '위도는 -90에서 90 사이여야 합니다.',
  // UserRequest: INVALID_LONGITUDE_RANGE
  [BackendErrorCode.INVALID_LONGITUDE_RANGE]:
    '경도는 -180에서 180 사이여야 합니다.',
  // UserRequest: PLACE_NOT_BELONG_TO_CATEGORY
  [BackendErrorCode.PLACE_NOT_BELONG_TO_CATEGORY]:
    '해당 카테고리에 속한 장소가 아닙니다.',
  // UserRequest: CATEGORY_PLACE_NOT_FOUND
  [BackendErrorCode.CATEGORY_PLACE_NOT_FOUND]:
    '존재하지 않는 카테고리 장소입니다.',

  // 5000 Series: Member Errors
  // UserRequest: MEMBER_NICKNAME_EMPTY
  [BackendErrorCode.MEMBER_NICKNAME_EMPTY]: '닉네임을 입력해주세요.',
  // UserRequest: MEMBER_EMAIL_EMPTY
  [BackendErrorCode.MEMBER_EMAIL_EMPTY]: '이메일을 입력해주세요.',
  // UserRequest: INVALID_NICKNAME_LENGTH
  [BackendErrorCode.INVALID_NICKNAME_LENGTH]:
    '닉네임은 2자 이상 20자 이하이어야 합니다.',
  // UserRequest: INVALID_EMAIL_FORMAT
  [BackendErrorCode.INVALID_EMAIL_FORMAT]: '유효하지 않은 이메일 형식입니다.',
  // UserRequest: MEMBER_NOT_FOUND
  [BackendErrorCode.MEMBER_NOT_FOUND]: '존재하지 않는 회원입니다.',
  // UserRequest: MEMBER_NOT_FOUND_BY_EMAIL
  [BackendErrorCode.MEMBER_NOT_FOUND_BY_EMAIL]:
    '해당 이메일을 가진 회원이 존재하지 않습니다.',
  // UserRequest: DUPLICATE_EMAIL
  [BackendErrorCode.DUPLICATE_EMAIL]: '이미 사용 중인 이메일입니다.',
  // UserRequest: DUPLICATE_NICKNAME
  [BackendErrorCode.DUPLICATE_NICKNAME]: '이미 사용 중인 닉네임입니다.',

  // 6000 Series: Place Search Errors
  // UserRequest: PLACE_SEARCH_KEYWORD_EMPTY
  [BackendErrorCode.PLACE_SEARCH_KEYWORD_EMPTY]: '검색어를 입력해주세요.',
  // UserRequest: INVALID_PLACE_SEARCH_SIZE
  [BackendErrorCode.INVALID_PLACE_SEARCH_SIZE]:
    '검색 결과 개수는 1에서 15 사이여야 합니다.',
  // UserRequest: SEARCHED_PLACE_NAME_EMPTY
  [BackendErrorCode.SEARCHED_PLACE_NAME_EMPTY]:
    '검색된 장소의 이름이 비어 있습니다.',
  // UserRequest: SEARCHED_PLACE_ADDRESS_EMPTY
  [BackendErrorCode.SEARCHED_PLACE_ADDRESS_EMPTY]:
    '검색된 장소의 주소가 비어 있습니다.',
  // UserRequest: INVALID_SEARCHED_PLACE_LATITUDE
  [BackendErrorCode.INVALID_SEARCHED_PLACE_LATITUDE]:
    '검색된 장소의 위도가 유효하지 않습니다.',
  // UserRequest: INVALID_SEARCHED_PLACE_LONGITUDE
  [BackendErrorCode.INVALID_SEARCHED_PLACE_LONGITUDE]:
    '검색된 장소의 경도가 유효하지 않습니다.',
  // UserRequest: KAKAO_PLACE_SEARCH_RESPONSE_NULL
  [BackendErrorCode.KAKAO_PLACE_SEARCH_RESPONSE_NULL]:
    '카카오 장소 검색 API 응답이 올바르지 않습니다.',
  // UserRequest: KAKAO_PLACE_SEARCH_STATUS_CHECK_ERROR
  [BackendErrorCode.KAKAO_PLACE_SEARCH_STATUS_CHECK_ERROR]:
    '카카오 장소 검색 API 응답 상태 확인 중 오류가 발생했습니다.',
  // UserRequest: KAKAO_PLACE_SEARCH_ERROR
  [BackendErrorCode.KAKAO_PLACE_SEARCH_ERROR]:
    '카카오 장소 검색 API 호출 중 오류가 발생했습니다.',
};

export const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.';

export const resolveErrorMessage = (
  code?: BackendErrorCodeValue | string,
  explicitMessage?: string,
  fallbackMessage?: string
): string => {
  const normalizedCode = typeof code === 'string' ? code.trim() : code;
  const trimmedExplicit = explicitMessage?.trim();
  const trimmedFallback = fallbackMessage?.trim();

  if (
    normalizedCode &&
    Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, normalizedCode)
  ) {
    return ERROR_MESSAGES[normalizedCode];
  }

  if (trimmedFallback && trimmedFallback.length > 0) {
    return trimmedFallback;
  }

  if (trimmedExplicit && trimmedExplicit.length > 0) {
    return trimmedExplicit;
  }

  return DEFAULT_ERROR_MESSAGE;
};

export const extractErrorMessage = (error: ApiError | undefined): string => {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return resolveErrorMessage(error.code, error.message);
};
