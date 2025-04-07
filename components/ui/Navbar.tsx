"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { StaticWalletButton } from "./WalletButton";
import Link from 'next/link';
import { WalletConnectButton } from './WalletConnectButton';
import Image from 'next/image';

// Create a client-side only wrapper for the WalletConnectButton
const ClientWalletButton = dynamic(
  () => Promise.resolve(WalletConnectButton),
  { 
    ssr: false,
    loading: () => <StaticWalletButton />
  }
);

// Add display name
ClientWalletButton.displayName = 'ClientWalletButton';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-800" 
          : "bg-transparent"
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="relative w-48 h-40">
              <Image
                src="/wealtheon_logo_transparent_fixed.png"
                alt="Wealtheon"
                fill
                className="object-contain brightness-200"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {["Dashboard", "Analytics", "Pricing", "FAQ"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <div>
            {mounted ? <ClientWalletButton /> : <StaticWalletButton />}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-400 hover:text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
} 