'use client';

import { create } from 'zustand';
import type { WalletInfo } from '@/lib/api/types';
import { walletApi } from '@/lib/api/wallet';

interface WalletState {
  wallet: WalletInfo | null;
  loading: boolean;
}

interface WalletActions {
  fetchWallet: () => Promise<void>;
  setWallet: (wallet: WalletInfo | null) => void;
}

export type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()((set) => ({
  wallet: null,
  loading: false,

  fetchWallet: async () => {
    set({ loading: true });
    try {
      const data = await walletApi.get();
      set({ wallet: data });
    } catch {
      // keep existing value on error
    } finally {
      set({ loading: false });
    }
  },

  setWallet: (wallet) => set({ wallet }),
}));
