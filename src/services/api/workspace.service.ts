// 워크스페이스 관련 API 서비스 레이어
// 목적: 컴포넌트와 실제 API 구현체를 분리하여, 백엔드 전환 시 이 파일만 수정하면 되도록 구조화

import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspacesByOwner,
} from '@/mock/edge-functions/workspace';
import type { Workspace } from '@/entities/types';

// 워크스페이스 생성 요청 파라미터 타입
export interface CreateWorkspaceRequest {
  ownerId: string;
  title: string;
  headcount?: number;
  date?: string;
}

// 워크스페이스 생성 응답 타입
export interface CreateWorkspaceResponse {
  workspace?: Workspace;
  error?: string;
}

// 워크스페이스 수정 요청 파라미터 타입
export interface UpdateWorkspaceRequest {
  title?: string;
  headcount?: number;
  date?: string;
}

// 워크스페이스 수정 응답 타입
export interface UpdateWorkspaceResponse {
  error?: string;
}

// 워크스페이스 삭제 응답 타입
export interface DeleteWorkspaceResponse {
  error?: string;
}

// 워크스페이스 API 서비스 객체 - 모든 워크스페이스 관련 API 호출을 중앙 관리
// 백엔드 연동 시: 이 객체의 메서드 구현만 axios 호출로 변경하면 됨
export const workspaceApi = {
  /**
   * 워크스페이스 생성 API 호출
   * @param data 소유자 ID, 제목, 인원수, 날짜
   * @returns 생성된 워크스페이스 또는 에러 메시지
   */
  create: async (data: CreateWorkspaceRequest): Promise<CreateWorkspaceResponse> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.post('/api/workspaces', data)
    return await createWorkspace(data);
  },

  /**
   * 워크스페이스 수정 API 호출
   * @param id 워크스페이스 ID
   * @param data 수정할 필드 (제목, 인원수, 날짜)
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
   * 소유자별 워크스페이스 목록 조회 API 호출
   * @param ownerId 사용자 ID
   * @returns 워크스페이스 배열
   */
  getByOwner: async (ownerId: string): Promise<Workspace[]> => {
    // 현재: mock edge-function 호출
    // 추후: return axios.get(`/api/workspaces?ownerId=${ownerId}`)
    return await getWorkspacesByOwner(ownerId);
  },
};

