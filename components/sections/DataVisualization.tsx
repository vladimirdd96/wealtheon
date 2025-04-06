"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { useMarketDataStore } from "@/store";
import { getSentimentData } from "@/lib/moralis/cryptoApi";

// Define types for our market data
interface MarketDataPoint {
  name: string;
  btc: number;
  eth: number;
  sol: number;
  timestamp?: number;
}

export function DataVisualization() {
  // Get data from Zustand store
  const { 
    bitcoinData, 
    ethereumData, 
    solanaData, 
    tokenPrices,
    isLoading,
    error: storeError,
    fetchAllMarketData,
    fetchTokenPrices,
    clearError
  } = useMarketDataStore();

  // State for chart data
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [marketCapDistribution, setMarketCapDistribution] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retry on error
  useEffect(() => {
    if (storeError) {
      const timer = setTimeout(() => {
        clearError();
        fetchAllMarketData();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [storeError, clearError, fetchAllMarketData]);

  // Load sentiment data separately (not included in market data store)
  useEffect(() => {
    let mounted = true;
    
    async function fetchSentimentData() {
      try {
        const result = await getSentimentData();
        if (mounted) {
          setSentimentData(result);
        }
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        // Retry sentiment data fetch if failed
        if (mounted) {
          setTimeout(fetchSentimentData, 3000);
        }
      }
    }
    
    fetchSentimentData();
    
    return () => { mounted = false; };
  }, []);

  // Process data from the Zustand store into the format needed for charts
  useEffect(() => {
    if (!isLoading.bitcoin && !isLoading.ethereum && !isLoading.solana) {
      try {
        // Process BTC, ETH, SOL data for the line chart
        const combinedData: MarketDataPoint[] = bitcoinData.map((btcPoint, index) => {
          // Make sure we have data for all three tokens at this index
          const ethPoint = index < ethereumData.length ? ethereumData[index] : { close: 0 };
          const solPoint = index < solanaData.length ? solanaData[index] : { close: 0 };
          
          return {
            name: btcPoint.date || `Day ${index + 1}`,
            timestamp: btcPoint.timestamp || new Date(btcPoint.date).getTime() / 1000,
            btc: btcPoint.close || btcPoint.open || 0,
            eth: (ethPoint as any).close || (ethPoint as any).open || 0,
            sol: (solPoint as any).close || (solPoint as any).open || 0,
          };
        });
        
        setMarketData(combinedData);
        
        // Process token prices for market cap distribution
        if (tokenPrices.length > 0) {
          // Calculate market cap using more accurate circulating supply data
          const marketCaps = tokenPrices
            .filter(token => token.usdPrice > 0)
            .map(token => {
              // Use more accurate circulating supply estimates
              // These values should be updated periodically
              let circulatingSupply: number;
              
              switch (token.symbol) {
                case 'SOL':
                  circulatingSupply = 426160528; // Updated Solana circulating supply
                  break;
                case 'BTC':
                  circulatingSupply = 19543050; // Updated Bitcoin circulating supply
                  break;
                case 'ETH':
                  circulatingSupply = 120213667; // Updated Ethereum circulating supply
                  break;
                case 'USDC':
                  circulatingSupply = 31002269825; // Updated USDC circulating supply
                  break;
                case 'MSOL':
                  circulatingSupply = 38920657; // mSOL circulating supply estimate
                  break;
                case 'BONK':
                  circulatingSupply = 94126444941600; // BONK supply estimate
                  break;
                case 'JUP':
                  circulatingSupply = 1145687500; // Jupiter supply estimate
                  break;
                case 'PYTH':
                  circulatingSupply = 3565245261; // Pyth supply estimate
                  break;
                case 'JTO':
                  circulatingSupply = 98700000; // Jito supply estimate
                  break;
                case 'RNDR':
                  circulatingSupply = 395379304; // RNDR supply estimate
                  break;
                default:
                  circulatingSupply = 1000000000; // Default for unknown tokens
              }
              
              return {
                name: token.symbol,
                value: token.usdPrice * circulatingSupply,
                price: token.usdPrice,
                circulatingSupply,
                priceChange: token.usdPrice24hrPercentChange || 0
              };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Just show top 5 for cleaner visualization
            
          setMarketCapDistribution(marketCaps);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error processing data:', err);
        setError('Unable to process data. Please try again later.');
        setLoading(false);
      }
    }
  }, [bitcoinData, ethereumData, solanaData, tokenPrices, isLoading]);

  // Handle refresh data
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    clearError();
    fetchAllMarketData();
  }, [clearError, fetchAllMarketData]);

  // Format price for tooltip display
  const formatPrice = (value: number) => {
    if (!value && value !== 0) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format market cap for tooltip
  const formatMarketCap = (value: number) => {
    if (!value && value !== 0) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value / 1000000000) + ' B';
  };

  // Custom tooltip formatter
  const priceTooltipFormatter = (value: number, name: string) => {
    const tokenNames = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      sol: 'Solana'
    };
    return [formatPrice(value), tokenNames[name as keyof typeof tokenNames] || name];
  };

  // Market cap tooltip formatter
  const marketCapTooltipFormatter = (value: number, name: string) => {
    return [formatMarketCap(value), name];
  };

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl z-10">
      <div className="text-white text-lg">Loading data...</div>
    </div>
  );

  const ErrorOverlay = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 rounded-xl z-10">
      <div className="text-red-400 text-lg mb-4">{message}</div>
      {onRetry && (
        <button 
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );

  const NoDataOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 rounded-xl z-10">
      <div className="text-gray-300 text-lg">No data available</div>
    </div>
  );

  // Determine loading and error states from both local state and store
  const isDataLoading = loading || isLoading.bitcoin || isLoading.ethereum || isLoading.solana || isLoading.tokenPrices;
  const dataError = error || storeError;

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            AI-Powered Analytics
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Leverage our advanced AI to gain insights from complex market data
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Market Trends Chart */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {isDataLoading && <LoadingOverlay />}
            {dataError && <ErrorOverlay message={dataError} onRetry={handleRefresh} />}
            {!isDataLoading && !dataError && marketData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Market Trends</h3>
            <div className="h-80">
              {marketData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#4B5563",
                        color: "#F9FAFB",
                      }}
                      formatter={priceTooltipFormatter}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="btc" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ stroke: "#8b5cf6", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="eth" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={{ stroke: "#6366f1", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sol" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={{ stroke: "#a855f7", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, stroke: "#a855f7", strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
          
          {/* Sentiment Analysis */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {isDataLoading && <LoadingOverlay />}
            {dataError && <ErrorOverlay message={dataError} onRetry={handleRefresh} />}
            {!isDataLoading && !dataError && sentimentData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Market Sentiment Analysis</h3>
            <div className="h-80">
              {sentimentData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={70}
                    data={sentimentData}
                    margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                  >
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      stroke="#9CA3AF" 
                      tick={{ 
                        fill: "#9CA3AF",
                        fontSize: 11,
                        dy: 12
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "#4B5563" }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      stroke="#9CA3AF"
                      tickCount={4}
                      tick={{ fontSize: 10 }}
                    />
                    <Radar 
                      name="Sentiment" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.5} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#4B5563",
                        color: "#F9FAFB"
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
          
          {/* Market Cap Distribution */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {isDataLoading && <LoadingOverlay />}
            {dataError && <ErrorOverlay message={dataError} onRetry={handleRefresh} />}
            {!isDataLoading && !dataError && marketCapDistribution.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Market Cap Distribution</h3>
            <div className="h-80">
              {marketCapDistribution.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={marketCapDistribution}
                    margin={{ top: 10, right: 10, bottom: 10, left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis 
                      stroke="#9CA3AF" 
                      tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}B`}
                      width={55}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#4B5563",
                        color: "#F9FAFB",
                      }}
                      formatter={marketCapTooltipFormatter}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#7c3aed" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
          
          {/* Solana Price Trend */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {isDataLoading && <LoadingOverlay />}
            {dataError && <ErrorOverlay message={dataError} onRetry={handleRefresh} />}
            {!isDataLoading && !dataError && marketData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Solana Price Trend</h3>
            <div className="h-80">
              {marketData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#4B5563",
                        color: "#F9FAFB",
                      }}
                      formatter={priceTooltipFormatter}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sol" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      fill="url(#colorGradient)" 
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 