import { apiClient } from '@/lib/axios';
import type { Workspace } from '@/entities/types';
import type { ApiResponse } from '@/types/api';
import { BackendErrorCode } from '@/shared/utils/error-message';
import { MESSAGES } from '@/shared/constants/messages';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { toSuccess, toError } from './http';

// 워크스페이스 관련 백엔드 엔드포인트 상수 정의
const WORKSPACES_ENDPOINT = '/api/workspaces';
const MY_WORKSPACES_ENDPOINT = '/api/me/workspaces';
const TITLE_VALIDATION_ENDPOINT = '/api/workspaces/validations/title';

// 워크스페이스 생성 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface CreateWorkspaceRequest {
  title: string;  // 워크스페이스 제목 (최대 20자)
  // ownerId는 토큰에서 추출되므로 요청에 포함하지 않음
}

type CreateWorkspaceApiResponse = {
  identifier: string;
  title: string;
  modifiedAt: string;
};

// 워크스페이스 생성 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CreateWorkspaceData {
  identifier: string;   // 워크스페이스 식별자
  title: string;        // 워크스페이스 제목
  modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
}

// 워크스페이스 수정 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface UpdateWorkspaceRequest {
  title: string;  // 워크스페이스 제목 (필수, 최대 20자)
}

type UpdateWorkspaceApiResponse = {
  identifier: string;
  title: string;
  modifiedAt: string;
};

// 워크스페이스 수정 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface UpdateWorkspaceData {
  identifier: string;   // 워크스페이스 식별자
  title: string;        // 워크스페이스 제목
  modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
}

// 워크스페이스 삭제 응답 타입
export interface DeleteWorkspaceResponse {
  error?: string;
}

// 워크스페이스 조회 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface GetWorkspaceData {
  identifier: string;   // 워크스페이스 식별자
  title: string;        // 워크스페이스 제목
  modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
}

type GetWorkspaceApiResponse = {
  identifier: string;
  title: string;
  modifiedAt: string;
};

// 워크스페이스 제목 중복 검증 응답 타입
export interface CheckWorkspaceTitleDuplicateResponse {
  isDuplicated: boolean;
  error?: string;
}

type TitleDuplicateApiResponse = {
  isDuplicated: boolean;
};

// 내 워크스페이스 목록 조회 응답 타입 - 백엔드 API 스펙과 일치
export interface MyWorkspacesData {
  workspaces: Array<{
    identifier: string;   // 워크스페이스 고유 식별자
    title: string;        // 워크스페이스 제목
    modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
  }>;
}

type MyWorkspaceApiResponse = {
  workspaces: Array<{
    identifier: string;
    title: string;
    modifiedAt: string;
  }>;
};

// 워크스페이스 API 서비스 객체 - 모든 워크스페이스 관련 API 호출을 중앙 관리
export const workspaceApi = {
  /**
   * 워크스페이스 생성 API 호출
   * @param token 인증 토큰 (사용자 식별용)
   * @param data 워크스페이스 제목
   * @returns API 응답 (성공 시 생성된 워크스페이스 정보, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: POST /api/workspaces
   * 백엔드 요청 예시: { title: "서울 여행 계획" }
   * 백엔드 응답 예시: { identifier: "abc123", title: "서울 여행 계획", modifiedAt: "2024-10-22T14:30:00" }
   * 백엔드 Location Header: /api/workspaces/{identifier}
   */
  create: async (token: string, data: CreateWorkspaceRequest): Promise<ApiResponse<CreateWorkspaceData>> => {
    try {
      const response = await apiClient.post<CreateWorkspaceApiResponse>(
        WORKSPACES_ENDPOINT,
        data,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return toSuccess<CreateWorkspaceData>({
        identifier: response.data.identifier,
        title: response.data.title,
        modifiedAt: response.data.modifiedAt,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.REQUEST_VALIDATION_FAILED,
        MESSAGES.workspace.createFailed,
      );
    }
  },

  /**
   * 워크스페이스 수정 API 호출
   * @param identifier 워크스페이스 식별자
   * @param data 수정할 필드 (제목)
   * @returns API 응답 (성공 시 수정된 워크스페이스 정보, 실패 시 에러 정보)
   */
  update: async (identifier: string, data: UpdateWorkspaceRequest): Promise<ApiResponse<UpdateWorkspaceData>> => {
    try {
      const response = await apiClient.patch<UpdateWorkspaceApiResponse>(
        `${WORKSPACES_ENDPOINT}/${identifier}`,
        data,
      );

      return toSuccess<UpdateWorkspaceData>({
        identifier: response.data.identifier,
        title: response.data.title,
        modifiedAt: response.data.modifiedAt,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.WORKSPACE_NOT_FOUND,
        MESSAGES.workspace.updateFailed,
      );
    }
  },

  /**
   * 워크스페이스 삭제 API 호출 (cascade delete 포함)
   * @param workspaceIdentifier 워크스페이스 식별자
   * @returns 에러 메시지 (없으면 성공)
   *
   * 백엔드 엔드포인트: DELETE /api/workspaces/{workspaceIdentifier}
   */
  delete: async (workspaceIdentifier: string): Promise<DeleteWorkspaceResponse> => {
    try {
      await apiClient.delete(`${WORKSPACES_ENDPOINT}/${workspaceIdentifier}`);
      return {};
    } catch (error) {
      const response = toError(
        error,
        BackendErrorCode.WORKSPACE_NOT_FOUND,
        MESSAGES.workspace.deleteFailed,
      );
      return { error: response.error?.message ?? MESSAGES.workspace.deleteFailed };
    }
  },

  /**
   * 워크스페이스 단일 조회 API 호출
   * @param identifier 워크스페이스 식별자
   * @returns API 응답 (성공 시 워크스페이스 정보, 실패 시 에러 정보)
   */
  getByIdentifier: async (identifier: string): Promise<ApiResponse<GetWorkspaceData>> => {
    try {
      const response = await apiClient.get<GetWorkspaceApiResponse>(`${WORKSPACES_ENDPOINT}/${identifier}`);

      return toSuccess<GetWorkspaceData>({
        identifier: response.data.identifier,
        title: response.data.title,
        modifiedAt: response.data.modifiedAt,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.WORKSPACE_NOT_FOUND,
        UI_COPY.workspaceDetail.notFound,
      );
    }
  },

  /**
   * 내 워크스페이스 목록 조회 API 호출 (권장)
   * 토큰에서 사용자를 추출하여 워크스페이스 목록 반환
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 워크스페이스 목록, 실패 시 에러 정보)
   *
   * 백엔드 엔드포인트: GET /api/me/workspaces
   */
  getMyWorkspaces: async (token: string): Promise<ApiResponse<MyWorkspacesData>> => {
    try {
      const response = await apiClient.get<MyWorkspaceApiResponse>(MY_WORKSPACES_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return toSuccess<MyWorkspacesData>({
        workspaces: response.data.workspaces,
      });
    } catch (error) {
      return toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.workspace.loadFailed,
      );
    }
  },

  /**
   * 소유자별 워크스페이스 목록 조회 API 호출 (레거시)
   * @deprecated getMyWorkspaces 사용 권장
   * @param ownerId 사용자 ID
   * @returns 워크스페이스 배열
   */
  getByOwner: async (ownerId: string): Promise<Workspace[]> => {
    try {
      const response = await apiClient.get<Workspace[]>(WORKSPACES_ENDPOINT, {
        params: { ownerId },
      });
      return response.data;
    } catch (error) {
      const response = toError(
        error,
        BackendErrorCode.ACCESS_FORBIDDEN,
        MESSAGES.workspace.loadFailed,
      );
      throw new Error(response.error?.message ?? MESSAGES.workspace.loadFailed);
    }
  },

  /**
   * 워크스페이스 제목 중복 검증 API 호출
   * @param title 검증할 워크스페이스 제목
   * @returns 중복 여부 및 에러 정보
   */
  checkTitleDuplicate: async (title: string): Promise<CheckWorkspaceTitleDuplicateResponse> => {
    try {
      const response = await apiClient.get<TitleDuplicateApiResponse>(TITLE_VALIDATION_ENDPOINT, {
        params: { value: title },
      });
      return {
        isDuplicated: response.data.isDuplicated,
      };
    } catch (error) {
      const response = toError(
        error,
        BackendErrorCode.DUPLICATE_WORKSPACE_TITLE,
        MESSAGES.workspace.titleDuplicateCheckFailed,
      );
      return {
        isDuplicated: false,
        error: response.error?.message,
      };
    }
  },
};
