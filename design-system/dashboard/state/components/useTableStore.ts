import { create } from 'zustand';

interface TableState {
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  selectedRows: string[];
  setSortKey: (key: string | null) => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  toggleSort: (key: string) => void;
  setSelectedRows: (rows: string[]) => void;
  toggleRow: (rowId: string) => void;
  selectAll: (rowIds: string[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useTableStore = create<TableState>((set) => ({
  sortKey: null,
  sortDir: 'asc',
  selectedRows: [],
  setSortKey: (key) => set({ sortKey: key }),
  setSortDir: (dir) => set({ sortDir: dir }),
  toggleSort: (key) =>
    set((state) => ({
      sortKey: state.sortKey === key ? null : key,
      sortDir: state.sortKey === key ? (state.sortDir === 'asc' ? 'desc' : 'asc') : 'asc',
    })),
  setSelectedRows: (rows) => set({ selectedRows: rows }),
  toggleRow: (rowId) =>
    set((state) => ({
      selectedRows: state.selectedRows.includes(rowId)
        ? state.selectedRows.filter((id) => id !== rowId)
        : [...state.selectedRows, rowId],
    })),
  selectAll: (rowIds) => set({ selectedRows: rowIds }),
  clearSelection: () => set({ selectedRows: [] }),
  reset: () => set({ sortKey: null, sortDir: 'asc', selectedRows: [] }),
}));
