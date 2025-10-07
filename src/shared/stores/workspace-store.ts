import { create } from 'zustand';

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  setSelectedWorkspace: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedWorkspaceId: null,
  setSelectedWorkspace: (id) => set({ selectedWorkspaceId: id }),
}));
