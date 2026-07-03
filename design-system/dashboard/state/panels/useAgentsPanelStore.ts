import { create } from 'zustand';

interface AgentsPanelState {
  selectedAgentId: string | null;
  filter: string;
  sort: string;
  setSelectedAgentId: (id: string | null) => void;
  setFilter: (filter: string) => void;
  setSort: (sort: string) => void;
  reset: () => void;
}

export const useAgentsPanelStore = create<AgentsPanelState>((set) => ({
  selectedAgentId: null,
  filter: '',
  sort: 'name',
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  reset: () => set({ selectedAgentId: null, filter: '', sort: 'name' }),
}));
