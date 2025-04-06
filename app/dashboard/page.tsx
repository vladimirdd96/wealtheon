"use client";

import React, { useState } from "react";
import { 
  HomeIcon, 
  ChartPieIcon, 
  CurrencyDollarIcon, 
  PhotoIcon 
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";

// Dynamically import components to prevent loading errors
const PersonalizedPortfolio = dynamic(() => import("../../components/dashboard/PersonalizedPortfolio"), {
  loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
    <div className="text-white text-lg">Loading Portfolio Advisor...</div>
  </div>
});

const MarketPredictions = dynamic(() => import("../../components/dashboard/MarketPredictions"), {
  loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
    <div className="text-white text-lg">Loading Market Predictions...</div>
  </div>
});

const DeFiInsights = dynamic(() => import("../../components/dashboard/DeFiInsights"), {
  loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
    <div className="text-white text-lg">Loading DeFi Insights...</div>
  </div>
});

const NFTAdvisor = dynamic(() => import("../../components/dashboard/NFTAdvisor"), {
  loading: () => <div className="p-8 flex justify-center items-center min-h-[500px]">
    <div className="text-white text-lg">Loading NFT Advisor...</div>
  </div>
});

const tabs = [
  {
    id: "portfolio",
    name: "Portfolio Advisor",
    icon: HomeIcon,
    component: PersonalizedPortfolio,
  },
  {
    id: "market",
    name: "Market Predictions",
    icon: ChartPieIcon,
    component: MarketPredictions,
  },
  {
    id: "defi",
    name: "DeFi Insights",
    icon: CurrencyDollarIcon,
    component: DeFiInsights,
  },
  {
    id: "nft",
    name: "NFT Advisor",
    icon: PhotoIcon,
    component: NFTAdvisor,
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("portfolio");

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || PersonalizedPortfolio;

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">WealthX AI Dashboard</h1>
        <p className="text-gray-400 mb-8">AI-powered insights for your wealth management</p>
        
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
        
        {/* Active Component */}
        <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
} 