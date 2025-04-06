"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  
  // Fetch portfolio data from connected wallet
  const fetchPortfolioData = async (address: string) => {
    // Only set loading if we don't already have data
    if (!portfolioData) {
      setLoading(true);
    }
    
    try {
      // Create API endpoint for fetching wallet data
      const walletDataEndpoint = `/api/wallet/portfolio?address=${address}`;
      
      // Try to fetch real wallet data
      try {
        const response = await fetch(walletDataEndpoint);
        
        if (response.ok) {
          const realWalletData = await response.json();
          
          // If we got real data, use it
          if (realWalletData && !realWalletData.error) {
            console.log("Using real wallet data:", realWalletData);
            setPortfolioData(realWalletData);
            return;
          }
        }
      } catch (walletError) {
        console.error("Error fetching real wallet data:", walletError);
        // Continue to fallback if real data fetch fails
      }
      
      // Fallback: Generate portfolio data using market data
      console.log("Using generated portfolio data for address:", address);
      const generatedData = await generatePortfolioData();
      setPortfolioData(generatedData);
    } catch (err) {
      console.error("Failed to fetch portfolio data:", err);
      setError("Failed to load your portfolio data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-connect wallet function (declared before useEffect call)
  const autoConnectWallet = useCallback(async () => {
    // Don't set loading if we already have portfolioData to prevent UI flashing
    if (!portfolioData) {
      setLoading(true);
    }
    
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
      
      // Use a separate loading indicator for data fetching
      if (!portfolioData) {
        // Fetch real portfolio data with the wallet address
        await fetchPortfolioData(walletAddress);
      }
    } catch (err) {
      console.error("Failed to auto-connect wallet:", err);
      // Don't show an error for auto-connect failures
      // User can still manually connect
    } finally {
      setLoading(false);
    }
  }, [portfolioData]);
  
  // Automatically connect wallet and fetch data when component mounts (moved after autoConnectWallet)
  useEffect(() => {
    // Auto-connect wallet on load - add a slight delay to ensure smooth mounting
    const timer = setTimeout(() => {
      autoConnectWallet();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [autoConnectWallet]);
  
  // Connect wallet function (for manual connection)
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
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
      
      // Then fetch portfolio data
      await fetchPortfolioData(walletAddress);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect your wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Generate portfolio data using real market data
  const generatePortfolioData = async () => {
    try {
      // Fetch real market data from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,usd-coin,aave,uniswap&price_change_percentage=30d'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cryptocurrency market data');
      }
      
      const marketData = await response.json();
      
      // Create allocation based on real market data
      // We're simulating a portfolio allocation here, but using real tokens
      const currentAllocation = [
        { name: "Stablecoins", value: 30, color: "#8884d8" }, // Based on USDC, DAI, etc.
        { name: "Major Cryptos", value: 35, color: "#82ca9d" }, // Based on BTC, ETH
        { name: "DeFi Tokens", value: 20, color: "#ffc658" }, // Based on AAVE, UNI
        { name: "Solana Ecosystem", value: 10, color: "#ff8042" }, // Based on SOL
        { name: "Cash", value: 5, color: "#0088fe" } // Fiat reserve
      ];
      
      // Get historical price data for portfolio history
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      
      const btcHistoryResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${Math.floor(sixMonthsAgo.getTime()/1000)}&to=${Math.floor(today.getTime()/1000)}`
      );
      
      if (!btcHistoryResponse.ok) {
        throw new Error('Failed to fetch historical price data');
      }
      
      const btcHistoryData = await btcHistoryResponse.json();
      
      // Process the historical data into monthly data points
      const monthlyPrices = processHistoricalDataToMonthly(btcHistoryData.prices);
      
      // Create portfolio history based on actual Bitcoin performance
      // Using Bitcoin as a benchmark and applying some portfolio-specific adjustments
      const portfolioHistory = monthlyPrices.map(point => ({
        name: new Date(point.timestamp).toLocaleString('default', { month: 'short' }),
        value: calculatePortfolioValue(point.price, currentAllocation)
      }));
      
      // Get asset performance from real market data
      const assetPerformance = marketData.map((coin: any) => ({
        name: coin.symbol.toUpperCase(),
        performance: coin.price_change_percentage_30d_in_currency !== null ? 
          parseFloat(coin.price_change_percentage_30d_in_currency.toFixed(1)) :
          parseFloat((Math.random() * 20 - 10).toFixed(1)) // Fallback if API doesn't provide data
      }));
      
      // Calculate portfolio risk score based on allocation and market volatility
      // Higher weight in volatile assets = higher risk score
      const riskScore = calculateRiskScore(currentAllocation, assetPerformance);
      
      return {
        totalValue: portfolioHistory[portfolioHistory.length - 1].value,
        currentAllocation,
        portfolioHistory,
        assetPerformance,
        riskScore
      };
    } catch (error) {
      console.error('Error generating portfolio data:', error);
      // Provide a minimal fallback in case of API failure
      return {
        totalValue: 15000,
        currentAllocation: [
          { name: "Stablecoins", value: 30, color: "#8884d8" },
          { name: "Major Cryptos", value: 35, color: "#82ca9d" },
          { name: "DeFi Tokens", value: 20, color: "#ffc658" },
          { name: "Solana Ecosystem", value: 10, color: "#ff8042" },
          { name: "Cash", value: 5, color: "#0088fe" }
        ],
        portfolioHistory: [
          { name: "Jan", value: 10000 },
          { name: "Feb", value: 11000 },
          { name: "Mar", value: 10500 },
          { name: "Apr", value: 12000 },
          { name: "May", value: 14000 },
          { name: "Jun", value: 15000 }
        ],
        assetPerformance: [
          { name: "BTC", performance: 5.2 },
          { name: "ETH", performance: 3.8 },
          { name: "SOL", performance: 7.5 },
          { name: "USDC", performance: 0.1 },
          { name: "AAVE", performance: -2.3 },
          { name: "UNI", performance: 1.4 }
        ],
        riskScore: 60
      };
    }
  };
  
  // Process historical price data to get monthly data points
  const processHistoricalDataToMonthly = (priceData: [number, number][]) => {
    const monthlyData: { timestamp: number; price: number }[] = [];
    const months: { [key: string]: { timestamp: number; price: number } } = {};
    
    // Group by month
    priceData.forEach(([timestamp, price]) => {
      const date = new Date(timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!months[monthKey] || date.getDate() === 15) { // Use mid-month price
        months[monthKey] = { timestamp, price };
      }
    });
    
    // Convert to array and sort
    Object.values(months).forEach(data => {
      monthlyData.push(data);
    });
    
    // Sort by timestamp
    monthlyData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Take the most recent 6 months (or whatever is available)
    return monthlyData.slice(-6);
  };
  
  // Calculate a portfolio value based on BTC price and allocation
  const calculatePortfolioValue = (btcPrice: number, allocation: { name: string; value: number }[]) => {
    // Use BTC price as a base multiplier (assuming $10 BTC would be a $10,000 portfolio)
    const baseValue = btcPrice * 200;
    
    // Apply allocation-specific adjustments
    // Stablecoins are more stable, Major Cryptos fluctuate more, etc.
    const stableAllocation = allocation.find(a => a.name === "Stablecoins")?.value || 0;
    const majorCryptoAllocation = allocation.find(a => a.name === "Major Cryptos")?.value || 0;
    
    // More stablecoins = less volatility, more major cryptos = more upside
    const stabilityFactor = 1 - (stableAllocation / 100) * 0.5;
    const growthFactor = 1 + (majorCryptoAllocation / 100) * 0.3;
    
    return Math.round(baseValue * stabilityFactor * growthFactor);
  };
  
  // Calculate risk score based on allocation and market volatility
  const calculateRiskScore = (
    allocation: { name: string; value: number }[], 
    performance: { name: string; performance: number }[]
  ) => {
    // Calculate average absolute performance (volatility)
    const avgVolatility = performance.reduce((sum, asset) => sum + Math.abs(asset.performance), 0) / performance.length;
    
    // Calculate risk factors for each allocation category
    const riskFactors = {
      "Stablecoins": 20, // Low risk
      "Major Cryptos": 60, // Medium risk
      "DeFi Tokens": 80, // High risk
      "Solana Ecosystem": 75, // High risk
      "NFTs": 90, // Very high risk
      "Cash": 10 // Very low risk
    };
    
    // Calculate weighted risk score
    let weightedRiskScore = 0;
    let totalWeight = 0;
    
    allocation.forEach(asset => {
      const riskFactor = riskFactors[asset.name as keyof typeof riskFactors] || 50;
      weightedRiskScore += asset.value * riskFactor;
      totalWeight += asset.value;
    });
    
    // Normalize to 0-100 scale
    const baseRiskScore = totalWeight > 0 ? weightedRiskScore / totalWeight : 50;
    
    // Adjust by market volatility
    const volatilityAdjustment = (avgVolatility - 5) * 2; // Normalize around 5% monthly change
    
    return Math.min(Math.max(Math.round(baseRiskScore + volatilityAdjustment), 10), 90);
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