"use client";
import React, { useState, useEffect, useRef } from "react";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { DataVisualization } from "@/components/sections/DataVisualization";
import { SubscriptionTiers } from "@/components/sections/SubscriptionTiers";
import { CallToAction } from "@/components/sections/CallToAction";
import { LoadingPage } from "@/components/ui/LoadingPage";
import { useMarketDataStore } from "@/store";
import Link from "next/link";

export default function Home() {
  const { isLoading, error, lastUpdated } = useMarketDataStore();
  const [initialLoading, setInitialLoading] = useState(true);
  const dataLoadedTimeRef = useRef<number | null>(null);
  const MIN_LOADING_TIME = 2000; // 2 seconds minimum loading time
  
  // Check if all data is loaded to hide the loading page
  useEffect(() => {
    // Check if all the essential data has been loaded
    const allDataLoaded = !isLoading.bitcoin && 
                          !isLoading.ethereum && 
                          !isLoading.solana && 
                          !isLoading.tokenPrices;
    
    // When all data is loaded, record the time
    if (allDataLoaded && !dataLoadedTimeRef.current) {
      dataLoadedTimeRef.current = Date.now();
    }
    
    // If we have recorded when data loaded, calculate the remaining time to display the loader
    if (dataLoadedTimeRef.current) {
      const elapsedTime = Date.now() - dataLoadedTimeRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Reset loading state when user navigates back to this page
  useEffect(() => {
    // Reset the loading state when component mounts
    setInitialLoading(true);
    dataLoadedTimeRef.current = null;
    
    // Cleanup when component unmounts
    return () => {
      dataLoadedTimeRef.current = null;
    };
  }, []);
  
  // Show loading page during initial data load
  if (initialLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <Hero />
      <Features />
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Real-Time Market Data
            </h2>
            <p className="text-xl text-gray-400">
              Stay ahead with our accurate and real-time crypto market analysis
            </p>
            <div className="mt-8">
              <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Try AI Dashboard
              </Link>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <DataVisualization />
          </div>
        </div>
      </section>
      <SubscriptionTiers />
      <CallToAction />
    </>
  );
}
