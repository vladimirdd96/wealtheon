"use client";

import React, { useState, useEffect } from "react";
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  UsersIcon 
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Moralis from "moralis";

// Import components
import TokenInsightsComponent from "../../components/analytics/TokenInsights";
import WalletAnalysisComponent from "../../components/analytics/WalletAnalysis";
import MarketTrendsComponent from "../../components/analytics/MarketTrends";
import AIAssistantComponent from "../../components/analytics/AIAssistant";

// Create client-side only versions
const TokenInsights = dynamic(
  () => Promise.resolve(TokenInsightsComponent),
  {
    loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
      <div className="text-white text-lg">Loading Token Insights...</div>
    </div>
  }
);

const WalletAnalysis = dynamic(
  () => Promise.resolve(WalletAnalysisComponent),
  {
    loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
      <div className="text-white text-lg">Loading Wallet Analysis...</div>
    </div>
  }
);

const MarketTrends = dynamic(
  () => Promise.resolve(MarketTrendsComponent),
  {
    loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
      <div className="text-white text-lg">Loading Market Trends...</div>
    </div>
  }
);

const AIAssistant = dynamic(
  () => Promise.resolve(AIAssistantComponent),
  {
    loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
      <div className="text-white text-lg">Loading AI Assistant...</div>
    </div>
  }
);

// Add display names
TokenInsights.displayName = 'TokenInsights';
WalletAnalysis.displayName = 'WalletAnalysis';
MarketTrends.displayName = 'MarketTrends';
AIAssistant.displayName = 'AIAssistant';

const tabs = [
  {
    id: "tokens",
    name: "Token Insights",
    icon: CurrencyDollarIcon,
    component: TokenInsights,
  },
  {
    id: "wallet",
    name: "Wallet Analysis",
    icon: BanknotesIcon,
    component: WalletAnalysis,
  },
  {
    id: "market",
    name: "Market Trends",
    icon: ChartBarIcon,
    component: MarketTrends,
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    icon: UsersIcon,
    component: AIAssistant,
  },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("tokens");
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    const initMoralis = async () => {
      try {
        if (!Moralis.Core.isStarted) {
          // Get the Moralis API key from environment variables
          const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
          
          if (!apiKey) {
            throw new Error("Moralis API key not found in environment variables");
          }
          
          await Moralis.start({
            apiKey: apiKey,
          });
          
          console.log("Moralis initialized successfully");
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Moralis:", error);
        setInitError("Failed to initialize blockchain data provider. Some features may not work properly.");
        // Still set initialized to true so components can fall back to sample data
        setIsInitialized(true);
      }
    };

    initMoralis();
  }, []);

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || TokenInsights;

  return (
    <div className="bg-gray-950 min-h-screen text-white mt-20">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Blockchain Analytics</h1>
        <p className="text-gray-400 mb-8">Powerful insights powered by Moralis and OpenAI</p>
        
        {initError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">{initError}</p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex overflow-x-auto space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-500"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                <tab.icon
                  className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? "text-violet-500" : "text-gray-400"
                  }`}
                />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Loading state or component */}
        <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
          {isInitialized ? (
            <ActiveComponent />
          ) : (
            <div className="p-8 flex justify-center items-center min-h-[500px]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mb-4"></div>
                <div className="text-white text-lg">Initializing Blockchain Data...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 