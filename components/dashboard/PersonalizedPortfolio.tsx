"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid
} from "recharts";

// Mock data for portfolio analysis
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

// Define risk profiles with asset allocations
const riskProfiles = {
  conservative: {
    name: "Conservative",
    description: "Lower risk, moderate returns, focus on stability",
    allocation: [
      { name: "Stablecoins", value: 40, color: "#8884d8" },
      { name: "Major Cryptos", value: 25, color: "#82ca9d" },
      { name: "DeFi Tokens", value: 15, color: "#ffc658" },
      { name: "NFTs", value: 5, color: "#ff8042" },
      { name: "Cash", value: 15, color: "#0088fe" }
    ]
  },
  moderate: {
    name: "Moderate",
    description: "Balanced risk and return profile",
    allocation: [
      { name: "Stablecoins", value: 25, color: "#8884d8" },
      { name: "Major Cryptos", value: 35, color: "#82ca9d" },
      { name: "DeFi Tokens", value: 25, color: "#ffc658" },
      { name: "NFTs", value: 10, color: "#ff8042" },
      { name: "Cash", value: 5, color: "#0088fe" }
    ]
  },
  aggressive: {
    name: "Aggressive",
    description: "Higher risk, potential for higher returns",
    allocation: [
      { name: "Stablecoins", value: 10, color: "#8884d8" },
      { name: "Major Cryptos", value: 35, color: "#82ca9d" },
      { name: "DeFi Tokens", value: 35, color: "#ffc658" },
      { name: "NFTs", value: 15, color: "#ff8042" },
      { name: "Cash", value: 5, color: "#0088fe" }
    ]
  }
};

export default function PersonalizedPortfolio() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<keyof typeof riskProfiles>("moderate");
  const [portfolioData, setPortfolioData] = useState<any | null>(null);
  
  // Automatically connect wallet and fetch data when component mounts
  useEffect(() => {
    // Auto-connect wallet on load
    autoConnectWallet();
  }, []);

  // Auto-connect wallet function
  const autoConnectWallet = async () => {
    setLoading(true);
    
    try {
      // Simulate a wallet connection
      // In a real app, this would check for an existing wallet connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulated wallet address for demo
      const simulatedAddress = "FZLEgWgW6Li3zUeqYgChYmPpxfcRQiDjTU2y8hQFLQc8";
      setWalletAddress(simulatedAddress);
      setWalletConnected(true);
      
      // Now fetch portfolio data
      fetchPortfolioData(simulatedAddress);
    } catch (err) {
      console.error("Failed to auto-connect wallet:", err);
      // Don't show an error for auto-connect failures
      // User can still manually connect
    } finally {
      setLoading(false);
    }
  };
  
  // Connect wallet function (for manual connection)
  const connectWallet = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would use a wallet adapter like Phantom or WalletConnect
      // For demo purposes, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated wallet address for demo
      const simulatedAddress = "FZLEgWgW6Li3zUeqYgChYmPpxfcRQiDjTU2y8hQFLQc8";
      setWalletAddress(simulatedAddress);
      setWalletConnected(true);
      
      // Now fetch portfolio data
      fetchPortfolioData(simulatedAddress);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect your wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch portfolio data
  const fetchPortfolioData = async (address: string) => {
    setLoading(true);
    
    try {
      // Generate mock portfolio data for demo
      const mockPortfolioData = generateMockPortfolioData();
      setPortfolioData(mockPortfolioData);
    } catch (err) {
      console.error("Failed to fetch portfolio data:", err);
      setError("Failed to load your portfolio data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock allocation data
  const generateMockPortfolioData = () => {
    // Create mock allocation based on asset types
    const currentAllocation = [
      { name: "Stablecoins", value: 32, color: "#8884d8" },
      { name: "Major Cryptos", value: 28, color: "#82ca9d" },
      { name: "DeFi Tokens", value: 22, color: "#ffc658" },
      { name: "NFTs", value: 8, color: "#ff8042" },
      { name: "Cash", value: 10, color: "#0088fe" }
    ];
    
    // Mock portfolio value history for the last 6 months
    const portfolioHistory = [
      { name: "Jan", value: 10000 },
      { name: "Feb", value: 12000 },
      { name: "Mar", value: 9800 },
      { name: "Apr", value: 13200 },
      { name: "May", value: 14500 },
      { name: "Jun", value: 15200 }
    ];
    
    // Mock asset performance
    const assetPerformance = [
      { name: "BTC", performance: 12.5 },
      { name: "ETH", performance: 8.2 },
      { name: "SOL", performance: 15.7 },
      { name: "USDC", performance: 0.2 },
      { name: "AAVE", performance: -5.3 },
      { name: "UNI", performance: 3.8 }
    ];
    
    return {
      totalValue: 15200,
      currentAllocation,
      portfolioHistory,
      assetPerformance,
      riskScore: 65 // on a scale of 0-100
    };
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Generate recommendations based on selected risk profile and current allocation
  const getRecommendations = () => {
    if (!portfolioData) return [];
    
    const targetAllocation = riskProfiles[selectedRiskProfile].allocation;
    const currentAllocation = portfolioData.currentAllocation;
    
    // Compare current allocation with target for the selected risk profile
    const recommendations = [];
    
    for (const target of targetAllocation) {
      const current = currentAllocation.find((item: { name: string; value: number }) => item.name === target.name);
      const currentValue = current ? current.value : 0;
      const difference = target.value - currentValue;
      
      // Only add recommendations with significant differences
      if (Math.abs(difference) >= 5) {
        recommendations.push({
          asset: target.name,
          action: difference > 0 ? "Increase" : "Decrease",
          amount: `${Math.abs(difference)}%`,
          reason: difference > 0 
            ? `Your ${target.name} allocation is below the target for your ${riskProfiles[selectedRiskProfile].name} risk profile`
            : `Your ${target.name} allocation is above the target for your ${riskProfiles[selectedRiskProfile].name} risk profile`
        });
      }
    }
    
    // Add general risk profile recommendation if we have few asset-specific ones
    if (recommendations.length < 2) {
      recommendations.push({
        asset: "Risk Profile",
        action: "Review",
        amount: "N/A",
        reason: `Consider if the ${riskProfiles[selectedRiskProfile].name} risk profile aligns with your investment goals and time horizon`
      });
    }
    
    // Add diversification recommendation if heavily concentrated
    const maxAllocation = Math.max(...currentAllocation.map((a: { value: number }) => a.value));
    if (maxAllocation > 40) {
      const concentratedAsset = currentAllocation.find((a: { name: string; value: number }) => a.value === maxAllocation)?.name;
      recommendations.push({
        asset: "Diversification",
        action: "Increase",
        amount: "N/A",
        reason: `Your portfolio is heavily concentrated in ${concentratedAsset}. Consider diversifying to reduce risk`
      });
    }
    
    return recommendations;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
        <div className="text-white text-lg">
          {walletConnected ? "Analyzing your portfolio data..." : "Connecting to your wallet..."}
        </div>
        <div className="text-gray-400 text-sm mt-2">This will only take a moment</div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button 
          onClick={connectWallet}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Not connected state - should only show briefly before auto-connect
  if (!walletConnected) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="text-white text-lg mb-6">Connect your wallet to get personalized portfolio analysis</div>
        <button 
          onClick={connectWallet}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium text-white"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Make sure portfolio data is available
  if (!portfolioData) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
        <div className="text-white text-lg">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Your Personalized Portfolio</h2>
          <p className="text-gray-400">Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
        </div>
        <div className="mt-3 md:mt-0">
          <div className="text-sm text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(portfolioData.totalValue)}</div>
        </div>
      </div>

      {/* Portfolio Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Allocation */}
        <div className="bg-gray-900/60 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Current Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData.currentAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {portfolioData.currentAllocation.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, '']}
                  contentStyle={{ 
                    backgroundColor: "#1F2937", 
                    borderColor: "#4B5563",
                    color: "#F9FAFB"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      
        {/* Portfolio History */}
        <div className="bg-gray-900/60 rounded-xl p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-3">Portfolio History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={portfolioData.portfolioHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  contentStyle={{ 
                    backgroundColor: "#1F2937", 
                    borderColor: "#4B5563",
                    color: "#F9FAFB"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Profile & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Profile Selector */}
        <div className="lg:col-span-5 bg-gray-900/60 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Profile Analysis</h3>
          
          {/* Risk score */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400">Your Risk Score</div>
              <div className="text-lg font-semibold text-white">{portfolioData.riskScore}/100</div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  portfolioData.riskScore < 40 
                    ? "bg-green-500" 
                    : portfolioData.riskScore < 70 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
                }`} 
                style={{ width: `${portfolioData.riskScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <div>Conservative</div>
              <div>Moderate</div>
              <div>Aggressive</div>
            </div>
          </div>
          
          {/* Risk profile selector */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Target Risk Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(riskProfiles).map((profile) => (
                <button
                  key={profile}
                  onClick={() => setSelectedRiskProfile(profile as keyof typeof riskProfiles)}
                  className={`py-2 px-3 rounded text-sm transition-colors ${
                    selectedRiskProfile === profile
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {riskProfiles[profile as keyof typeof riskProfiles].name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Selected profile allocation */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
            <div className="text-sm text-gray-400 mb-2">Target Allocation</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskProfiles[selectedRiskProfile].allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskProfiles[selectedRiskProfile].allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            {riskProfiles[selectedRiskProfile].description}
          </div>
        </div>
        
        {/* AI Recommendations */}
        <div className="lg:col-span-7 bg-gray-900/60 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">AI-Powered Recommendations</h3>
          
          <div className="space-y-3">
            {getRecommendations().map((rec, index) => (
              <div 
                key={index} 
                className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-violet-500"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium text-white">{rec.asset}</div>
                  <div className={`text-sm font-medium ${
                    rec.action === "Increase" ? "text-green-400" : 
                    rec.action === "Decrease" ? "text-red-400" : "text-blue-400"
                  }`}>
                    {rec.action} {rec.amount}
                  </div>
                </div>
                <div className="text-sm text-gray-400">{rec.reason}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-white mb-2">Asset Performance</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={portfolioData.assetPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Performance']}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Bar 
                    dataKey="performance" 
                    name="Performance"
                    radius={[4, 4, 0, 0]}
                  >
                    {portfolioData.assetPerformance.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.performance >= 0 ? '#10b981' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 