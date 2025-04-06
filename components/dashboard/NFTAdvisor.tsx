"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend
} from "recharts";
import Image from "next/image";
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { 
  getTrendingCollections, 
  getNFTMarketData, 
  NFTCollection, 
  MarketData
} from "@/lib/moralis/nftApi";

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

// Remove NFT search type option
const searchTypeFilters = [
  { id: "collections", label: "Collections" }
];

// Fix the NFT interface to match the Moralis API interface
interface LocalNFT {
  tokenId: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  tokenUri?: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  amount?: string;
  contractType?: string;
  ownerOf?: string;
  tokenHash?: string;
  lastMetadataSync?: string;
  lastTokenUriSync?: string;
  normalizedMetadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  chain?: string;
  floorPrice?: number;
  collection?: {
    name: string;
  };
}

export default function NFTAdvisor() {
  const [selectedTab, setSelectedTab] = useState("market");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<LocalNFT | null>(null);
  const [nftDetails, setNFTDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedChain, setSelectedChain] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingNFT, setLoadingNFT] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [nftPriceHistory, setNFTPriceHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [trendingCollections, setTrendingCollections] = useState<NFTCollection[]>([]);
  
  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Generate market insights
        const insights = getMarketInsights();
        setMarketData(insights);
        
        // Also fetch real chart data
        const realChartData = await generateChartData(insights);
        setChartData(realChartData);
      } catch (error) {
        console.error("Error fetching NFT data:", error);
        setError("Failed to load NFT data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch trending collections and market data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trending collections
        const collections = await getTrendingCollections({
          chain: selectedChain === "all" ? "eth" : selectedChain,
          limit: 20
        });
        
        if (collections && collections.length > 0) {
          setTrendingCollections(collections);
          setSelectedCollection(collections[0].id);
        } else {
          setError("No trending collections found.");
        }
        
        // Fetch market sentiment data
        const marketDataResult = await getNFTMarketData({
          chain: selectedChain === "all" ? "eth" : selectedChain
        });
        
        if (marketDataResult) {
          setMarketData(marketDataResult);
        }
      } catch (err) {
        console.error("Error fetching NFT data:", err);
        setError("Failed to fetch NFT market data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedChain]);
  
  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Show search results container
    setShowSearchResults(true);
    
    // Filter collections based on search query
    const results = trendingCollections.filter(collection => 
      collection.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };
  
  // Handle collection selection from search results
  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setSearchQuery("");
    setShowSearchResults(false);
    setSelectedNFT(null);
  };
  
  // Filter the collections based on selected filters
  const filteredCollections = trendingCollections.filter(collection => {
    let priceMatch = true;
    if (selectedPriceRange === "under5") {
      priceMatch = (collection.floorPrice || 0) < 5;
    } else if (selectedPriceRange === "5to10") {
      priceMatch = (collection.floorPrice || 0) >= 5 && (collection.floorPrice || 0) <= 10;
    } else if (selectedPriceRange === "over10") {
      priceMatch = (collection.floorPrice || 0) > 10;
    }
    
    const chainMatch = selectedChain === "all" || collection.chain === selectedChain;
    
    return priceMatch && chainMatch;
  });
  
  // Get the currently selected collection
  const collection = trendingCollections.find(c => c.id === selectedCollection) || (trendingCollections.length > 0 ? trendingCollections[0] : null);
  
  // Format currency values to ETH
  const formatETH = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(2)} ETH`;
  };
  
  // Format currency values to USD
  const formatUSD = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N/A";
    
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
    // Using real data to analyze and provide recommendations
    const positiveCollections = trendingCollections
      .filter(c => 
        (c.priceChange7d || 0) > 0 && 
        (c.volume7d || 0) > 0 && 
        (c.risk !== "High" && c.risk !== "Medium-High")
      )
      .sort((a, b) => (b.priceChange7d || 0) - (a.priceChange7d || 0))
      .slice(0, 3);
    
    return positiveCollections;
  };
  
  // Generate market insights from the fetched market data
  const getMarketInsights = () => {
    // Create a default MarketData object if no data is available
    if (!marketData) {
      const defaultData: MarketData = {
        marketSentiment: "Neutral",
        averageFloorPriceChange: 0,
        totalTradingVolume: 0,
        positivePerformingPercent: 0,
        marketRisk: "Medium",
        insights: [
          {
            title: "Market Data",
            value: "N/A",
            change: "0",
            trend: "neutral"
          }
        ]
      };
      return defaultData;
    }
    
    // Return the existing market data
    return marketData;
  };
  
  // Helper to generate descriptions for insights
  const getInsightDescription = (title: string, trend: string) => {
    switch (title) {
      case "Market Sentiment":
        return trend === "up" 
          ? "Market sentiment is improving, suggesting growing confidence in NFT investments."
          : "Market sentiment is declining, suggesting caution in NFT investments.";
      case "Trading Volume":
        return trend === "up"
          ? "Trading volume has increased, indicating higher market liquidity and interest."
          : "Trading volume has decreased, showing reduced market activity.";
      case "Positive Performing":
        return trend === "up"
          ? "More collections are showing positive price movement, indicating a bullish market."
          : "Fewer collections are showing positive price movement, suggesting a bearish trend.";
      case "Market Risk":
        return trend === "up"
          ? "Market risk is lower than average, potentially indicating a good time to invest."
          : "Market risk is higher than average, suggesting caution when investing.";
      default:
        return "No additional information available.";
    }
  };
  
  // Generate chart data using real-time market data from CoinGecko
  const generateChartData = async (marketData: MarketData) => {
    try {
      // Use NFT index coins like NFTX as a proxy for NFT market data
      // Use our proxy endpoint to avoid CORS issues
      const response = await fetch(
        '/api/coingecko?endpoint=coins/nftx/market_chart&vs_currency=usd&days=7'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFT market data');
      }
      
      const data = await response.json();
      
      // Process price and volume data
      const priceData = data.prices || [];
      const volumeData = data.total_volumes || [];
      
      // Create chart data from real market movements
      return priceData.map((pricePoint: [number, number], index: number) => {
        const timestamp = pricePoint[0];
        const price = pricePoint[1];
        
        // Calculate daily price change percentage as a proxy for sentiment
        const prevPrice = index > 0 ? priceData[index - 1][1] : price;
        const priceChange = ((price - prevPrice) / prevPrice) * 100;
        
        // Get corresponding volume if available
        const volume = index < volumeData.length ? volumeData[index][1] / 10000 : 1000;
        
        // Format date
        const date = new Date(timestamp);
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          // Normalize sentiment to a 0-100 scale centered around 50
          sentiment: 50 + (priceChange * 2), 
          volume: volume
        };
      });
    } catch (error) {
      console.error('Error fetching NFT market data:', error);
      
      // Fall back to generated data based on provided market data
      const today = new Date();
      const chartData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Base data on provided market data but add some variance
        const baseChange = marketData.averageFloorPriceChange || 0;
        const randomVariance = (Math.random() - 0.5) * 10;
        
        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sentiment: 50 + baseChange + randomVariance,
          volume: ((marketData.totalTradingVolume || 1000) / 7) * (0.8 + Math.random() * 0.4)
        });
      }
      
      return chartData;
    }
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
        <div className="relative w-full md:w-72">
          <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Search NFT collections..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none w-full"
              />
            </div>
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
                  <div className="w-8 h-8 rounded-md bg-gray-700 mr-2 flex items-center justify-center">
                    <span className="text-white font-semibold">{result.name.charAt(0)}</span>
                  </div>
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
              <p className="text-gray-400 text-sm">
                No collections found
              </p>
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
      
      {/* NFT View - Show this when an individual NFT is selected */}
      {selectedNFT && (
        <div className="mb-6">
          <div className="bg-gray-900/60 rounded-xl p-4">
            {loadingNFT ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
              </div>
            ) : nftDetails ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* NFT Image */}
                <div className="flex flex-col">
                  <div className="bg-gray-800 rounded-xl overflow-hidden w-full aspect-square relative">
                    {nftDetails.normalized_metadata?.image && (
                      <Image
                        src={nftDetails.normalized_metadata.image}
                        alt={nftDetails.normalized_metadata.name || 'NFT Image'}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Traits/Attributes */}
                  {nftDetails.normalized_metadata?.attributes && nftDetails.normalized_metadata.attributes.length > 0 && (
                    <div className="mt-4 bg-gray-800/50 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-3">Traits</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {nftDetails.normalized_metadata.attributes.map((attr: any, idx: number) => (
                          <div key={idx} className="bg-gray-800 rounded-lg p-2">
                            <div className="text-gray-400 text-xs">{attr.trait_type}</div>
                            <div className="text-white text-sm font-medium truncate">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* NFT Details */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {nftDetails.normalized_metadata?.name || nftDetails.name || `NFT #${nftDetails.token_id}`}
                  </h3>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <span>Collection: {nftDetails.name || 'Unknown'}</span>
                    <span className="mx-2">•</span>
                    <span>Token ID: {nftDetails.token_id}</span>
                  </div>
                  
                  {nftDetails.normalized_metadata?.description && (
                    <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                      <p className="text-gray-300 text-sm">
                        {nftDetails.normalized_metadata.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Price History Chart (if available) */}
                  {nftPriceHistory.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                      <h4 className="text-white font-medium mb-3">Price History</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={nftPriceHistory}
                            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563" }}
                              formatter={(value) => [`${value} ETH`, "Price"]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#8B5CF6" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  
                  {/* AI-Generated Insights */}
                  <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-2">NFT Advisor Insights</h4>
                    <p className="text-gray-300 text-sm">
                      Based on our analysis, this NFT from the {nftDetails.name || 'Unknown'} collection
                      shows {nftPriceHistory.length > 0 ? 'trading activity with ' + nftPriceHistory.length + ' recent transactions' : 'limited recent trading activity'}.
                      {nftDetails.normalized_metadata?.attributes && nftDetails.normalized_metadata.attributes.length > 0 
                        ? ` The NFT has ${nftDetails.normalized_metadata.attributes.length} unique traits which may affect its rarity and value.`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-gray-400">
                Failed to load NFT details. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Collection and Market Data (show only if no individual NFT is selected) */}
      {!selectedNFT && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Trending Collections & Market Overview */}
          <div>
            {/* Trending Collections */}
            <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trending Collections</h3>
              <div className="space-y-3">
                {filteredCollections.map((nft, index) => (
                  <motion.div 
                    key={`collection-${nft.id || nft.address}`}
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
                          (nft.priceChange24h || 0) > 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(nft.priceChange24h || 0) > 0 ? "+" : ""}{(nft.priceChange24h || 0).toFixed(1)}%
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
                    data={chartData}
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
                {getMarketInsights().insights.map((insight, index) => (
                  <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">{insight.title}</div>
                    <div className="flex items-end gap-2">
                      <div className="text-white text-xl font-semibold">{insight.value}</div>
                      {insight.change !== "0" && (
                        <div className={`text-sm font-medium ${
                          insight.change === "up" ? "text-green-400" : "text-red-400"
                        }`}>
                          {insight.change === "up" ? "+" : ""}{insight.change}%
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">{getInsightDescription(insight.title, insight.trend)}</div>
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
                  <span className="text-white font-bold text-2xl">{collection?.name.charAt(0)}</span>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-white">{collection?.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                    <div>Items: {collection?.items?.toLocaleString() || 'N/A'}</div>
                    <div>Owners: {collection?.owners?.toLocaleString() || 'N/A'}</div>
                    <div>Floor: {formatETH(collection?.floorPrice)}</div>
                    <div>Volume (7d): {formatETH(collection?.volume7d)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-sm font-medium ${
                    (collection?.priceChange7d || 0) > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {(collection?.priceChange7d || 0) > 0 ? "+" : ""}{(collection?.priceChange7d || 0).toFixed(1)}% (7d)
                  </div>
                  <div className="mt-1">
                    <span className={`rounded px-2 py-1 text-xs ${
                      (collection?.risk || '').toLowerCase().includes('low') 
                        ? 'bg-green-900/50 text-green-300' 
                        : (collection?.risk || '').toLowerCase().includes('high')
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {collection?.risk || 'Medium'} Risk
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
                      data={collection?.priceHistory || []}
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
                  <div className="text-white font-medium">{formatUSD(collection?.marketCap)}</div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="text-gray-400 text-xs">Ownership</div>
                  <div className="text-white font-medium">{collection?.ownershipConcentration}</div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="text-gray-400 text-xs">Owners Ratio</div>
                  <div className="text-white font-medium">
                    {collection?.owners && collection?.items 
                      ? ((collection.owners / collection.items) * 100).toFixed(1) + '%'
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="text-gray-400 text-xs">Chain</div>
                  <div className="text-white font-medium capitalize">{collection?.chain === "eth" ? "Ethereum" : "Solana"}</div>
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
                        <div className="text-green-400 font-medium">+{(nft.priceChange7d || 0).toFixed(1)}% (7d)</div>
                        <div className="text-sm text-gray-400 text-right">Vol: {formatETH(nft.volume7d)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/50 p-3 rounded-lg mb-3">
                      <div className="text-sm text-gray-300">
                        {nft.name} shows strong market momentum with increasing floor price and healthy trading volume. 
                        The collection has {(nft.risk || '').toLowerCase().includes('low') ? 'low' : 'moderate'} risk profile and
                        {(nft.ownershipConcentration || '').toLowerCase() === 'low' 
                          ? ' well-distributed ownership.' 
                          : ' reasonable ownership distribution.'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-400">Risk Assessment: </span>
                        <span className={
                          (nft.risk || '').toLowerCase().includes('low') 
                            ? 'text-green-400' 
                            : (nft.risk || '').toLowerCase().includes('high')
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }>
                          {nft.risk || 'Medium'}
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
      )}
    </div>
  );
} 