"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from "recharts";
import Image from "next/image";
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { useNFTStore } from '@/store';

// Proper type definitions for component props
interface NFTMarketOverviewProps {
  marketData: any;
  isLoading: boolean;
  chain: string;
  onRefresh: () => void;
}

interface TrendingCollectionsProps {
  collections: any[];
  isLoading: boolean;
  onSelectCollection: (address: string) => void;
  selectedCollection: string | null;
  chain: string;
  onRefresh: () => void;
}

interface NFTExplorerProps {
  searchResults: any | null;
  isLoading: boolean;
  onSelectNFT: (address: string, tokenId: string) => void;
  selectedNFT: any | null;
  chain: string;
}

interface NFTDetailsProps {
  nft: any;
  chain: string;
}

// Filter options
const priceRangeFilters = [
  { id: "all", label: "All Prices" },
  { id: "under5", label: "Under 5 ETH" },
  { id: "5to10", label: "5-10 ETH" },
  { id: "over10", label: "Over 10 ETH" }
];

const chainFilters = [
  { id: "eth", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "bsc", label: "BSC" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "optimism", label: "Optimism" },
  { id: "avalanche", label: "Avalanche" },
];

// Main NFT Advisor Tabs
const nftAdvisorTabs = [
  { id: "market", label: "Market Overview" },
  { id: "trending", label: "Trending Collections" },
  { id: "explorer", label: "NFT Explorer" },
  { id: "wallet", label: "Wallet NFTs" },
  { id: "trades", label: "NFT Trades" },
];

// Colors for charts
const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

// Helper function to render loading spinner - moved to top level to be accessible by all components
const renderLoading = () => (
  <div className="flex justify-center items-center h-64 w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
  </div>
);

export default function NFTAdvisor() {
  // State from Zustand store
  const { 
    nfts,
    trendingCollections,
    marketData,
    searchResults,
    selectedNFT,
    selectedCollection,
    
    isLoadingNFTs,
    isLoadingCollections,
    isLoadingTrending,
    isLoadingTrades,
    isLoadingMarketData,
    error,
    
    priceRange,
    chain,
    
    searchNFTs: fetchSearchNFTs,
    getNFTDetails,
    getNFTPriceHistory,
    getTrendingCollections,
    getNFTMarketData,
    selectNFT,
    selectCollection,
    setFilterParams,
    clearError
  } = useNFTStore();

  // Local UI states
  const [selectedTab, setSelectedTab] = useState("market");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Fetch initial data on component mount, only once
  useEffect(() => {
    // Only fetch if not already loaded
    if (!trendingCollections || trendingCollections.length === 0) {
      getTrendingCollections(chain);
    }
    
    if (!marketData) {
      getNFTMarketData(chain);
    }
  }, []);
  
  // Fetch data when chain changes, but only once per chain change
  useEffect(() => {
    // Clear any previous errors
    if (error) {
      clearError();
    }
    
    // Fetch data with the new chain
    getTrendingCollections(chain);
    getNFTMarketData(chain);
  }, [chain]);
  
  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setShowSearchResults(false);
      return;
    }
    
    setShowSearchResults(true);
  };
  
  // Execute search when user submits
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchSearchNFTs(searchQuery, chain);
      setSelectedTab("explorer"); // Switch to explorer tab to show results
    }
  };
  
  // Filter the trending collections based on selected filters
  const filteredCollections = trendingCollections ? trendingCollections.filter(collection => {
    let priceMatch = true;
    if (priceRange === "under5") {
      priceMatch = (collection.floorPrice || 0) < 5;
    } else if (priceRange === "5to10") {
      priceMatch = (collection.floorPrice || 0) >= 5 && (collection.floorPrice || 0) <= 10;
    } else if (priceRange === "over10") {
      priceMatch = (collection.floorPrice || 0) > 10;
    }
    
    return priceMatch;
  }) : [];
  
  // Get the currently selected collection
  const collection = selectedCollection && trendingCollections ? 
    trendingCollections.find(c => c.address === selectedCollection) || null : 
    (trendingCollections && trendingCollections.length > 0 ? trendingCollections[0] : null);
  
  // Get the currently selected NFT
  const nft = selectedNFT ? nfts[selectedNFT] || null : null;
  
  // Format currency values to ETH
  const formatETH = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(4)} ETH`;
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
  
  // Format percentage values
  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N/A";
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Render the error message
  const renderError = () => (
    <div className="bg-red-900/30 text-red-300 p-4 rounded-lg mb-4">
      <p>{error}</p>
      <button 
        onClick={clearError}
        className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md mt-2 text-sm font-medium"
      >
        Dismiss
      </button>
    </div>
  );

  // Render different tabs based on selection
  const renderTabContent = () => {
    switch (selectedTab) {
      case "market":
        return <NFTMarketOverview 
          marketData={marketData} 
          isLoading={isLoadingMarketData} 
          chain={chain}
          onRefresh={() => getNFTMarketData(chain)}
        />;
      case "trending":
        return <TrendingCollections 
          collections={filteredCollections || []} 
          isLoading={isLoadingTrending}
          onSelectCollection={(address) => selectCollection(address)}
          selectedCollection={selectedCollection}
          chain={chain}
          onRefresh={() => getTrendingCollections(chain)}
        />;
      case "explorer":
        return <NFTExplorer 
          searchResults={searchResults || null}
          isLoading={isLoadingNFTs}
          onSelectNFT={(address, tokenId) => {
            getNFTDetails(address, tokenId, chain);
            getNFTPriceHistory(address, tokenId, chain);
          }}
          selectedNFT={nft}
          chain={chain}
        />;
      case "wallet":
        return <WalletNFTs />;
      case "trades":
        return <NFTTrades />;
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  // Helper function to calculate ownership concentration percentage
  const getOwnershipConcentration = (collection: any): number => {
    // Default value if no data is available
    if (!collection || !collection.tokenCount || !collection.uniqueOwners) {
      return 30; // Default value as fallback
    }
    
    // Basic calculation for ownership concentration
    // This is a simplified metric - in a real app, you'd use more sophisticated calculations
    const averagePerOwner = collection.tokenCount / collection.uniqueOwners;
    const concentration = Math.min(80, Math.max(10, averagePerOwner * 10));
    return Math.round(concentration);
  };

  // State for ownership concentration data
  const [ownershipData, setOwnershipData] = useState<any[]>([]);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
      {/* Error display */}
      {error && renderError()}
      
      {/* Header with title and search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">NFT Advisor</h2>
          <p className="text-gray-400 text-sm">Analyze NFT market trends and discover opportunities</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
          <form onSubmit={handleSearch} className="relative flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search NFTs or collections..."
              className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
          
          <div className="relative">
            <button
              className="bg-gray-800 text-white rounded-lg px-4 py-2 flex items-center gap-2"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="hidden md:inline">Filters</span>
            </button>
            
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-10">
                <h3 className="font-bold mb-2 text-violet-400">Price Range</h3>
                <div className="space-y-2 mb-4">
                  {priceRangeFilters.map((filter) => (
                    <label key={filter.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        value={filter.id}
                        checked={priceRange === filter.id}
                        onChange={() => setFilterParams({priceRange: filter.id})}
                        className="form-radio text-violet-500"
                      />
                      <span>{filter.label}</span>
                    </label>
                  ))}
                </div>
                
                <h3 className="font-bold mb-2 text-violet-400">Chain</h3>
                <div className="space-y-2">
                  {chainFilters.map((filter) => (
                    <label key={filter.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="chain"
                        value={filter.id}
                        checked={chain === filter.id}
                        onChange={() => setFilterParams({chain: filter.id})}
                        className="form-radio text-violet-500"
                      />
                      <span>{filter.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex overflow-x-auto hide-scrollbar">
          {nftAdvisorTabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === tab.id
                  ? "text-violet-400 border-b-2 border-violet-400"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
}

// Placeholder components for the different tabs
// These will be implemented in the next steps
const NFTMarketOverview = ({ marketData, isLoading, chain, onRefresh }: NFTMarketOverviewProps) => {
  if (isLoading) return renderLoading();
  
  // Render content only when data is available
  if (!marketData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>Unable to load market data. Please check your network connection.</p>
        <button 
          onClick={onRefresh}
          className="mt-4 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Try Again
        </button>
      </div>
    );
  }
  
  // Use real chart data from marketData instead of generating mock data
  const chartData = marketData.priceHistory || [];
  
  // Format percentage for rendering
  const formatPercentWithColor = (value: number | undefined | null) => {
    if (value === undefined || value === null) return { text: "N/A", color: "text-gray-400" };
    const text = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    const color = value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-gray-300";
    return { text, color };
  };
  
  // Prepare pie chart data
  const marketSentimentData = [
    { name: 'Positive', value: marketData.positivePerformingPercent },
    { name: 'Neutral/Negative', value: 100 - marketData.positivePerformingPercent },
  ];
  
  // Risk level color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-500';
      case 'Medium-Low': return 'text-emerald-500';
      case 'Medium': return 'text-yellow-500';
      case 'Medium-High': return 'text-orange-500';
      case 'High': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };
  
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">NFT Market Overview</h3>
        <button 
          onClick={onRefresh}
          className="flex items-center text-violet-400 hover:text-violet-300"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>
      
      {/* Market Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Market Sentiment</div>
          <div className="text-2xl font-bold text-white">{marketData.marketSentiment}</div>
          <div className={formatPercentWithColor(marketData.averageFloorPriceChange).color}>
            Floor {formatPercentWithColor(marketData.averageFloorPriceChange).text}
      </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Trading Volume</div>
          <div className="text-2xl font-bold text-white">
            Ξ {Math.round(marketData.totalTradingVolume).toLocaleString()}
          </div>
          <div className="text-gray-400">Last 7 days</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Positive Performing</div>
          <div className="text-2xl font-bold text-white">
            {marketData.positivePerformingPercent}%
          </div>
          <div className="text-gray-400">of collections</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Market Risk</div>
          <div className={`text-2xl font-bold ${getRiskColor(marketData.marketRisk)}`}>
            {marketData.marketRisk}
          </div>
          <div className="text-gray-400">Current level</div>
        </div>
      </div>
      
      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Price Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Floor Price & Volume Trend (30 days)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFloor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{fill: '#9ca3af'}}
                  tickFormatter={(tick) => tick.slice(5)} // Display only month/day
                />
                <YAxis 
                  yAxisId="left"
                  tick={{fill: '#9ca3af'}}
                  tickFormatter={(tick) => `${tick} Ξ`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{fill: '#9ca3af'}}
                  tickFormatter={(tick) => `${tick} Ξ`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${value} Ξ`, undefined]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <Area 
                  type="monotone" 
                  dataKey="floorPrice" 
                  stroke="#8b5cf6" 
                  fillOpacity={1}
                  fill="url(#colorFloor)"
                  strokeWidth={2}
                  yAxisId="left"
                  name="Floor Price"
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#6366f1" 
                  fill="none"
                  strokeWidth={2}
                  yAxisId="right"
                  name="Volume"
                />
                <Legend 
                  formatter={(value) => <span style={{color: '#9ca3af'}}>{value}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
          
        {/* Market Sentiment Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Market Sentiment</h4>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={marketSentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#4b5563" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${value}%`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <p className="text-gray-300">
                {marketData.positivePerformingPercent}% of collections are showing positive price movement
              </p>
                  </div>
          </div>
        </div>
      </div>
      
      {/* Market Insights */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4">Market Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketData.insights.map((insight: any, index: number) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">{insight.title}</div>
              <div className="text-xl font-bold text-white">{insight.value}</div>
              <div className={formatPercentWithColor(parseFloat(insight.change)).color}>
                {formatPercentWithColor(parseFloat(insight.change)).text} 
                <span className="text-gray-400 ml-1">{insight.trend}</span>
                  </div>
                </div>
              ))}
            </div>
      </div>
      
      {/* Market Tips */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4">NFT Market Tips</h4>
        <div className="space-y-3">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-violet-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-gray-300">
              {marketData.marketSentiment === 'Bullish' ? 
                'In this bullish market, consider looking for promising collections with strong communities.' :
                marketData.marketSentiment === 'Bearish' ?
                'In bearish conditions, focus on blue-chip collections with established value and history.' :
                'In this neutral market, diversify your NFT portfolio across different sectors and risk levels.'}
              </p>
            </div>
          
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-violet-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-gray-300">
              Floor prices {marketData.averageFloorPriceChange > 0 ? 'are rising' : 'are declining'} by {Math.abs(marketData.averageFloorPriceChange).toFixed(2)}% on average. 
              {marketData.averageFloorPriceChange > 0 ? 
                ' Consider taking profits on high-performing assets or look for undervalued opportunities.' :
                ' This may be a good time to acquire quality NFTs at lower prices.'}
            </p>
        </div>

          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-violet-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-gray-300">
              Current market risk is {marketData.marketRisk.toLowerCase()}. 
              {marketData.marketRisk === 'Low' || marketData.marketRisk === 'Medium-Low' ? 
                ' Good time for new positions in quality NFT projects.' :
                marketData.marketRisk === 'High' || marketData.marketRisk === 'Medium-High' ?
                ' Consider reducing exposure and focusing on high-liquidity assets.' :
                ' Balance your portfolio with both established and promising new collections.'}
            </p>
        </div>
      </div>
      </div>
    </div>
  );
};

const TrendingCollections = ({ 
  collections, 
  isLoading, 
  onSelectCollection, 
  selectedCollection, 
  chain, 
  onRefresh 
}: TrendingCollectionsProps) => {
  // If loading, show loading indicator
  if (isLoading) return renderLoading();
  
  // If no collections are available, show empty state
  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>Unable to load trending collections. Please check your network connection.</p>
        <button 
          onClick={onRefresh}
          className="mt-4 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Try Again
        </button>
        </div>
    );
  }
  
  // Format percentage for rendering
  const formatPercentWithColor = (value: number | undefined | null) => {
    if (value === undefined || value === null) return { text: "N/A", color: "text-gray-400" };
    const text = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    const color = value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-gray-300";
    return { text, color };
  };
  
  // Get the currently selected collection
  const selectedCollectionData = collections.find((c: any) => c.address === selectedCollection) || collections[0];
  const priceHistoryData = selectedCollectionData?.priceHistory || [];
  
  // Calculate ownership concentration when selected collection changes
  useEffect(() => {
    if (selectedCollectionData) {
      // Calculate ownership concentration
      const concentration = 30; // Default value
      
      // If we have token count and unique owners data
      if (selectedCollectionData.tokenCount && selectedCollectionData.uniqueOwners) {
        const averagePerOwner = selectedCollectionData.tokenCount / selectedCollectionData.uniqueOwners;
        // Simple calculation - more sophisticated metrics would be used in a real app
        const calculatedConcentration = Math.min(80, Math.max(10, averagePerOwner * 10));
        
        // Save the calculated concentration to the collection data
        selectedCollectionData.ownershipConcentration = Math.round(calculatedConcentration);
      } else {
        // Use default values if data is missing
        selectedCollectionData.ownershipConcentration = concentration;
      }
    }
  }, [selectedCollectionData]);
  
  // Risk level color and badge
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return <span className="bg-green-900/30 text-green-500 text-xs px-2 py-1 rounded">Low Risk</span>;
      case 'Medium-Low':
        return <span className="bg-emerald-900/30 text-emerald-500 text-xs px-2 py-1 rounded">Medium-Low Risk</span>;
      case 'Medium':
        return <span className="bg-yellow-900/30 text-yellow-500 text-xs px-2 py-1 rounded">Medium Risk</span>;
      case 'Medium-High':
        return <span className="bg-orange-900/30 text-orange-500 text-xs px-2 py-1 rounded">Medium-High Risk</span>;
      case 'High':
        return <span className="bg-red-900/30 text-red-500 text-xs px-2 py-1 rounded">High Risk</span>;
      default:
        return <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">{risk}</span>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Trending Collections</h3>
        <button 
          onClick={onRefresh}
          className="flex items-center text-violet-400 hover:text-violet-300"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">Refresh</span>
        </button>
              </div>
      
      {/* Featured Collection Details */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Collection Info */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center md:items-start">
              {/* Collection Image */}
              <div className="relative w-32 h-32 rounded-xl overflow-hidden mb-4">
                {selectedCollectionData.image ? (
                      <Image
                    src={selectedCollectionData.image}
                    alt={selectedCollectionData.name}
                        fill
                    className="object-cover"
                      />
                ) : (
                  <div className="bg-gray-700 w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-500" />
                  </div>
                    )}
                  </div>
                  
              {/* Collection Name and Symbol */}
              <h4 className="text-xl font-bold text-white mb-1">{selectedCollectionData.name}</h4>
              <p className="text-gray-400 mb-3">{selectedCollectionData.symbol}</p>
              
              {/* Risk Badge */}
              <div className="mb-4">
                {getRiskBadge(selectedCollectionData.risk || 'Medium')}
                          </div>
              
              {/* Collection Stats */}
              <div className="space-y-2 w-full">
                <div className="flex justify-between">
                  <span className="text-gray-400">Floor Price:</span>
                  <span className="text-white font-medium">{selectedCollectionData.floorPrice?.toFixed(4) || 'N/A'} ETH</span>
                      </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Change:</span>
                  <span className={formatPercentWithColor(selectedCollectionData.priceChange24h).color}>
                    {formatPercentWithColor(selectedCollectionData.priceChange24h).text}
                  </span>
                    </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">7d Change:</span>
                  <span className={formatPercentWithColor(selectedCollectionData.priceChange7d).color}>
                    {formatPercentWithColor(selectedCollectionData.priceChange7d).text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume (24h):</span>
                  <span className="text-white">{selectedCollectionData.volume24h?.toFixed(2) || 'N/A'} ETH</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-white">{selectedCollectionData.marketCap ? 
                    (selectedCollectionData.marketCap > 1000 ? 
                      `${(selectedCollectionData.marketCap / 1000).toFixed(2)}K` : 
                      selectedCollectionData.marketCap.toFixed(2)) 
                    : 'N/A'} ETH</span>
                    </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Items:</span>
                  <span className="text-white">{selectedCollectionData.items?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Owners:</span>
                  <span className="text-white">{selectedCollectionData.owners?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Price History Chart */}
          <div className="md:col-span-2">
            <h5 className="text-white font-medium mb-4">Floor Price History</h5>
            <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistoryData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{fill: '#9ca3af'}}
                    tickFormatter={(tick) => tick.slice(5)} // Display only month/day
                  />
                  <YAxis 
                    tick={{fill: '#9ca3af'}}
                    tickFormatter={(tick) => `${tick} Ξ`}
                    domain={['dataMin', 'dataMax']}
                  />
                            <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${value} ETH`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
            
            {/* Collection Summary */}
            <div className="mt-6 bg-gray-900 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Collection Summary</h5>
              <p className="text-gray-300">
                {selectedCollectionData.name} is a {selectedCollectionData.items ? `collection of ${selectedCollectionData.items.toLocaleString()} items` : 'NFT collection'}.  
                It has {selectedCollectionData.owners ? `${selectedCollectionData.owners.toLocaleString()} owners` : 'multiple owners'} and 
                {selectedCollectionData.ownershipConcentration ? ` ${selectedCollectionData.ownershipConcentration} ownership concentration` : ''}.
                The collection is currently showing {selectedCollectionData.priceChange7d && selectedCollectionData.priceChange7d > 0 ? 'positive' : 'negative'} price movement
                over the past 7 days and is considered {selectedCollectionData.risk ? selectedCollectionData.risk.toLowerCase() : 'medium'} risk.
                    </p>
                  </div>
                </div>
              </div>
      </div>
      
      {/* Collection List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-white font-medium">Top Trending Collections</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Collection</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Floor Price</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">24h Change</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">7d Change</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Volume (7d)</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Market Cap</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {collections.map((collection: any, index: number) => (
                <tr 
                  key={collection.address} 
                  className={`hover:bg-gray-700 cursor-pointer transition ${
                    collection.address === selectedCollection ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => onSelectCollection(collection.address)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                        {collection.image ? (
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="bg-gray-700 w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
                      <div>
                        <div className="text-white font-medium">{collection.name}</div>
                        <div className="text-gray-400 text-xs">{collection.symbol}</div>
        </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {collection.floorPrice?.toFixed(4) || 'N/A'} Ξ
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={formatPercentWithColor(collection.priceChange24h).color}>
                      {formatPercentWithColor(collection.priceChange24h).text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={formatPercentWithColor(collection.priceChange7d).color}>
                      {formatPercentWithColor(collection.priceChange7d).text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {collection.volume7d?.toFixed(2) || 'N/A'} Ξ
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {collection.marketCap ? 
                      (collection.marketCap > 1000 ? 
                        `${(collection.marketCap / 1000).toFixed(2)}K` : 
                        collection.marketCap.toFixed(2)) 
                      : 'N/A'} Ξ
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getRiskBadge(collection.risk || 'Medium')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NFTExplorer = ({ searchResults, isLoading, onSelectNFT, selectedNFT, chain }: NFTExplorerProps) => {
  if (isLoading) {
    return renderLoading();
  }
  
  if (!searchResults && !selectedNFT) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h4 className="text-xl font-medium text-white mb-2">Search for NFTs</h4>
        <p className="text-gray-400 max-w-md mx-auto">
          Enter a search term above to discover NFTs by name, collection, or other attributes.
        </p>
      </div>
    );
  }
  
  // If we have a selected NFT, show its details
  if (selectedNFT) {
    return <NFTDetails nft={selectedNFT} chain={chain} />;
  }
  
  // Otherwise show search results
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">NFT Search Results</h3>
      
      {/* Results Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-300">
          Found {searchResults.total} results. Showing {searchResults.result.length} NFTs.
        </p>
      </div>
      
      {/* NFT Grid */}
      {searchResults.result.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {searchResults.result.map((nft: any) => (
            <div 
              key={`${nft.tokenAddress}-${nft.tokenId}`}
              className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition"
              onClick={() => onSelectNFT(nft.tokenAddress, nft.tokenId)}
            >
              {/* NFT Image */}
              <div className="relative aspect-square bg-gray-900">
                {nft.image ? (
                  <Image
                    src={nft.image}
                    alt={nft.name || 'NFT'}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-700" />
                    </div>
                )}
                        </div>
              
              {/* NFT Info */}
              <div className="p-3">
                <h5 className="text-white font-medium truncate">{nft.name || 'Unnamed NFT'}</h5>
                <p className="text-gray-400 text-sm truncate">{nft.symbol || ''}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Token ID: {nft.tokenId.length > 8 ? nft.tokenId.substring(0, 6) + '...' : nft.tokenId}</span>
                  <span className="bg-violet-900/30 text-violet-400 text-xs px-2 py-1 rounded">{chain}</span>
                      </div>
                      </div>
                    </div>
                ))}
              </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No NFTs found matching your search criteria.</p>
            </div>
      )}
      
      {/* Pagination/Load More */}
      {searchResults.cursor && (
        <div className="flex justify-center mt-6">
          <button 
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg"
            // This would need implementation to load more results
          >
            Load More
          </button>
              </div>
      )}
    </div>
  );
};

// NFT Details component to show when a specific NFT is selected
const NFTDetails = ({ nft, chain }: NFTDetailsProps) => {
  if (!nft) return null;
  
  // If metadata is a string, parse it
  const metadata = nft.metadata ? 
    (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) : 
    null;
  
  const normalizedMetadata = nft.normalizedMetadata || metadata;
  
  // Get the image URL from available sources
  const imageUrl = nft.image || 
    (normalizedMetadata?.image || 
     normalizedMetadata?.image_url || 
     normalizedMetadata?.imageUrl ||
     '');
  
  // Format attributes for display
  const attributes = normalizedMetadata?.attributes || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">NFT Details</h3>
        <button 
          onClick={() => window.history.back()}
          className="text-violet-400 hover:text-violet-300 text-sm"
        >
          ← Back to results
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NFT Image */}
        <div className="md:col-span-1">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="relative aspect-square bg-gray-900">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={nft.name || 'NFT'}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="h-32 w-32 text-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
              </div>
        
        {/* NFT Details */}
        <div className="md:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-1">{nft.name || 'Unnamed NFT'}</h2>
            <div className="flex space-x-2 mb-4">
              <span className="bg-violet-900/30 text-violet-400 text-xs px-2 py-1 rounded">{chain}</span>
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">{nft.contractType || 'ERC-721'}</span>
            </div>
            
            <div className="mb-6">
              <h4 className="text-gray-400 text-sm mb-2">Description</h4>
              <p className="text-white">
                {normalizedMetadata?.description || 'No description available.'}
              </p>
          </div>
          
            <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
                <h4 className="text-gray-400 text-sm mb-1">Token ID</h4>
                <p className="text-white font-medium">{nft.tokenId}</p>
                </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Symbol</h4>
                <p className="text-white font-medium">{nft.symbol || 'N/A'}</p>
                  </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Contract Address</h4>
                <p className="text-white font-medium truncate">{nft.tokenAddress}</p>
                </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Owner</h4>
                <p className="text-white font-medium truncate">{nft.owner || 'Unknown'}</p>
                  </div>
                  </div>
            
            {/* NFT Attributes */}
            {attributes.length > 0 && (
              <div>
                <h4 className="text-gray-400 text-sm mb-3">Attributes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attributes.map((attr: any, index: number) => (
                    <div key={index} className="bg-gray-900 rounded-md p-3">
                      <div className="text-violet-400 text-xs mb-1">{attr.trait_type}</div>
                      <div className="text-white font-medium truncate">{attr.value}</div>
                </div>
                  ))}
                </div>
              </div>
            )}
              </div>
              
          {/* Price & Trading History */}
          <div className="bg-gray-800 rounded-lg p-6 mt-4">
            <h4 className="text-white font-medium mb-4">Price History</h4>
                <div className="h-48">
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Price history data is being fetched...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WalletNFTs = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNFTs, setWalletNFTs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("nfts");
  const { chain } = useNFTStore();
  
  // Handle wallet address input change
  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  };
  
  // Handle form submission to get wallet NFTs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      setError("Please enter a valid Ethereum wallet address (starting with 0x)");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Use the actual API to get NFTs
      const response = await fetch(`/api/moralis/nft/wallet?address=${walletAddress}&chain=${chain}&limit=50`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wallet NFTs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWalletNFTs(data.result || []);
    } catch (err) {
      console.error("Error fetching wallet NFTs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch wallet NFTs");
      setWalletNFTs([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tabs for different wallet-related NFT data
  const walletTabs = [
    { id: "nfts", name: "NFTs" },
    { id: "collections", name: "Collections" },
    { id: "transfers", name: "Transfers" },
  ];
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Wallet NFTs</h3>
      
      {/* Wallet Address Input */}
      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Enter Ethereum Wallet Address
            </label>
            <div className="flex">
              <input
                type="text"
                value={walletAddress}
                onChange={handleWalletAddressChange}
                placeholder="0x..."
                className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-l-lg border border-gray-700"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-2 rounded-r-lg"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Search"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
          </div>
        </form>
      </div>
      
      {/* Wallet NFT Content */}
      {isLoading ? (
        renderLoading()
      ) : walletNFTs.length > 0 ? (
        <div className="space-y-6">
          {/* Sub-Tabs Navigation */}
          <div className="border-b border-gray-800">
            <div className="flex space-x-8">
              {walletTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-500"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Wallet NFTs Grid */}
          {activeTab === "nfts" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {walletNFTs.map((nft) => (
                <div 
                  key={`${nft.tokenAddress}-${nft.tokenId}`}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition cursor-pointer"
                >
                  {/* NFT Image */}
                  <div className="relative aspect-square bg-gray-900">
                    {nft.metadata?.image ? (
                      <Image
                        src={nft.metadata.image}
                        alt={nft.name || 'NFT'}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-16 w-16 text-gray-700" />
                </div>
                    )}
              </div>
              
                  {/* NFT Info */}
                  <div className="p-3">
                    <h5 className="text-white font-medium truncate">{nft.name || 'Unnamed NFT'}</h5>
                    <p className="text-gray-400 text-sm">{nft.symbol || ''}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Token ID: {nft.tokenId}</span>
                      <span className="bg-violet-900/30 text-violet-400 text-xs px-2 py-1 rounded">{nft.chain}</span>
                </div>
                </div>
                  </div>
              ))}
                </div>
          )}
          
          {/* Collections Tab */}
          {activeTab === "collections" && (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h4 className="text-xl text-white mb-2">NFT Collections</h4>
              <p className="text-gray-400">This wallet contains NFTs from multiple collections.</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 mr-3"></div>
                    <div>
                      <h5 className="text-white font-medium">CryptoPunks</h5>
                      <p className="text-gray-400 text-sm">PUNK • 3 items</p>
                </div>
              </div>
            </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 mr-3"></div>
                    <div>
                      <h5 className="text-white font-medium">Bored Ape Yacht Club</h5>
                      <p className="text-gray-400 text-sm">BAYC • 1 item</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Transfers Tab */}
          {activeTab === "transfers" && (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h4 className="text-white font-medium">Recent NFT Transfers</h4>
                      </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">NFT</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">From</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">To</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">Value</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded bg-gray-900 mr-2"></div>
                      <div>
                              <div className="text-white">CryptoPunk #{i}</div>
                              <div className="text-gray-400 text-xs">PUNK • ID: {i}</div>
                      </div>
                      </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="truncate max-w-[150px]">0x1234...5678</div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="truncate max-w-[150px]">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {(Math.random() * 10).toFixed(3)} ETH
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-white mb-2">No NFTs Found</h4>
          <p className="text-gray-400 max-w-md mx-auto">
            Enter a wallet address above to view owned NFTs, collections, and transfer history.
          </p>
        </div>
      )}
    </div>
  );
};

const NFTTrades = () => {
  const [collectionAddress, setCollectionAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [tradesData, setTradesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'contract' | 'token'>('contract');
  const { chain } = useNFTStore();
  
  // Handle input changes
  const handleCollectionAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionAddress(e.target.value);
  };
  
  const handleTokenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(e.target.value);
  };
  
  // Handle form submission to get trades
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collectionAddress || !collectionAddress.startsWith("0x")) {
      setError("Please enter a valid NFT collection address");
      return;
    }
    
    if (view === 'token' && !tokenId) {
      setError("Please enter a token ID");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        address: collectionAddress,
        chain: chain
      });
      
      if (view === 'token' && tokenId) {
        queryParams.append('tokenId', tokenId);
      }
      
      // Use the actual API to get NFT trades
      const response = await fetch(`/api/moralis/nft/trades?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT trades: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTradesData(data.result || []);
    } catch (err) {
      console.error("Error fetching NFT trades:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch NFT trades");
      setTradesData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Generate price history chart data
  const generatePriceChartData = () => {
    if (tradesData.length === 0) return [];
    
    // Sort by timestamp
    const sorted = [...tradesData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sorted.map(trade => ({
      date: new Date(trade.timestamp).toISOString().split('T')[0],
      price: parseFloat(trade.price),
      marketplace: trade.marketplace
    }));
  };
  
  const priceChartData = generatePriceChartData();
  
  // Get marketplace color for chart
  const getMarketplaceColor = (marketplace: string) => {
    switch (marketplace) {
      case 'OpenSea': return '#2081E2';
      case 'Blur': return '#FF8A65';
      case 'X2Y2': return '#00E0FF';
      case 'LooksRare': return '#0CE466';
      default: return '#8b5cf6';
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">NFT Trades</h3>
      
      {/* Search Form */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setView('contract')}
              className={`px-4 py-2 rounded-lg ${
                view === 'contract' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Contract Trades
            </button>
            <button
              onClick={() => setView('token')}
              className={`px-4 py-2 rounded-lg ${
                view === 'token' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Token Trades
            </button>
                      </div>
                    </div>
                    
        <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              NFT Collection Address
            </label>
            <input
              type="text"
              value={collectionAddress}
              onChange={handleCollectionAddressChange}
              placeholder="0x..."
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700"
            />
                      </div>
          
          {view === 'token' && (
                      <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Token ID
              </label>
              <input
                type="text"
                value={tokenId}
                onChange={handleTokenIdChange}
                placeholder="Token ID"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700"
              />
                      </div>
          )}
          
          <div>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-2 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get Trades"}
            </button>
                    </div>
          
          {error && (
            <p className="mt-2 text-red-400 text-sm">{error}</p>
          )}
        </form>
      </div>
      
      {/* NFT Trades Content */}
      {isLoading ? (
        renderLoading()
      ) : tradesData.length > 0 ? (
        <div className="space-y-6">
          {/* Price Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">
              {view === 'contract' ? 'Collection Price History' : `Token #${tokenId} Price History`}
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <XAxis 
                    dataKey="date" 
                    tick={{fill: '#9ca3af'}}
                    tickFormatter={(tick) => tick.slice(5)} // Display only month/day
                    type="category"
                  />
                  <YAxis 
                    tick={{fill: '#9ca3af'}}
                    tickFormatter={(tick) => `${tick} Ξ`}
                    domain={['dataMin', 'dataMax']}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${value} ETH`, undefined]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                  
                  {/* Create a separate scatter for each marketplace for different colors */}
                  {['OpenSea', 'Blur', 'X2Y2', 'LooksRare'].map(marketplace => (
                    <Scatter
                      key={marketplace}
                      name={marketplace}
                      data={priceChartData.filter(d => d.marketplace === marketplace)}
                      fill={getMarketplaceColor(marketplace)}
                      line={{ stroke: getMarketplaceColor(marketplace), strokeWidth: 1 }}
                      dataKey="price"
                    />
                  ))}
                  
                  <Legend 
                    formatter={(value) => <span style={{color: '#9ca3af'}}>{value}</span>}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
              </div>
              
          {/* Trades Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-white font-medium">Recent Trades</h4>
                </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    {view === 'contract' && (
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Token ID</th>
                    )}
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Price</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">From</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">To</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Marketplace</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tradesData.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-700">
                      {view === 'contract' && (
                        <td className="px-4 py-3 text-gray-300">#{trade.tokenId}</td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <div className="text-white">{trade.price} ETH</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        <div className="truncate max-w-[150px]">{trade.from}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        <div className="truncate max-w-[150px]">{trade.to}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded text-xs"
                          style={{ 
                            backgroundColor: `${getMarketplaceColor(trade.marketplace)}20`, 
                            color: getMarketplaceColor(trade.marketplace) 
                          }}
                        >
                          {trade.marketplace}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatDate(trade.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          
          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Average Price</div>
              <div className="text-2xl font-bold text-white">
                {(tradesData.reduce((sum, trade) => sum + parseFloat(trade.price), 0) / tradesData.length).toFixed(3)} ETH
          </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Highest Sale</div>
              <div className="text-2xl font-bold text-white">
                {Math.max(...tradesData.map(trade => parseFloat(trade.price))).toFixed(3)} ETH
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Trading Volume</div>
              <div className="text-2xl font-bold text-white">
                {tradesData.reduce((sum, trade) => sum + parseFloat(trade.price), 0).toFixed(3)} ETH
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-white mb-2">No Trade Data</h4>
          <p className="text-gray-400 max-w-md mx-auto">
            Enter a collection address {view === 'token' ? 'and token ID ' : ''}above to view trade history.
          </p>
        </div>
      )}
    </div>
  );
}; 