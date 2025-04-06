"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletStore } from "@/store/walletStore";

export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey } = useWallet();
  const { setConnected, setPublicKey } = useWalletStore();

  // Sync wallet state to our Zustand store
  useEffect(() => {
    setConnected(connected);
    setPublicKey(publicKey ? publicKey.toString() : null);
  }, [connected, publicKey, setConnected, setPublicKey]);

  return <>{children}</>;
} 