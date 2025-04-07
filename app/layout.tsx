import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ClientWalletProvider } from "@/components/providers/ClientWalletProvider";
import { ZustandStoreProvider } from "@/components/providers/ZustandStoreProvider";
import { WalletSyncProvider } from "@/components/providers/WalletSyncProvider";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Wealtheon - AI-Powered Investment Platform",
  description: "AI-powered investment platform providing personalized advice and market forecasts for crypto, NFTs, and DeFi.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 min-h-screen text-white`}>
        {/* Wallet provider is client-side only */}
        <ClientWalletProvider>
          <ZustandStoreProvider>
            <WalletSyncProvider>
              <Navbar />
              <main className="flex flex-col w-full">
                {children}
              </main>
              <Footer />
            </WalletSyncProvider>
          </ZustandStoreProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
} 