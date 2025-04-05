"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  getBitcoinPriceData, 
  getEthereumPriceData, 
  getSolanaPriceData, 
  getTopTokens, 
  getSentimentData 
} from "@/lib/moralis/cryptoApi";

// Define types for our market data
interface MarketDataPoint {
  name: string;
  btc: number;
  eth: number;
  sol: number;
  timestamp?: number;
}

export function DataVisualization() {
  // State for chart data
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [portfolioDistribution, setPortfolioDistribution] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch price data for BTC, ETH, and SOL
        // We'll use Promise.allSettled to handle individual API failures
        const [
          btcResult, 
          ethResult, 
          solResult, 
          tokensResult, 
          sentimentResult
        ] = await Promise.allSettled([
          getBitcoinPriceData({ limit: 30, timeframe: '1d' }),
          getEthereumPriceData({ limit: 30, timeframe: '1d' }),
          getSolanaPriceData({ limit: 30, timeframe: '1d' }),
          getTopTokens(5),
          getSentimentData(),
        ]);
        
        // Process BTC, ETH, SOL data for the line chart
        const btcData = btcResult.status === 'fulfilled' ? btcResult.value : [];
        const ethData = ethResult.status === 'fulfilled' ? ethResult.value : [];
        const solData = solResult.status === 'fulfilled' ? solResult.value : [];
        
        if (btcData.length && ethData.length && solData.length) {
          // Create a combined dataset for all tokens
          const combinedData: MarketDataPoint[] = btcData.map((btcPoint, index) => {
            // Make sure we have data for all three tokens at this index
            if (index < ethData.length && index < solData.length) {
              return {
                name: btcPoint.date,
                timestamp: btcPoint.timestamp,
                btc: btcPoint.close,
                eth: ethData[index].close,
                sol: solData[index].close,
              };
            }
            // This should never happen due to the filter below, but TypeScript needs it
            return {
              name: '',
              btc: 0,
              eth: 0,
              sol: 0
            };
          }).filter((item): item is MarketDataPoint => item !== null && item.name !== '');
          
          if (combinedData.length) {
            setMarketData(combinedData);
          } else {
            setError('Failed to process market data');
          }
        } else {
          setError('Could not retrieve market data');
        }
        
        // Process top tokens data for the portfolio allocation chart
        if (tokensResult.status === 'fulfilled' && tokensResult.value.length) {
          const tokens = tokensResult.value;
          const distributionData = tokens.map(token => ({
            name: token.symbol || 'Unknown',
            value: parseFloat(token.marketCap) || 0
          }));
          
          if (distributionData.length) {
            setPortfolioDistribution(distributionData);
          } else {
            console.warn('No portfolio distribution data available');
          }
        } else {
          console.warn('Failed to fetch portfolio distribution data');
        }
        
        // Update sentiment data if available
        if (sentimentResult.status === 'fulfilled' && sentimentResult.value.length) {
          setSentimentData(sentimentResult.value);
        } else {
          console.warn('Failed to fetch sentiment data');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
        setLoading(false);
      }
    }
    
    fetchChartData();
  }, []);

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

  // Custom tooltip formatter
  const priceTooltipFormatter = (value: number, name: string) => {
    const tokenNames = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      sol: 'Solana'
    };
    return [formatPrice(value), tokenNames[name as keyof typeof tokenNames] || name];
  };

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl z-10">
      <div className="text-white text-lg">Loading data...</div>
    </div>
  );

  const ErrorOverlay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl z-10">
      <div className="text-red-400 text-lg">{message}</div>
    </div>
  );

  const NoDataOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 rounded-xl z-10">
      <div className="text-gray-300 text-lg">No data available</div>
    </div>
  );

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
            {loading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} />}
            {!loading && !error && marketData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Market Trends</h3>
            <div className="h-80">
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
            {loading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} />}
            {!loading && !error && sentimentData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Sentiment Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sentimentData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#9CA3AF" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9CA3AF" }} />
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
                      color: "#F9FAFB",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Portfolio Allocation */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {loading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} />}
            {!loading && !error && portfolioDistribution.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Portfolio Allocation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#4B5563",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#7c3aed" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Price Trends */}
          <motion.div
            className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
          >
            {loading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} />}
            {!loading && !error && marketData.length === 0 && <NoDataOverlay />}
            <h3 className="text-xl font-semibold text-white mb-4">Price Trends</h3>
            <div className="h-80">
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
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 