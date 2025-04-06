"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useDefiStore, useWalletStore } from "@/store";
import { formatDefiPositionValue, calculateRiskLevel, estimatePositionAPY } from "@/lib/moralis/defiApi";

// Mock DeFi protocols data (in a real app, this would come from Moralis API)
const defiProtocols = [
  { 
    id: "aave", 
    name: "Aave", 
    category: "Lending", 
    chainId: "eth", 
    tvl: 4200000000, 
    apr: 4.32,
    risk: "Low",
    pools: [
      { name: "USDC", apy: 3.89, tvl: 980000000, risk: "Low" },
      { name: "ETH", apy: 2.31, tvl: 1200000000, risk: "Low" },
      { name: "USDT", apy: 3.91, tvl: 875000000, risk: "Low" },
      { name: "DAI", apy: 3.72, tvl: 560000000, risk: "Low" },
    ]
  },
  { 
    id: "curve", 
    name: "Curve Finance", 
    category: "DEX", 
    chainId: "eth", 
    tvl: 3100000000, 
    apr: 5.87,
    risk: "Low-Medium",
    pools: [
      { name: "3pool", apy: 4.51, tvl: 720000000, risk: "Low" },
      { name: "stETH", apy: 6.82, tvl: 890000000, risk: "Medium" },
      { name: "tricrypto", apy: 8.93, tvl: 430000000, risk: "Medium" },
      { name: "sUSD", apy: 5.21, tvl: 350000000, risk: "Low-Medium" },
    ]
  },
  { 
    id: "raydium", 
    name: "Raydium", 
    category: "DEX", 
    chainId: "sol", 
    tvl: 180000000, 
    apr: 11.54,
    risk: "Medium",
    pools: [
      { name: "SOL-USDC", apy: 12.87, tvl: 38000000, risk: "Medium" },
      { name: "RAY-USDC", apy: 18.32, tvl: 22000000, risk: "Medium-High" },
      { name: "SOL-RAY", apy: 14.91, tvl: 16500000, risk: "Medium" },
      { name: "USDT-USDC", apy: 5.64, tvl: 42000000, risk: "Low" },
    ]
  },
  { 
    id: "orca", 
    name: "Orca", 
    category: "DEX", 
    chainId: "sol", 
    tvl: 155000000, 
    apr: 9.73,
    risk: "Medium",
    pools: [
      { name: "SOL-USDC", apy: 10.54, tvl: 32000000, risk: "Medium" },
      { name: "ETH-SOL", apy: 13.21, tvl: 18500000, risk: "Medium" },
      { name: "ORCA-USDC", apy: 16.82, tvl: 12000000, risk: "Medium-High" },
      { name: "USDT-USDC", apy: 4.98, tvl: 38000000, risk: "Low" },
    ]
  },
  { 
    id: "marinade", 
    name: "Marinade Finance", 
    category: "Staking", 
    chainId: "sol", 
    tvl: 220000000, 
    apr: 6.51,
    risk: "Low",
    pools: [
      { name: "mSOL", apy: 6.51, tvl: 220000000, risk: "Low" },
    ]
  },
  { 
    id: "lido", 
    name: "Lido", 
    category: "Staking", 
    chainId: "eth", 
    tvl: 12500000000, 
    apr: 3.85,
    risk: "Low",
    pools: [
      { name: "stETH", apy: 3.85, tvl: 12500000000, risk: "Low" },
    ]
  }
];

// Filter options
const chainFilters = [
  { id: "all", label: "All Chains" },
  { id: "eth", label: "Ethereum" },
  { id: "sol", label: "Solana" },
];

const categoryFilters = [
  { id: "all", label: "All Categories" },
  { id: "lending", label: "Lending" },
  { id: "dex", label: "DEX" },
  { id: "staking", label: "Staking" },
];

const riskFilters = [
  { id: "all", label: "All Risks" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

// Colors for charts
const COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#ec4899', '#8b5cf6', '#6366f1'];

// DeFi protocols data from real-time sources
// We'll fetch this data from CoinGecko API via our proxy
const fetchDefiProtocols = async () => {
  try {
    // Fetch top DeFi protocols from CoinGecko via our proxy
    const response = await fetch(
      '/api/coingecko?endpoint=coins/markets&vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=20&page=1'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch DeFi protocol data');
    }
    
    const defiData = await response.json();
    
    // Get more details about the top protocols
    const detailsPromises = defiData.slice(0, 6).map(async (coin: any) => {
      const detailResponse = await fetch(
        `/api/coingecko?endpoint=coins/${coin.id}&localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      
      if (!detailResponse.ok) {
        return null;
      }
      
      return await detailResponse.json();
    });
    
    const detailsData = await Promise.all(detailsPromises);
    
    // Map the data to our protocol format
    const protocols = defiData.slice(0, 6).map((coin: any, index: number) => {
      const details = detailsData[index];
      const categories = details?.categories || [];
      
      // Determine category
      let category = "DeFi";
      if (categories.includes("lending-borowing")) {
        category = "Lending";
      } else if (categories.includes("decentralized-exchange")) {
        category = "DEX";
      } else if (categories.includes("yield-farming")) {
        category = "Yield";
      } else if (categories.includes("staking")) {
        category = "Staking";
      }
      
      // Determine chain
      let chainId = "eth";
      if (details?.asset_platform_id === "solana") {
        chainId = "sol";
      } else if (details?.asset_platform_id === "binance-smart-chain") {
        chainId = "bnb";
      } else if (details?.asset_platform_id === "polygon-pos") {
        chainId = "matic";
      }
      
      // Generate realistic APR based on market data
      const marketCap = coin.market_cap || 1000000;
      const volume = coin.total_volume || 100000;
      const volatility = Math.abs(coin.price_change_percentage_24h || 5);
      
      // Higher volume/market cap ratio and volatility often correlates with higher yields
      const baseApr = 3 + (volume / marketCap) * 100 + (volatility / 10);
      const apr = Math.min(Math.max(baseApr, 1), 30); // Cap between 1% and 30%
      
      // Risk assessment based on market data
      let risk;
      if (volatility < 3 && marketCap > 1000000000) {
        risk = "Low";
      } else if (volatility < 8 && marketCap > 100000000) {
        risk = "Low-Medium";
      } else if (volatility < 15) {
        risk = "Medium";
      } else {
        risk = "Medium-High";
      }
      
      // Generate realistic pools
      const pools = generatePools(coin.symbol.toUpperCase(), category, apr, coin.market_cap);
      
      return {
        id: coin.id,
        name: coin.name,
        category,
        chainId,
        tvl: coin.market_cap / 4, // Use market cap as a proxy for TVL (typically lower)
        apr,
        risk,
        pools
      };
    });
    
    return protocols;
  } catch (error) {
    console.error('Error fetching DeFi protocols:', error);
    return [];
  }
};

// Helper function to generate realistic pools based on protocol characteristics
const generatePools = (
  symbol: string, 
  category: string, 
  baseApr: number, 
  marketCap: number
) => {
  // Different pool types based on category
  if (category === "Lending") {
    return [
      { name: "USDC", apy: baseApr * 0.9, tvl: marketCap * 0.25, risk: "Low" },
      { name: "ETH", apy: baseApr * 0.6, tvl: marketCap * 0.3, risk: "Low" },
      { name: "USDT", apy: baseApr * 0.95, tvl: marketCap * 0.2, risk: "Low" },
      { name: "DAI", apy: baseApr * 0.85, tvl: marketCap * 0.15, risk: "Low" },
    ];
  } else if (category === "DEX") {
    return [
      { name: `${symbol}-USDC`, apy: baseApr * 1.2, tvl: marketCap * 0.2, risk: "Medium" },
      { name: "ETH-USDC", apy: baseApr * 0.9, tvl: marketCap * 0.25, risk: "Medium" },
      { name: `${symbol}-ETH`, apy: baseApr * 1.5, tvl: marketCap * 0.1, risk: "Medium-High" },
      { name: "USDT-USDC", apy: baseApr * 0.5, tvl: marketCap * 0.3, risk: "Low" },
    ];
  } else if (category === "Staking") {
    return [
      { name: symbol, apy: baseApr, tvl: marketCap * 0.8, risk: "Low" },
    ];
  } else {
    // Generic pools for other categories
    return [
      { name: `${symbol} Pool 1`, apy: baseApr * 1.1, tvl: marketCap * 0.3, risk: "Medium" },
      { name: `${symbol} Pool 2`, apy: baseApr * 1.3, tvl: marketCap * 0.2, risk: "Medium" },
      { name: `${symbol}-USDC`, apy: baseApr * 0.9, tvl: marketCap * 0.25, risk: "Low-Medium" },
      { name: `${symbol} Boost`, apy: baseApr * 1.6, tvl: marketCap * 0.1, risk: "Medium-High" },
    ];
  }
};

export default function DeFiInsights() {
  // State for filters
  const [activeChain, setActiveChain] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeRisk, setActiveRisk] = useState("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  
  // Get wallet from wallet store
  const { connected, publicKey } = useWalletStore();
  
  // Get DeFi data from DeFi store
  const { 
    isLoading, 
    error, 
    protocolSummary, 
    positions,
    totalValue,
    fetchDefiSummary, 
    fetchDefiPositions,
    fetchDefiPositionsByProtocol
  } = useDefiStore();

  // Load DeFi data when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchDefiSummary(publicKey);
      fetchDefiPositions(publicKey);
    }
  }, [connected, publicKey, fetchDefiSummary, fetchDefiPositions]);

  // Load protocol-specific positions when a protocol is selected
  useEffect(() => {
    if (connected && publicKey && selectedProtocol) {
      fetchDefiPositionsByProtocol(publicKey, selectedProtocol);
    }
  }, [connected, publicKey, selectedProtocol, fetchDefiPositionsByProtocol]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter protocols based on active filters
  const filteredProtocols = protocolSummary
    .filter(protocol => activeChain === "all" || protocol.chain === activeChain)
    .filter(protocol => {
      if (activeCategory === "all") return true;
      const category = protocol.protocol.toLowerCase();
      if (activeCategory === "lending" && (category.includes("aave") || category.includes("compound"))) return true;
      if (activeCategory === "dex" && (category.includes("uniswap") || category.includes("curve") || category.includes("sushi"))) return true;
      if (activeCategory === "staking" && (category.includes("lido") || category.includes("staked"))) return true;
      return false;
    })
    .filter(protocol => {
      if (activeRisk === "all") return true;
      const risk = calculateRiskLevel(protocol.protocol, protocol.positionValue);
      return risk.toLowerCase() === activeRisk;
    });

  // Filter positions based on selected protocol
  const filteredPositions = positions.filter(position => 
    (!selectedProtocol || position.protocol === selectedProtocol) &&
    (activeChain === "all" || position.chain === activeChain)
  );

  // Chart data for protocol distribution
  const protocolChartData = filteredProtocols.map(protocol => ({
    name: protocol.protocol,
    value: protocol.positionValue,
  }));

  // Get yield recommendations
  const getYieldRecommendations = () => {
    // Sort positions by estimated APY
    return filteredPositions
      .map(position => ({
        ...position,
        estimatedApy: estimatePositionAPY(position.protocol, position.tokenSymbol.toLowerCase()),
      }))
      .sort((a, b) => b.estimatedApy - a.estimatedApy)
      .slice(0, 3);
  };

  // Determine impermanent loss risk for LP positions
  const getImpermanentLossRisk = (position: any) => {
    if (!position.lpDetails) return 'N/A';
    
    // LP positions with volatile assets typically have higher IL risk
    const volatilityScore = position.protocol.toLowerCase().includes('uniswap') ? 2 : 1;
    const pairRisk = position.tokenSymbol.toLowerCase().includes('eth') ? 1.5 : 1;
    
    const score = volatilityScore * pairRisk;
    
    if (score > 2) return 'High';
    if (score > 1.3) return 'Medium';
    return 'Low';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">DeFi Insights</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">DeFi Insights</h2>
        <div className="text-center p-6 text-red-500">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            onClick={() => {
              if (publicKey) {
                fetchDefiSummary(publicKey);
                fetchDefiPositions(publicKey);
              }
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connected || !publicKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">DeFi Insights</h2>
        <div className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Connect your wallet to view your DeFi positions</p>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!Array.isArray(protocolSummary) || protocolSummary.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">DeFi Insights</h2>
        <div className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-1">No DeFi positions found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
            Your connected wallet doesn't have any DeFi positions we could detect
          </p>
          {publicKey && publicKey.startsWith('0x') && (
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              onClick={() => {
                fetchDefiSummary(publicKey);
                fetchDefiPositions(publicKey);
              }}
            >
              Refresh Data
            </button>
          )}
          {publicKey && !publicKey.startsWith('0x') && (
            <p className="text-sm text-amber-500">
              Note: DeFi data is currently only available for Ethereum wallets
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">DeFi Insights</h2>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalValue)}</p>
        </div>
      </div>
      
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex flex-wrap gap-2 mr-4">
          {chainFilters.map((filter) => (
            <button
              key={filter.id}
              className={`px-3 py-1 text-sm rounded-full transition ${
                activeChain === filter.id
                  ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveChain(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 mr-4">
          {categoryFilters.map((filter) => (
            <button
              key={filter.id}
              className={`px-3 py-1 text-sm rounded-full transition ${
                activeCategory === filter.id
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveCategory(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {riskFilters.map((filter) => (
            <button
              key={filter.id}
              className={`px-3 py-1 text-sm rounded-full transition ${
                activeRisk === filter.id
                  ? "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveRisk(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Distribution */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Protocol Distribution</h3>
          {protocolChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {protocolChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(name) => `Protocol: ${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No protocol data available</p>
            </div>
          )}
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {filteredProtocols.slice(0, 4).map((protocol) => (
                <button
                  key={protocol.protocol}
                  className={`p-2 text-sm rounded-lg transition ${
                    selectedProtocol === protocol.protocol
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800"
                  }`}
                  onClick={() => setSelectedProtocol(
                    selectedProtocol === protocol.protocol ? null : protocol.protocol
                  )}
                >
                  <div className="font-medium">{protocol.protocol}</div>
                  <div className="text-xs opacity-80">{formatDefiPositionValue(protocol.positionValue)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Positions */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
            {selectedProtocol ? `${selectedProtocol} Positions` : 'DeFi Positions'}
          </h3>
          <div className="overflow-auto max-h-64">
            {filteredPositions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Est. APY</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPositions.map((position, index) => {
                    const estimatedApy = estimatePositionAPY(position.protocol, position.tokenSymbol.toLowerCase());
                    const risk = calculateRiskLevel(position.protocol, position.balanceUsd);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{position.tokenSymbol}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{position.protocol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(position.balanceUsd)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {estimatedApy.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            risk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            risk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedProtocol ? 
                    `No positions found for ${selectedProtocol}` : 
                    'No positions data available'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Yield Opportunities */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Best Yield Opportunities</h3>
          <div className="space-y-3">
            {getYieldRecommendations().length > 0 ? (
              getYieldRecommendations().map((position, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{position.tokenSymbol}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{position.protocol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">{position.estimatedApy.toFixed(2)}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">APY</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No yield opportunities available</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
            <p>APY estimates based on historical performance</p>
          </div>
        </div>
        
        {/* Risk Analysis */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Risk Analysis</h3>
          <div className="overflow-auto max-h-64">
            {filteredProtocols.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Protocol</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exposure</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredProtocols.map((protocol, idx) => {
                    const risk = calculateRiskLevel(protocol.protocol, protocol.positionValue);
                    const exposure = (protocol.positionValue / totalValue) * 100;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {protocol.protocol}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            risk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            risk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {risk}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {exposure.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No risk data available</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p className="mb-1"><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Low: Well-established protocols with strong security track record</p>
            <p className="mb-1"><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Medium: Known protocols with some risk factors</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span> High: New or experimental protocols with higher risk profile</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 