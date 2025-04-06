"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid
} from "recharts";
import { useWalletStore } from "@/store/walletStore";
import { usePortfolioStore } from "@/store/portfolioStore";

// Define colors for visualization
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
  // Local state
  const [error, setError] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<keyof typeof riskProfiles>("moderate");
  
  // Global state from Zustand stores
  const { connected, publicKey, setConnected, setPublicKey } = useWalletStore();
  const { 
    data: portfolioData, 
    isLoading, 
    error: portfolioError, 
    fetchPortfolioData,
    clearError 
  } = usePortfolioStore();
  
  // Auto-connect wallet function (declared before useEffect call)
  const autoConnectWallet = useCallback(async () => {
    try {
      // Check if wallet is already connected via browser extension
      const phantomWallet = (window as any)?.phantom?.solana;
      const solflareWallet = (window as any)?.solflare;
      
      let walletAddress = null;
      
      // Try to get connected wallet address
      if (phantomWallet && phantomWallet.isConnected) {
        walletAddress = phantomWallet.publicKey.toString();
      } else if (solflareWallet && solflareWallet.isConnected) {
        walletAddress = solflareWallet.publicKey.toString();
      } else {
        // Fallback to simulated wallet address
        walletAddress = "FZLEgWgW6Li3zUeqYgChYmPpxfcRQiDjTU2y8hQFLQc8";
      }
      
      // Set wallet connected first to avoid UI flashing
      setWalletAddress(walletAddress);
      setWalletConnected(true);
      
      // Update global wallet store
      setConnected(true);
      setPublicKey(walletAddress);
      
      // Fetch real portfolio data with the wallet address
      await fetchPortfolioData(walletAddress);
    } catch (err) {
      console.error("Failed to auto-connect wallet:", err);
      // Don't show an error for auto-connect failures
      // User can still manually connect
    }
  }, [setConnected, setPublicKey, fetchPortfolioData]);
  
  // Automatically connect wallet and fetch data when component mounts
  useEffect(() => {
    // Auto-connect wallet on load - add a slight delay to ensure smooth mounting
    const timer = setTimeout(() => {
      autoConnectWallet();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [autoConnectWallet]);
  
  // Also fetch data if we have a public key but no data
  useEffect(() => {
    if (publicKey && !portfolioData && !isLoading) {
      fetchPortfolioData(publicKey);
    }
  }, [publicKey, portfolioData, isLoading, fetchPortfolioData]);
  
  // Connect wallet function (for manual connection)
  const connectWallet = async () => {
    setError(null);
    clearError();
    
    try {
      // Try to use actual wallet adapters if available
      const phantomWallet = (window as any)?.phantom?.solana;
      const solflareWallet = (window as any)?.solflare;
      
      let walletAddress = null;
      
      // Try connecting to Phantom or Solflare
      if (phantomWallet) {
        try {
          // Connect to Phantom wallet
          const resp = await phantomWallet.connect();
          walletAddress = resp.publicKey.toString();
        } catch (connectErr) {
          console.error("Failed to connect to Phantom:", connectErr);
        }
      } else if (solflareWallet) {
        try {
          // Connect to Solflare wallet
          const resp = await solflareWallet.connect();
          walletAddress = resp.publicKey.toString();
        } catch (connectErr) {
          console.error("Failed to connect to Solflare:", connectErr);
        }
      }
      
      // If wallet connection failed, use simulation
      if (!walletAddress) {
        await new Promise(resolve => setTimeout(resolve, 800));
        walletAddress = "FZLEgWgW6Li3zUeqYgChYmPpxfcRQiDjTU2y8hQFLQc8";
      }
      
      // Set connected state first to avoid flashing
      setWalletAddress(walletAddress);
      setWalletConnected(true);
      
      // Update global wallet store
      setConnected(true);
      setPublicKey(walletAddress);
      
      // Then fetch portfolio data
      await fetchPortfolioData(walletAddress, true); // Force refresh
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect your wallet. Please try again.");
    }
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get portfolio recommendations based on current allocation and risk profile
  const getRecommendations = () => {
    if (!portfolioData) return [];
    
    // Use the stored data to provide recommendations
    const currentAllocation = portfolioData.currentAllocation;
    
    // Identify most concentrated asset
    let mostConcentrated = { name: '', value: 0 };
    let lowDiversification = false;
    
    currentAllocation.forEach(asset => {
      if (asset.value > mostConcentrated.value) {
        mostConcentrated = asset;
      }
      
      // Consider anything over 50% to be highly concentrated
      if (asset.value > 50) {
        lowDiversification = true;
      }
    });
    
    // Risk profile target allocation
    const targetAllocation = riskProfiles[selectedRiskProfile].allocation;
    
    // Find major differences between current allocation and target
    const differences = [];
    
    for (const target of targetAllocation) {
      const current = currentAllocation.find(asset => asset.name === target.name);
      
      if (current) {
        const diff = target.value - current.value;
        
        // If difference is significant (more than 10%)
        if (Math.abs(diff) > 10) {
          differences.push({
            asset: target.name,
            current: current.value,
            target: target.value,
            diff
          });
        }
      }
    }
    
    // Generate recommendations based on findings
    const recommendations = [];
    
    // Recommendation for diversification if needed
    if (lowDiversification) {
      recommendations.push({
        type: 'warning',
        title: 'High Concentration Risk',
        reason: `Your portfolio is heavily concentrated in ${mostConcentrated.name}. Consider diversifying to reduce risk`
      });
    }
    
    // Recommendations based on target allocation
    differences.forEach(diff => {
      if (diff.diff > 0) {
        recommendations.push({
          type: 'suggestion',
          title: `Increase ${diff.asset} Exposure`,
          reason: `Consider increasing ${diff.asset} from ${diff.current}% to ${diff.target}% to better align with your ${selectedRiskProfile} risk profile`
        });
      } else {
        recommendations.push({
          type: 'suggestion',
          title: `Reduce ${diff.asset} Exposure`,
          reason: `Consider reducing ${diff.asset} from ${diff.current}% to ${diff.target}% to better align with your ${selectedRiskProfile} risk profile`
        });
      }
    });
    
    return recommendations;
  };

  // Combined loading state
  const loading = isLoading || (!walletConnected && !error);
  
  // Show loading state
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-violet-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-white text-lg">
            {walletConnected ? "Analyzing your portfolio data..." : "Connecting to your wallet..."}
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state if needed
  if (error || portfolioError) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="bg-red-900/30 text-red-200 p-4 rounded-lg max-w-md mx-auto">
            <p className="text-lg mb-4">{error || portfolioError}</p>
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show connect wallet UI if no wallet is connected
  if (!walletConnected || !walletAddress) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="text-white text-lg mb-6">Connect your wallet to get personalized portfolio analysis</div>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0011.586 2H8.414a1 1 0 00-.707.293L6.293 3.707A1 1 0 015.586 4H4zm.5 5a.5.5 0 000 1h11a.5.5 0 000-1h-11z" clipRule="evenodd"></path>
          </svg>
          Connect Wallet
        </button>
      </div>
    );
  }
  
  // Make sure portfolio data is available
  if (!portfolioData) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-violet-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-white text-lg">Loading portfolio data...</div>
        </div>
      </div>
    );
  }
  
  // Main portfolio UI
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Left Column */}
      <div>
        <h2 className="text-xl font-semibold text-white">Your Personalized Portfolio</h2>
        
        {/* Portfolio Value */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <div className="text-sm text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(portfolioData.totalValue)}</div>
        </div>
        
        {/* Portfolio Analysis */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Asset Allocation</h3>
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
                  labelLine={false}
                  isAnimationActive={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill={COLORS[index % COLORS.length]}
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {portfolioData.currentAllocation.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Color-coded legend for easy identification */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {portfolioData.currentAllocation
              .filter(asset => asset.value > 0)
              .map((asset, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: asset.color || COLORS[index % COLORS.length]}}></div>
                  <span className="text-sm text-gray-300">{asset.name}: <span className="font-medium">{asset.value}%</span></span>
                </div>
              ))}
          </div>
        </div>
        
        {/* Portfolio History */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Portfolio History</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolioData.portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" tick={{fill: '#ccc'}} />
                <YAxis tick={{fill: '#ccc'}} width={80} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#333', borderColor: '#555'}} 
                  formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']} 
                />
                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Right Column */}
      <div>
        {/* Risk Profile */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Risk Assessment</h3>
          
          {/* Risk Score with Gauge */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400">Risk Score</div>
              <div className="text-lg font-semibold text-white">{portfolioData.riskScore}/100</div>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={
                  portfolioData.riskScore < 40 
                    ? "h-full bg-green-500" 
                    : portfolioData.riskScore < 70 
                      ? "h-full bg-yellow-500"
                      : "h-full bg-red-500"
                }
                style={{ width: `${portfolioData.riskScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <div>Low Risk</div>
              <div>High Risk</div>
            </div>
          </div>
          
          {/* Risk Profile Selection */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Your Target Risk Profile</div>
            <div className="flex justify-between space-x-4">
              {Object.keys(riskProfiles).map((profile) => (
                <button
                  key={profile}
                  onClick={() => setSelectedRiskProfile(profile as keyof typeof riskProfiles)}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    selectedRiskProfile === profile 
                      ? "bg-violet-600 text-white" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {riskProfiles[profile as keyof typeof riskProfiles].name}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {riskProfiles[selectedRiskProfile].description}
            </div>
          </div>
          
          {/* Target Allocation */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-white mb-2">Target Allocation</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskProfiles[selectedRiskProfile].allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    isAnimationActive={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill={COLORS[index % COLORS.length]}
                          textAnchor={x > cx ? 'start' : 'end'} 
                          dominantBaseline="central"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {riskProfiles[selectedRiskProfile].allocation.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Color-coded legend for target allocation */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {riskProfiles[selectedRiskProfile].allocation.map((asset, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: asset.color || COLORS[index % COLORS.length]}}></div>
                  <span className="text-sm text-gray-300">{asset.name}: <span className="font-medium">{asset.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Asset Performance */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Asset Performance</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={portfolioData.assetPerformance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <XAxis type="number" domain={['dataMin', 'dataMax']} tick={{fill: '#ccc'}} />
                <YAxis dataKey="name" type="category" tick={{fill: '#ccc'}} width={80} />
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <Tooltip 
                  contentStyle={{backgroundColor: '#333', borderColor: '#555'}} 
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Bar dataKey="performance">
                  {portfolioData.assetPerformance.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.performance >= 0 ? '#4ade80' : '#f87171'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
          <div className="space-y-3">
            {getRecommendations().map((recommendation, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                recommendation.type === 'warning' ? 'bg-red-900/30' : 'bg-blue-900/30'
              }`}>
                <div className="font-medium text-white mb-1">{recommendation.title}</div>
                <div className="text-sm text-gray-300">{recommendation.reason}</div>
              </div>
            ))}
            {getRecommendations().length === 0 && (
              <div className="text-gray-400 italic">Your portfolio is well-aligned with your selected risk profile.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 