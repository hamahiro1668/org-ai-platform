import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Folder {
  id: string;
  name: string;
  color?: string;
  itemIds: string[]; // ordered task IDs within this folder
}

interface DeliverablesState {
  folders: Folder[];
  activeFolderId: string;
  deptFilter: string | null;
  typeFilter: string | null;

  setActiveFolder: (id: string) => void;
  setDeptFilter: (dept: string | null) => void;
  setTypeFilter: (type: string | null) => void;

  reorderInFolder: (folderId: string, activeId: string, overId: string) => void;
  moveToFolder: (itemId: string, targetFolderId: string) => void;
  addItemIfMissing: (itemId: string) => void; // ensure new tasks land in "all"
  removeItem: (itemId: string) => void;

  createFolder: (name: string, color?: string) => string;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'すべて', itemIds: [] },
  { id: 'sales', name: '営業部', color: '#8b85ff', itemIds: [] },
  { id: 'marketing', name: 'マーケ部', color: '#9a95ff', itemIds: [] },
  { id: 'accounting', name: '経理部', color: '#b0acff', itemIds: [] },
  { id: 'analytics', name: 'データ分析', color: '#8d9dff', itemIds: [] },
  { id: 'general', name: '総合', color: '#0EA5E9', itemIds: [] },
];

export const useDeliverablesStore = create<DeliverablesState>()(
  persist(
    (set) => ({
      folders: DEFAULT_FOLDERS,
      activeFolderId: 'all',
      deptFilter: null,
      typeFilter: null,

      setActiveFolder: (id) => set({ activeFolderId: id }),
      setDeptFilter: (dept) => set({ deptFilter: dept }),
      setTypeFilter: (type) => set({ typeFilter: type }),

      reorderInFolder: (folderId, activeId, overId) =>
        set((state) => {
          const folders = state.folders.map((f) => {
            if (f.id !== folderId) return f;
            const activeIdx = f.itemIds.indexOf(activeId);
            const overIdx = f.itemIds.indexOf(overId);
            if (activeIdx === -1 || overIdx === -1) return f;
            const next = [...f.itemIds];
            next.splice(activeIdx, 1);
            next.splice(overIdx, 0, activeId);
            return { ...f, itemIds: next };
          });
          return { folders };
        }),

      moveToFolder: (itemId, targetFolderId) =>
        set((state) => {
          if (targetFolderId === 'all') return state; // "all" is virtual
          const folders = state.folders.map((f) => ({
            ...f,
            itemIds:
              f.id === targetFolderId
                ? f.itemIds.includes(itemId)
                  ? f.itemIds
                  : [itemId, ...f.itemIds]
                : f.itemIds.filter((id) => id !== itemId),
          }));
          return { folders };
        }),

      addItemIfMissing: (itemId) =>
        set((state) => {
          const allFolder = state.folders.find((f) => f.id === 'all');
          if (allFolder?.itemIds.includes(itemId)) return state;
          const folders = state.folders.map((f) =>
            f.id === 'all' ? { ...f, itemIds: [itemId, ...f.itemIds] } : f,
          );
          return { folders };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          folders: state.folders.map((f) => ({
            ...f,
            itemIds: f.itemIds.filter((id) => id !== itemId),
          })),
        })),

      createFolder: (name, color) => {
        const id = `folder-${Date.now()}`;
        set((state) => ({
          folders: [...state.folders, { id, name, color, itemIds: [] }],
        }));
        return id;
      },

      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          activeFolderId: state.activeFolderId === id ? 'all' : state.activeFolderId,
        })),

      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
    }),
    {
      name: 'flow-deliverables-v1',
    },
  ),
);
