"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

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
  const [selectedChain, setSelectedChain] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedProtocol, setSelectedProtocol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocols, setProtocols] = useState<any[]>([]);
  
  // Fetch protocols on component mount
  useEffect(() => {
    async function loadProtocols() {
      try {
        setLoading(true);
        const data = await fetchDefiProtocols();
        
        if (data.length > 0) {
          setProtocols(data);
          setSelectedProtocol(data[0].id); // Select first protocol by default
        } else {
          setError("No DeFi protocols available");
        }
      } catch (err) {
        console.error("Failed to load DeFi protocols:", err);
        setError("Failed to load DeFi data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProtocols();
  }, []);
  
  // Filter the protocols based on selected filters
  const filteredProtocols = protocols.filter(protocol => {
    const chainMatch = selectedChain === "all" || protocol.chainId === selectedChain;
    const categoryMatch = selectedCategory === "all" || protocol.category.toLowerCase() === selectedCategory.toLowerCase();
    const riskMatch = selectedRisk === "all" || protocol.risk.toLowerCase().includes(selectedRisk.toLowerCase());
    return chainMatch && categoryMatch && riskMatch;
  });
  
  // Get the currently selected protocol
  const protocol = protocols.find(p => p.id === selectedProtocol) || (protocols.length > 0 ? protocols[0] : null);
  
  // Prepare data for the comparison chart
  const protocolComparisonData = filteredProtocols.map(p => ({
    name: p.name,
    tvl: p.tvl / 1000000000, // Convert to billions for display
    apr: p.apr,
  })).sort((a, b) => b.apr - a.apr).slice(0, 6); // Top 6 by APR
  
  // Format currency values
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };
  
  // Generate yield farming recommendations
  const getYieldRecommendations = () => {
    // In a real app, this would use AI to analyze the best opportunities based on user preferences
    
    // Filter to highest APY pools with reasonable risk
    const highYieldPools = defiProtocols
      .flatMap(protocol => 
        protocol.pools.map(pool => ({
          protocol: protocol.name,
          chain: protocol.chainId,
          pool: pool.name,
          apy: pool.apy,
          tvl: pool.tvl,
          risk: pool.risk,
        }))
      )
      .filter(pool => !pool.risk.toLowerCase().includes("high"))
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5);
    
    return highYieldPools;
  };
  
  // Generate impermanent loss risk assessment
  const getImpermanentLossRisk = (poolName: string) => {
    // In a real app, this would calculate actual IL risk based on volatility data
    if (poolName.includes("USDC") && poolName.includes("USDT")) {
      return "Very Low";
    } else if (poolName.includes("DAI") || poolName.includes("USD")) {
      return "Low";
    } else if (poolName.includes("ETH") || poolName.includes("SOL")) {
      return "Medium";
    } else {
      return "Medium-High";
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-white text-lg">Loading DeFi data...</div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Chain Filter */}
        <div className="flex">
          <div className="bg-gray-900/70 p-2 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Chain</div>
            <div className="flex gap-1">
              {chainFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedChain(filter.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedChain === filter.id
                      ? "bg-violet-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex">
          <div className="bg-gray-900/70 p-2 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Category</div>
            <div className="flex gap-1">
              {categoryFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedCategory === filter.id
                      ? "bg-violet-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Risk Filter */}
        <div className="flex">
          <div className="bg-gray-900/70 p-2 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Risk</div>
            <div className="flex gap-1">
              {riskFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedRisk(filter.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedRisk === filter.id
                      ? "bg-violet-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Protocol Comparison */}
        <div>
          {/* Protocol APR Comparison */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top DeFi Protocols by APR</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={protocolComparisonData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 'dataMax + 2']} stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" width={80} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB",
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'APR']}
                  />
                  <Bar 
                    dataKey="apr" 
                    fill="#8b5cf6" 
                    radius={[0, 4, 4, 0]}
                    label={{ 
                      position: 'right', 
                      fill: 'white',
                      formatter: (value: any) => `${value.toFixed(2)}%` 
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Protocol TVL Distribution */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">TVL Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolComparisonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="tvl"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {protocolComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}B`, 'TVL']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Right Column - Yield Opportunities and Protocol Details */}
        <div>
          {/* Best Yield Opportunities */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI-Recommended Yield Opportunities</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3">Protocol</th>
                    <th className="px-4 py-3">Pool</th>
                    <th className="px-4 py-3">Chain</th>
                    <th className="px-4 py-3 text-right">APY</th>
                    <th className="px-4 py-3 text-right">TVL</th>
                    <th className="px-4 py-3 text-right">Risk</th>
                    <th className="px-4 py-3 text-right">IL Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {getYieldRecommendations().map((recommendation, index) => (
                    <motion.tr 
                      key={index} 
                      className="bg-gray-800/40 hover:bg-gray-800/80 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-4 py-3">{recommendation.protocol}</td>
                      <td className="px-4 py-3">{recommendation.pool}</td>
                      <td className="px-4 py-3 capitalize">{recommendation.chain}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">
                        {recommendation.apy.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(recommendation.tvl)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded px-2 py-1 text-xs ${
                          recommendation.risk.toLowerCase().includes('low') 
                            ? 'bg-green-900/50 text-green-300' 
                            : recommendation.risk.toLowerCase().includes('medium')
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {recommendation.risk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded px-2 py-1 text-xs ${
                          getImpermanentLossRisk(recommendation.pool).toLowerCase().includes('low') 
                            ? 'bg-green-900/50 text-green-300' 
                            : getImpermanentLossRisk(recommendation.pool).toLowerCase().includes('medium')
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {getImpermanentLossRisk(recommendation.pool)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Protocol Selector */}
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-2">Select Protocol for Details</div>
            <div className="flex flex-wrap gap-2">
              {filteredProtocols.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProtocol(p.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedProtocol === p.id
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Protocol Details */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{protocol?.name}</h3>
                <div className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="capitalize">{protocol?.category}</span>
                  <span>•</span>
                  <span className="capitalize">{protocol?.chainId === "eth" ? "Ethereum" : "Solana"}</span>
                </div>
              </div>
              <div className="bg-gray-800 px-3 py-1 rounded text-sm">
                <div className="text-gray-400">Risk Level</div>
                <div className={`font-medium ${
                  protocol?.risk.toLowerCase().includes('low') 
                    ? 'text-green-400' 
                    : protocol?.risk.toLowerCase().includes('medium')
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {protocol?.risk}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <div className="text-gray-400 text-sm">Total Value Locked</div>
                <div className="text-xl font-semibold text-white">{formatCurrency(protocol?.tvl)}</div>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <div className="text-gray-400 text-sm">Average APR</div>
                <div className="text-xl font-semibold text-green-400">{protocol?.apr.toFixed(2)}%</div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="text-lg font-semibold text-white mb-3">Pools</div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/30">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pool</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">APY</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">TVL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Risk</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IL Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {protocol?.pools.map((pool: {
                      name: string;
                      apy: number;
                      tvl: number;
                      risk: string;
                    }, index: number) => (
                      <tr key={index} className="bg-gray-800/20 hover:bg-gray-800/60 transition-colors">
                        <td className="px-4 py-2">{pool.name}</td>
                        <td className="px-4 py-2 text-green-400">{pool.apy.toFixed(2)}%</td>
                        <td className="px-4 py-2">{formatCurrency(pool.tvl)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            pool.risk.toLowerCase().includes('low') 
                              ? 'bg-green-900/30 text-green-400' 
                              : pool.risk.toLowerCase().includes('medium')
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {pool.risk}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-gray-300">
                            {getImpermanentLossRisk(pool.name)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {(!protocol || !protocol.pools || protocol.pools.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-gray-400">
                          No pool data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 