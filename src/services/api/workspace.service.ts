// 워크스페이스 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화

import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceByIdentifier,
  getWorkspacesByOwner,
  getMyWorkspaces,
  checkWorkspaceTitleDuplicate,
} from '@/mock/edge-functions/workspace';
import type { Workspace } from '@/entities/types';
import type { ApiResponse } from '@/types/api';

// 워크스페이스 생성 요청 파라미터 타입 - 백엔드 API 스펙과 일치
export interface CreateWorkspaceRequest {
  title: string;  // 워크스페이스 제목 (최대 20자)
  // ownerId는 토큰에서 추출되므로 요청에 포함하지 않음
}

// 워크스페이스 생성 응답 데이터 타입 - 백엔드 API 스펙과 일치
export interface CreateWorkspaceData {
  identifier: string;   // 워크스페이스 식별자
  title: string;        // 워크스페이스 제목
  modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
}

// 워크스페이스 수정 요청 파라미터 타입
export interface UpdateWorkspaceRequest {
  title?: string;
}

// 워크스페이스 수정 응답 타입
export interface UpdateWorkspaceResponse {
  error?: string;
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

// 워크스페이스 제목 중복 검증 응답 타입
export interface CheckWorkspaceTitleDuplicateResponse {
  isDuplicate: boolean;
  error?: string;
}

// 내 워크스페이스 목록 조회 응답 타입 - 백엔드 API 스펙과 일치
export interface MyWorkspacesData {
  workspaces: Array<{
    identifier: string;   // 워크스페이스 고유 식별자
    title: string;        // 워크스페이스 제목
    modifiedAt: string;   // 수정일시 (yyyy-MM-dd'T'HH:mm:ss)
  }>;
}

// 워크스페이스 API 서비스 객체 - 모든 워크스페이스 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
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
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await createWorkspace({ token, title: data.title });
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.post('/api/workspaces', data, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'CREATE_WORKSPACE_FAILED',
          message: mockResponse.error,
          status: 400,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    // 백엔드 API 스펙에 맞춰 응답: { identifier, title, modifiedAt }
    return {
      success: true,
      data: {
        identifier: mockResponse.identifier!,
        title: mockResponse.title!,
        modifiedAt: mockResponse.modifiedAt!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 워크스페이스 수정 API 호출
   * @param id 워크스페이스 ID
   * @param data 수정할 필드 (제목)
   * @returns 에러 메시지 (없으면 성공)
   */
  update: async (id: string, data: UpdateWorkspaceRequest): Promise<UpdateWorkspaceResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.patch(`/api/workspaces/${id}`, data)
    return await updateWorkspace(id, data);
  },

  /**
   * 워크스페이스 삭제 API 호출 (cascade delete 포함)
   * @param id 워크스페이스 ID
   * @returns 에러 메시지 (없으면 성공)
   */
  delete: async (id: string): Promise<DeleteWorkspaceResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.delete(`/api/workspaces/${id}`)
    return await deleteWorkspace(id);
  },

  /**
   * 워크스페이스 단일 조회 API 호출
   * @param identifier 워크스페이스 식별자
   * @returns API 응답 (성공 시 워크스페이스 정보, 실패 시 에러 정보)
   * 
   * 백엔드 엔드포인트: GET /api/workspaces/{workspaceIdentifier}
   * 백엔드 응답 예시: { identifier: "abc123", title: "서울 여행 계획", modifiedAt: "2024-10-22T14:30:00" }
   */
  getByIdentifier: async (identifier: string): Promise<ApiResponse<GetWorkspaceData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getWorkspaceByIdentifier(identifier);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.get(`/api/workspaces/${identifier}`);
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'GET_WORKSPACE_FAILED',
          message: mockResponse.error,
          status: 404,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    // 백엔드 API 스펙에 맞춰 응답: { identifier, title, modifiedAt }
    return {
      success: true,
      data: {
        identifier: mockResponse.identifier!,
        title: mockResponse.title!,
        modifiedAt: mockResponse.modifiedAt!,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 내 워크스페이스 목록 조회 API 호출 (권장)
   * 토큰에서 사용자를 추출하여 워크스페이스 목록 반환
   * @param token 인증 토큰
   * @returns API 응답 (성공 시 워크스페이스 목록, 실패 시 에러 정보)
   * 
   * 백엔드 엔드포인트: GET /api/me/workspaces
   * 백엔드 응답 예시: { workspaces: [{ identifier, title, modifiedAt }] }
   */
  getMyWorkspaces: async (token: string): Promise<ApiResponse<MyWorkspacesData>> => {
    // 현재: mock edge-function 호출 후 표준 응답 형식으로 변환
    const mockResponse = await getMyWorkspaces(token);
    
    // Mock 응답을 표준 API 응답 형식으로 변환
    // 추후 백엔드 연동 시:
    // const response = await apiClient.get('/api/me/workspaces', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return { success: true, data: response.data, timestamp: new Date().toISOString() };
    if (mockResponse.error) {
      return {
        success: false,
        error: {
          code: 'GET_WORKSPACES_FAILED',
          message: mockResponse.error,
          status: 400,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    // 백엔드 API 스펙에 맞춰 응답: { workspaces: [{ identifier, title, modifiedAt }] }
    return {
      success: true,
      data: {
        workspaces: mockResponse.workspaces,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 소유자별 워크스페이스 목록 조회 API 호출 (레거시)
   * @deprecated getMyWorkspaces 사용 권장
   * @param ownerId 사용자 ID
   * @returns 워크스페이스 배열
   */
  getByOwner: async (ownerId: string): Promise<Workspace[]> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.get(`/api/workspaces?ownerId=${ownerId}`)
    return await getWorkspacesByOwner(ownerId);
  },

  /**
   * 워크스페이스 제목 중복 검증 API 호출
   * @param ownerId 사용자 ID
   * @param title 검증할 워크스페이스 제목
   * @returns 중복 여부 및 에러 정보
   */
  checkTitleDuplicate: async (
    ownerId: string, 
    title: string
  ): Promise<CheckWorkspaceTitleDuplicateResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.get(`/api/workspaces/check-title?ownerId=${ownerId}&title=${encodeURIComponent(title)}`)
    return await checkWorkspaceTitleDuplicate(ownerId, title);
  },
};

