import { create } from 'zustand';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  setConnected: (connected: boolean) => void;
  setPublicKey: (publicKey: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  setConnected: (connected) => set({ connected }),
  setPublicKey: (publicKey) => set({ publicKey }),
})); 