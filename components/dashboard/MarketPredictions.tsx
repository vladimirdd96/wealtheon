"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { getTokenPriceData, getSentimentData } from "@/lib/moralis";

// Time periods for filtering
const TIME_PERIODS = [
  { id: "24h", label: "24H", days: 1 },
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 }
];

// Assets to track
const ASSETS = [
  { id: "btcusd", symbol: "BTC", name: "Bitcoin", color: "#F7931A", address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", logoSrc: "/images/crypto/btc.svg" },
  { id: "ethusd", symbol: "ETH", name: "Ethereum", color: "#627EEA", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", logoSrc: "/images/crypto/eth.svg" },
  { id: "solusd", symbol: "SOL", name: "Solana", color: "#00FFBD", address: "0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4", logoSrc: "/images/crypto/sol.svg" },
  { id: "maticusd", symbol: "MATIC", name: "Polygon", color: "#8247E5", address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", logoSrc: "/images/crypto/matic.svg" },
  { id: "avaxusd", symbol: "AVAX", name: "Avalanche", color: "#E84142", address: "0x85f138bfee4ef8e540890cfb48f620571d67eda3", logoSrc: "/images/crypto/avax.svg" },
  { id: "dotusd", symbol: "DOT", name: "Polkadot", color: "#E6007A", address: "0x7083609fce4d1d8dc0c979aab8c869ea2c873402", logoSrc: "/images/crypto/dot.svg" },
  { id: "linkusd", symbol: "LINK", name: "Chainlink", color: "#2A5ADA", address: "0x514910771af9ca656af840dff83e8264ecf986ca", logoSrc: "/images/crypto/link.svg" },
  { id: "adausd", symbol: "ADA", name: "Cardano", color: "#0033AD", address: "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47", logoSrc: "/images/crypto/ada.svg" },
  { id: "dogeusd", symbol: "DOGE", name: "Dogecoin", color: "#C2A633", address: "0xba2ae424d960c26247dd6c32edc70b295c744c43", logoSrc: "/images/crypto/doge.svg" },
  { id: "xrpusd", symbol: "XRP", name: "XRP", color: "#23292F", address: "0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe", logoSrc: "/images/crypto/xrp.svg" }
];

export default function MarketPredictions() {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("7d");
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<any[] | null>(null);
  const [sentimentData, setSentimentData] = useState<any[] | null>(null);
  const [predictedData, setPredictedData] = useState<any[] | null>(null);
  const [marketInsights, setMarketInsights] = useState<any[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Get current asset
  const currentAsset = ASSETS.find(asset => asset.id === selectedAsset) || ASSETS[0];
  
  // Filter assets based on search query
  const filteredAssets = ASSETS.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Fetch market data function
  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const selectedPeriod = TIME_PERIODS.find(p => p.id === selectedTimePeriod) || TIME_PERIODS[1];
      const assetAddress = ASSETS.find(a => a.id === selectedAsset)?.address;
      
      if (!assetAddress) {
        throw new Error("Asset address not found");
      }
      
      // Calculate date ranges
      const currentTime = Math.floor(Date.now() / 1000);
      const fromDate = currentTime - (selectedPeriod.days * 24 * 60 * 60);
      
      // Fetch real data from Moralis API
      const data = await getTokenPriceData({
        address: assetAddress,
        chain: 'eth',
        fromDate: fromDate,
        toDate: currentTime,
        timeframe: selectedTimePeriod === '24h' ? '1h' : '1d'
      });
      
      if (!data || !data.result || !Array.isArray(data.result) || data.result.length === 0) {
        throw new Error("No price data available for this asset");
      }
      
      // Transform API data to our format
      const formattedPriceData = data.result.map((item: any) => ({
        date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: new Date(item.timestamp).getTime(),
        price: parseFloat(item.usdPrice) || 0,
        open: parseFloat(item.open) || parseFloat(item.usdPrice) || 0,
        high: parseFloat(item.high) || parseFloat(item.usdPrice) * 1.01 || 0,
        low: parseFloat(item.low) || parseFloat(item.usdPrice) * 0.99 || 0,
        close: parseFloat(item.close) || parseFloat(item.usdPrice) || 0,
        volume: parseFloat(item.volume) || parseFloat(item.usdPrice) * 1000000 || 0
      }));
      
      setPriceData(formattedPriceData);
      
      // Get sentiment data based on price movements
      const sentimentResult = await getSentimentData([currentAsset.symbol]);
      const sentimentData = sentimentResult.map((item: any, index: number) => ({
        date: formattedPriceData[index % formattedPriceData.length].date,
        timestamp: formattedPriceData[index % formattedPriceData.length].timestamp,
        sentiment: item.score,
        socialMentions: Math.round(10000 + item.score * 100),
        newsScore: Math.min(100, Math.max(0, item.score + (Math.random() * 20 - 10)))
      }));
      
      setSentimentData(sentimentData);
      
      // Generate price predictions based on real historical data
      const predictions = generatePricePredictions(formattedPriceData);
      setPredictedData(predictions);
      
      // Generate market insights based on real data
      const insights = generateMarketInsights(formattedPriceData, sentimentData || []);
      setMarketInsights(insights);
      
    } catch (err: any) {
      console.error("Error fetching market data:", err);
      setError(err.message || "Failed to load market data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch market data on component mount or when filters change
  useEffect(() => {
    fetchMarketData();
  }, [selectedAsset, selectedTimePeriod, fetchMarketData]);
  
  // Generate price predictions based on real data
  const generatePricePredictions = (priceData: any[]) => {
    if (!priceData || priceData.length === 0) return [];
    
    const lastPrice = priceData[priceData.length - 1].price;
    const lastDate = new Date(priceData[priceData.length - 1].timestamp);
    
    // Calculate volatility from historical prices
    let sumSquaredReturns = 0;
    for (let i = 1; i < priceData.length; i++) {
      const returnValue = Math.log(priceData[i].price / priceData[i - 1].price);
      sumSquaredReturns += returnValue * returnValue;
    }
    const volatility = Math.sqrt(sumSquaredReturns / (priceData.length - 1));
    
    // Generate future price predictions
    const futureDays = 5;
    const predictions = [];
    
    // Add the last actual price point
    predictions.push({
      date: priceData[priceData.length - 1].date,
      price: lastPrice,
      isPrediction: false
    });
    
    // Use linear regression for trend analysis
    const xValues = Array.from({ length: priceData.length }, (_, i) => i);
    const yValues = priceData.map(d => d.price);
    
    // Calculate slope and intercept for linear regression
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
    const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predicted prices
    let predictedPrice = lastPrice;
    for (let i = 1; i <= futureDays; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      
      // Combine linear trend with some randomness based on historical volatility
      const trend = slope * (n + i - 1) + intercept;
      const randomWalk = volatility * (Math.random() * 2 - 1) * lastPrice;
      predictedPrice = trend + randomWalk * 0.5; // Reduce random influence
      
      // Ensure we don't predict negative prices
      predictedPrice = Math.max(0, predictedPrice);
      
      // Confidence interval widens with time
      const confidenceFactor = Math.sqrt(i);
      const upperBound = predictedPrice * (1 + volatility * confidenceFactor);
      const lowerBound = predictedPrice * (1 - volatility * confidenceFactor);
      
      predictions.push({
        date: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: predictedPrice,
        upperBound,
        lowerBound,
        isPrediction: true
      });
    }
    
    return predictions;
  };
  
  // Generate market insights
  const generateMarketInsights = (priceData: any[], sentimentData: any[]) => {
    if (!priceData || !sentimentData || priceData.length === 0 || sentimentData.length === 0) {
      // Return default values if data is missing
      return [{
        title: "Price Trend",
        value: "0.00%",
        details: `${currentAsset.symbol} price data is not available.`,
        indicator: "warning",
        priceChange: 0,
        volatility: 0,
        avgSentiment: 50,
        volumeTrend: "stable",
        avgVolume: 0
      }];
    }
    
    // Calculate price change
    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    // Calculate volatility
    let sumSquaredReturns = 0;
    for (let i = 1; i < priceData.length; i++) {
      const returnValue = Math.log(priceData[i].price / priceData[i - 1].price);
      sumSquaredReturns += returnValue * returnValue;
    }
    const volatility = Math.sqrt(sumSquaredReturns / (priceData.length - 1)) * 100;
    
    // Sentiment analysis
    const avgSentiment = sentimentData.reduce((sum, day) => sum + day.sentiment, 0) / sentimentData.length;
    const latestSentiment = sentimentData[sentimentData.length - 1].sentiment;
    const sentimentTrend = latestSentiment > 50 ? "positive" : "negative";
    
    // Trading volume
    const averageVolume = priceData.reduce((sum, day) => sum + day.volume, 0) / priceData.length;
    const latestVolume = priceData[priceData.length - 1].volume;
    const volumeTrend = latestVolume > averageVolume ? "increasing" : "decreasing";
    
    // Generate insights
    return [
      {
        title: "Price Trend",
        value: `${priceChange.toFixed(2)}%`,
        details: priceChange > 0 
          ? `${currentAsset.symbol} has appreciated by ${priceChange.toFixed(2)}% in the selected period, showing bullish momentum.`
          : `${currentAsset.symbol} has declined by ${Math.abs(priceChange).toFixed(2)}% in the selected period, showing bearish pressure.`,
        indicator: priceChange > 0 ? "positive" : "negative",
        priceChange: priceChange,
        volatility: volatility,
        avgSentiment: avgSentiment,
        volumeTrend: volumeTrend,
        avgVolume: averageVolume
      },
      {
        title: "Volatility",
        value: `${volatility.toFixed(2)}%`,
        details: volatility > 5 
          ? `${currentAsset.symbol} is showing high volatility of ${volatility.toFixed(2)}%, suggesting potential trading opportunities but higher risk.`
          : `${currentAsset.symbol} is relatively stable with volatility at ${volatility.toFixed(2)}%, suggesting lower risk.`,
        indicator: volatility > 5 ? "warning" : "positive",
        priceChange: priceChange,
        volatility: volatility,
        avgSentiment: avgSentiment,
        volumeTrend: volumeTrend,
        avgVolume: averageVolume
      },
      {
        title: "Market Sentiment",
        value: `${latestSentiment.toFixed(0)}/100`,
        details: `Overall market sentiment for ${currentAsset.symbol} is ${sentimentTrend}, with a score of ${latestSentiment.toFixed(0)}/100.`,
        indicator: sentimentTrend === "positive" ? "positive" : "negative",
        priceChange: priceChange,
        volatility: volatility,
        avgSentiment: avgSentiment,
        volumeTrend: volumeTrend,
        avgVolume: averageVolume
      },
      {
        title: "Trading Volume",
        value: formatCurrency(latestVolume),
        details: `Trading volume is ${volumeTrend} compared to the average of ${formatCurrency(averageVolume)} for the period.`,
        indicator: volumeTrend === "increasing" ? "positive" : "warning",
        priceChange: priceChange,
        volatility: volatility,
        avgSentiment: avgSentiment,
        volumeTrend: volumeTrend,
        avgVolume: averageVolume
      }
    ];
  };
  
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
  
  // Format crypto price based on asset
  const formatCryptoPrice = (value: number) => {
    if (value === undefined || value === null) return '$0.00';
    
    switch (selectedAsset) {
      case "btcusd":
      case "ethusd":
      case "avaxusd":
        return `$${value.toFixed(2)}`;
      case "solusd":
        return `$${value.toFixed(2)}`;
      case "maticusd":
        return `$${value.toFixed(4)}`;
      default:
        return `$${value.toFixed(2)}`;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
        <div className="text-white text-lg">Analyzing market data...</div>
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
          onClick={() => fetchMarketData()}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // No data state
  if (!priceData || !sentimentData || !predictedData) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[500px]">
        <div className="text-white text-lg">No market data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Market Predictions</h2>
          <p className="text-gray-400">AI-powered crypto trend forecasting</p>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3 items-center">
          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search cryptocurrency..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none w-[220px]"
              />
              <button
                className="p-2 text-gray-400 hover:text-white"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
              >
                {searchQuery ? 'ⓧ' : '🔍'}
              </button>
            </div>
            
            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div 
                className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
                onBlur={() => setIsSearchOpen(false)}
              >
                {filteredAssets.length > 0 ? (
                  filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSelectedAsset(asset.id);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      <div className="w-6 h-6 relative mr-2 flex-shrink-0">
                        <Image
                          src={asset.logoSrc}
                          alt={asset.symbol}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-white text-sm">{asset.name}</div>
                        <div className="text-gray-400 text-xs">{asset.symbol}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">No cryptocurrencies found</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Select Tabs */}
          <div className="flex bg-gray-800 rounded-lg overflow-hidden">
            {ASSETS.slice(0, 5).map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`px-3 py-2 text-sm font-medium ${
                  selectedAsset === asset.id
                    ? `text-white bg-violet-600`
                    : `text-gray-300 hover:bg-gray-700`
                }`}
              >
                {asset.symbol}
              </button>
            ))}
          </div>

          {/* Time Period Selector */}
          <div className="flex bg-gray-800 rounded-lg overflow-hidden">
            {TIME_PERIODS.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedTimePeriod(period.id)}
                className={`px-3 py-2 text-sm font-medium ${
                  selectedTimePeriod === period.id
                    ? `text-white bg-violet-600`
                    : `text-gray-300 hover:bg-gray-700`
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Current Asset Information */}
      <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 relative mr-3 flex-shrink-0">
            <Image
              src={currentAsset.logoSrc}
              alt={currentAsset.symbol}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{currentAsset.name}</h3>
            {priceData && priceData.length > 0 && (
              <div className="flex items-center">
                <span className="text-lg font-semibold text-white mr-2">
                  {formatCryptoPrice(priceData[priceData.length - 1].price)}
                </span>
                <span className={`text-sm font-medium ${
                  marketInsights && marketInsights[0] && marketInsights[0].priceChange >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {marketInsights && marketInsights[0] && marketInsights[0].priceChange !== undefined && (
                    `${marketInsights[0].priceChange >= 0 ? '+' : ''}${marketInsights[0].priceChange.toFixed(2)}%`
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Selected Asset Details */}
        {marketInsights && marketInsights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">Price Change ({selectedTimePeriod})</div>
              <div className={`text-lg font-medium ${marketInsights && marketInsights[0] && marketInsights[0].priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {marketInsights && marketInsights[0] && marketInsights[0].priceChange !== undefined ? 
                  `${marketInsights[0].priceChange >= 0 ? '+' : ''}${marketInsights[0].priceChange.toFixed(2)}%` : '0.00%'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">Volatility</div>
              <div className="text-lg font-medium text-white">
                {marketInsights[0].volatility.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">Sentiment Score</div>
              <div className={`text-lg font-medium ${
                marketInsights && marketInsights[0] && marketInsights[0].avgSentiment > 60 ? 'text-green-400' : 
                marketInsights && marketInsights[0] && marketInsights[0].avgSentiment < 40 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {marketInsights && marketInsights[0] && marketInsights[0].avgSentiment ? 
                  marketInsights[0].avgSentiment.toFixed(1) : '50'}/100
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">Trading Volume</div>
              <div className={`text-lg font-medium text-white`}>
                {marketInsights && marketInsights[0] && marketInsights[0].volumeTrend ? 
                  (marketInsights[0].volumeTrend === 'increasing' ? '↑' : 
                   marketInsights[0].volumeTrend === 'decreasing' ? '↓' : '→') : '→'} 
                {marketInsights && marketInsights[0] && marketInsights[0].avgVolume ? 
                  formatCurrency(marketInsights[0].avgVolume) : '$0'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Price Charts and Predictions */}
        <div>
          {/* Price Overview Chart */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Price Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={priceData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentAsset.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={currentAsset.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis 
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={(value) => formatCryptoPrice(value)}
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={(value) => [formatCryptoPrice(value as number), "Price"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={currentAsset.color} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Trading Volume Chart */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Trading Volume</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                      return `$${value}`;
                    }}
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), "Volume"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Bar dataKey="volume" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Predictions and Sentiment Analysis */}
        <div>
          {/* AI Predictions */}
          <div className="bg-gray-900/60 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI Price Predictions</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={predictedData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis 
                    domain={['dataMin - 2000', 'dataMax + 2000']}
                    tickFormatter={(value) => formatCryptoPrice(value)}
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={(value) => [formatCryptoPrice(value as number), "Price"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Legend />
                  
                  {/* Confidence Interval Area */}
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="upperBound" 
                    stroke="none" 
                    fill="url(#confidenceGradient)" 
                    fillOpacity={0.5}
                    name="Confidence Interval"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lowerBound" 
                    stroke="none" 
                    fill="url(#confidenceGradient)" 
                    fillOpacity={0}
                    name="Confidence Interval"
                  />
                  
                  {/* Actual and Predicted Lines */}
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, stroke: "#8884d8", strokeWidth: 2 }}
                    name="Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">
                <strong className="text-white">AI Analysis:</strong> Based on historical volatility and market patterns, 
                our AI predicts {currentAsset.symbol} will likely 
                {predictedData[predictedData.length - 1].price > priceData[priceData.length - 1].price ? 
                  " continue its upward trend " : 
                  " face some resistance "} 
                in the coming days. The confidence interval widens with time to reflect increasing uncertainty.
              </div>
            </div>
          </div>
          
          {/* Market Sentiment Analysis */}
          <div className="bg-gray-900/60 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sentimentData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Sentiment"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Insights Cards */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketInsights?.map((insight, index) => (
            <motion.div
              key={index}
              className="bg-gray-900/60 p-4 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-400 text-sm">{insight.title}</div>
                <div className={`rounded-full w-2 h-2 ${
                  insight.indicator === "positive" ? "bg-green-400" :
                  insight.indicator === "negative" ? "bg-red-400" :
                  "bg-yellow-400"
                }`}></div>
              </div>
              <div className="text-xl font-semibold text-white mb-1">{insight.value}</div>
              <div className="text-sm text-gray-300">{insight.details}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 