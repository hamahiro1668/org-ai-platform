import { create } from 'zustand';

interface FooterSearchState {
  /** 秘書AI検索モード（ナビ非表示・検索バー表示） */
  secretarySearchOpen: boolean;
  focusSignal: number;
  openSecretarySearch: () => void;
  closeSecretarySearch: () => void;
  /** ヘッダー検索アイコン用：モードが既に開いていればフォーカスのみ */
  requestFooterSearchFocus: () => void;
}

export const useFooterSearchStore = create<FooterSearchState>((set, get) => ({
  secretarySearchOpen: false,
  focusSignal: 0,
  openSecretarySearch: () => {
    set((s) => ({
      secretarySearchOpen: true,
      focusSignal: s.focusSignal + 1,
    }));
  },
  closeSecretarySearch: () => {
    set({ secretarySearchOpen: false });
  },
  requestFooterSearchFocus: () => {
    const { secretarySearchOpen } = get();
    if (secretarySearchOpen) {
      set((s) => ({ focusSignal: s.focusSignal + 1 }));
    } else {
      get().openSecretarySearch();
    }
  },
}));
