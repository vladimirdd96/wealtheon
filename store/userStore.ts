import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    address?: string;
    email?: string;
    username?: string;
  } | null;
  walletConnected: boolean;
  walletAddress: string | null;

  // Actions
  setUser: (user: UserState['user']) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
  setWalletConnected: (connected: boolean, address?: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      walletConnected: false,
      walletAddress: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      logout: () => set({ isAuthenticated: false, user: null }),
      setWalletConnected: (connected, address = null) => 
        set({ walletConnected: connected, walletAddress: address }),
    }),
    {
      name: 'user-storage', // unique name for localStorage
    }
  )
); 