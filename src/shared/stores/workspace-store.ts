import { create } from 'zustand';

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  setSelectedWorkspace: (id: string | null) => void;
}

// 워크스페이스 선택 상태 전역 스토어 - 현재 선택된 워크스페이스 ID를 관리
// 사용 위치: pages/Workspaces
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedWorkspaceId: null,
  // 워크스페이스 선택 시 ID 저장 - 지도와 카테고리 데이터를 해당 워크스페이스로 필터링
  setSelectedWorkspace: (id) => set({ selectedWorkspaceId: id }),
}));
