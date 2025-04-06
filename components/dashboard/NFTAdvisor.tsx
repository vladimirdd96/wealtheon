"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend
} from "recharts";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Mock NFT data (in a real app, this would come from Moralis API)
const trendingCollections = [
  {
    id: "azuki",
    name: "Azuki",
    floorPrice: 8.2,
    volume24h: 245,
    volume7d: 1820,
    priceChange24h: 3.8,
    priceChange7d: -2.1,
    marketCap: 82000000,
    items: 10000,
    owners: 5100,
    ownershipConcentration: "Medium",
    risk: "Medium",
    chain: "eth",
    priceHistory: [
      { date: "May 1", price: 8.4 },
      { date: "May 8", price: 8.7 },
      { date: "May 15", price: 8.3 },
      { date: "May 22", price: 7.9 },
      { date: "May 29", price: 8.0 },
      { date: "Jun 5", price: 8.2 }
    ],
    image: "/placeholder-nft-1.png"
  },
  {
    id: "doodles",
    name: "Doodles",
    floorPrice: 2.9,
    volume24h: 98,
    volume7d: 720,
    priceChange24h: -1.2,
    priceChange7d: 5.4,
    marketCap: 29000000,
    items: 10000,
    owners: 4800,
    ownershipConcentration: "Low",
    risk: "Low",
    chain: "eth",
    priceHistory: [
      { date: "May 1", price: 2.7 },
      { date: "May 8", price: 2.6 },
      { date: "May 15", price: 2.8 },
      { date: "May 22", price: 2.9 },
      { date: "May 29", price: 3.0 },
      { date: "Jun 5", price: 2.9 }
    ],
    image: "/placeholder-nft-2.png"
  },
  {
    id: "pudgypenguins",
    name: "Pudgy Penguins",
    floorPrice: 5.1,
    volume24h: 132,
    volume7d: 980,
    priceChange24h: 8.5,
    priceChange7d: 12.3,
    marketCap: 51000000,
    items: 8888,
    owners: 4100,
    ownershipConcentration: "Medium",
    risk: "Medium",
    chain: "eth",
    priceHistory: [
      { date: "May 1", price: 4.2 },
      { date: "May 8", price: 4.5 },
      { date: "May 15", price: 4.8 },
      { date: "May 22", price: 4.9 },
      { date: "May 29", price: 5.0 },
      { date: "Jun 5", price: 5.1 }
    ],
    image: "/placeholder-nft-3.png"
  },
  {
    id: "cryptopunks",
    name: "CryptoPunks",
    floorPrice: 50.2,
    volume24h: 580,
    volume7d: 3850,
    priceChange24h: -2.3,
    priceChange7d: -1.1,
    marketCap: 502000000,
    items: 10000,
    owners: 3500,
    ownershipConcentration: "High",
    risk: "Medium",
    chain: "eth",
    priceHistory: [
      { date: "May 1", price: 51.2 },
      { date: "May 8", price: 50.8 },
      { date: "May 15", price: 50.5 },
      { date: "May 22", price: 50.1 },
      { date: "May 29", price: 49.8 },
      { date: "Jun 5", price: 50.2 }
    ],
    image: "/placeholder-nft-4.png"
  },
  {
    id: "degods",
    name: "DeGods",
    floorPrice: 3.1,
    volume24h: 85,
    volume7d: 620,
    priceChange24h: 5.1,
    priceChange7d: 8.2,
    marketCap: 18600000,
    items: 6000,
    owners: 2800,
    ownershipConcentration: "Medium",
    risk: "Medium-High",
    chain: "sol",
    priceHistory: [
      { date: "May 1", price: 2.8 },
      { date: "May 8", price: 2.9 },
      { date: "May 15", price: 3.0 },
      { date: "May 22", price: 3.2 },
      { date: "May 29", price: 3.0 },
      { date: "Jun 5", price: 3.1 }
    ],
    image: "/placeholder-nft-5.png"
  }
];

// Mock NFT market analysis data
const marketSentimentData = [
  { date: "May 1", volume: 15200, sentiment: 65 },
  { date: "May 8", volume: 18500, sentiment: 68 },
  { date: "May 15", volume: 16800, sentiment: 62 },
  { date: "May 22", volume: 14100, sentiment: 59 },
  { date: "May 29", volume: 19200, sentiment: 72 },
  { date: "Jun 5", volume: 21500, sentiment: 78 }
];

// Filter options
const priceRangeFilters = [
  { id: "all", label: "All Prices" },
  { id: "under5", label: "Under 5 ETH" },
  { id: "5to10", label: "5-10 ETH" },
  { id: "over10", label: "Over 10 ETH" }
];

const chainFilters = [
  { id: "all", label: "All Chains" },
  { id: "eth", label: "Ethereum" },
  { id: "sol", label: "Solana" }
];

export default function NFTAdvisor() {
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedChain, setSelectedChain] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState(trendingCollections[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof trendingCollections>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Filter collections based on search query
    const results = trendingCollections.filter(collection => 
      collection.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
    setShowSearchResults(true);
  };
  
  // Handle collection selection from search results
  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setSearchQuery("");
    setShowSearchResults(false);
  };
  
  // Filter the collections based on selected filters
  const filteredCollections = trendingCollections.filter(collection => {
    let priceMatch = true;
    if (selectedPriceRange === "under5") {
      priceMatch = collection.floorPrice < 5;
    } else if (selectedPriceRange === "5to10") {
      priceMatch = collection.floorPrice >= 5 && collection.floorPrice <= 10;
    } else if (selectedPriceRange === "over10") {
      priceMatch = collection.floorPrice > 10;
    }
    
    const chainMatch = selectedChain === "all" || collection.chain === selectedChain;
    
    return priceMatch && chainMatch;
  });
  
  // Get the currently selected collection
  const collection = trendingCollections.find(c => c.id === selectedCollection) || trendingCollections[0];
  
  // Format currency values to ETH
  const formatETH = (value: number) => {
    return `${value.toFixed(2)} ETH`;
  };
  
  // Format currency values to USD
  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };
  
  // Generate investment recommendations
  const getInvestmentRecommendations = () => {
    // In a real app, this would use AI to analyze the market and provide personalized recommendations
    
    const positiveCollections = trendingCollections.filter(c => 
      c.priceChange7d > 0 && c.volume7d > 500 && !c.risk.includes("High")
    ).sort((a, b) => b.priceChange7d - a.priceChange7d).slice(0, 3);
    
    return positiveCollections;
  };
  
  // Generate market insights
  const getMarketInsights = () => {
    const latestSentiment = marketSentimentData[marketSentimentData.length - 1].sentiment;
    const previousSentiment = marketSentimentData[marketSentimentData.length - 2].sentiment;
    const sentimentChange = latestSentiment - previousSentiment;
    
    const insights = [
      {
        title: "Market Sentiment",
        value: `${latestSentiment}%`,
        change: sentimentChange,
        description: sentimentChange > 0 
          ? "Market sentiment is improving, suggesting growing confidence in NFT investments."
          : "Market sentiment is declining, suggesting caution in NFT investments."
      },
      {
        title: "Trading Volume",
        value: formatUSD(marketSentimentData[marketSentimentData.length - 1].volume),
        change: 12.4,
        description: "Trading volume has increased, indicating higher market liquidity and interest."
      },
      {
        title: "Price Stability",
        value: "Medium",
        change: 0,
        description: "Blue-chip NFTs show relative price stability compared to newer collections."
      }
    ];
    
    return insights;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-white text-lg">Analyzing NFT market data...</div>
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
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">NFT Advisor</h2>
          <p className="text-gray-400">AI-powered NFT market analysis and recommendations</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Search NFT collections..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none w-full"
            />
            <button className="p-2 text-gray-400 hover:text-white">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchResults.map(result => (
                <div
                  key={result.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectCollection(result.id)}
                >
                  <div className="w-8 h-8 rounded-md bg-gray-700 mr-2"></div>
                  <div>
                    <div className="text-white text-sm">{result.name}</div>
                    <div className="text-gray-400 text-xs">{formatETH(result.floorPrice)} • {result.chain.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showSearchResults && searchResults.length === 0 && searchQuery.trim() !== "" && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-3">
              <p className="text-gray-400 text-sm">No collections found</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <select
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
          >
            {priceRangeFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
          >
            {chainFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Trending Collections & Market Overview */}
        <div>
          {/* Trending Collections */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Trending Collections</h3>
            <div className="space-y-3">
              {filteredCollections.map((nft, index) => (
                <motion.div 
                  key={nft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setSelectedCollection(nft.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCollection === nft.id
                      ? "bg-violet-900/30 border border-violet-500/50"
                      : "bg-gray-800/30 hover:bg-gray-800/60 border border-transparent"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-violet-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{nft.name.charAt(0)}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-medium truncate">{nft.name}</h4>
                      <div className={`text-sm font-medium ${
                        nft.priceChange24h > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {nft.priceChange24h > 0 ? "+" : ""}{nft.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-400">Floor: {formatETH(nft.floorPrice)}</div>
                      <div className="text-gray-400">Vol: {formatETH(nft.volume24h)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Market Overview */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">NFT Market Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={marketSentimentData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="volume" 
                    name="Volume (ETH)" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#volumeGradient)" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="sentiment" 
                    name="Market Sentiment (%)" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Market Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {getMarketInsights().map((insight, index) => (
                <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-gray-400 text-sm">{insight.title}</div>
                  <div className="flex items-end gap-2">
                    <div className="text-white text-xl font-semibold">{insight.value}</div>
                    {insight.change !== 0 && (
                      <div className={`text-sm font-medium ${
                        insight.change > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {insight.change > 0 ? "+" : ""}{insight.change.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{insight.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Collection Details & Investment Recommendations */}
        <div>
          {/* Collection Details */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{collection.name.charAt(0)}</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white">{collection.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                  <div>Items: {collection.items.toLocaleString()}</div>
                  <div>Owners: {collection.owners.toLocaleString()}</div>
                  <div>Floor: {formatETH(collection.floorPrice)}</div>
                  <div>Volume (7d): {formatETH(collection.volume7d)}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-sm font-medium ${
                  collection.priceChange7d > 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {collection.priceChange7d > 0 ? "+" : ""}{collection.priceChange7d.toFixed(1)}% (7d)
                </div>
                <div className="mt-1">
                  <span className={`rounded px-2 py-1 text-xs ${
                    collection.risk.toLowerCase().includes('low') 
                      ? 'bg-green-900/50 text-green-300' 
                      : collection.risk.toLowerCase().includes('high')
                      ? 'bg-red-900/50 text-red-300'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {collection.risk} Risk
                  </span>
                </div>
              </div>
            </div>
            
            {/* Price History Chart */}
            <div className="bg-gray-800/40 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-400 mb-2">Price History (Floor Price)</div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={collection.priceHistory}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#4B5563",
                        color: "#F9FAFB"
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} ETH`, 'Floor Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Collection Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/40 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Market Cap</div>
                <div className="text-white font-medium">{formatUSD(collection.marketCap)}</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Ownership</div>
                <div className="text-white font-medium">{collection.ownershipConcentration}</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Owners Ratio</div>
                <div className="text-white font-medium">{((collection.owners / collection.items) * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Chain</div>
                <div className="text-white font-medium capitalize">{collection.chain === "eth" ? "Ethereum" : "Solana"}</div>
              </div>
            </div>
          </div>
          
          {/* AI Investment Recommendations */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">AI Investment Recommendations</h3>
            
            <div className="space-y-4">
              {getInvestmentRecommendations().map((nft, index) => (
                <motion.div 
                  key={nft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-gray-800/40 p-4 rounded-lg border border-violet-500/30"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-violet-600 flex items-center justify-center">
                      <span className="text-white font-bold">{nft.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{nft.name}</h4>
                      <div className="text-sm text-gray-400">Floor: {formatETH(nft.floorPrice)}</div>
                    </div>
                    <div className="ml-auto">
                      <div className="text-green-400 font-medium">+{nft.priceChange7d.toFixed(1)}% (7d)</div>
                      <div className="text-sm text-gray-400 text-right">Vol: {formatETH(nft.volume7d)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 p-3 rounded-lg mb-3">
                    <div className="text-sm text-gray-300">
                      {nft.name} shows strong market momentum with increasing floor price and healthy trading volume. 
                      The collection has {nft.risk.toLowerCase().includes('low') ? 'low' : 'moderate'} risk profile and 
                      {nft.ownershipConcentration.toLowerCase() === 'low' 
                        ? ' well-distributed ownership.' 
                        : ' reasonable ownership distribution.'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-400">Risk Assessment: </span>
                      <span className={
                        nft.risk.toLowerCase().includes('low') 
                          ? 'text-green-400' 
                          : nft.risk.toLowerCase().includes('high')
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }>
                        {nft.risk}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Confidence: </span>
                      <span className="text-green-400">High</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4 mt-6">
              <h4 className="text-white font-medium mb-2">NFT Market Advisory</h4>
              <div className="text-sm text-gray-300">
                Based on current market conditions, consider focusing on established collections with
                strong communities and utility. The market shows positive sentiment with increasing trading volumes.
                Blue-chip NFTs continue to demonstrate relative stability compared to newer projects.
                For higher risk/reward opportunities, look for emerging collections with growing social engagement
                and unique utility propositions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 