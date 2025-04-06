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
        
        // Generate mock data when API calls fail
        const generateMockPriceData = (basePrice: number, count: number = 30) => {
          const result = [];
          const now = new Date();
          
          for (let i = 0; i < count; i++) {
            const date = new Date();
            date.setDate(now.getDate() - (count - i - 1));
            
            // Generate trending price with some randomness
            const factor = i / count; // 0 to 1 factor for trending
            const randomFactor = (Math.random() - 0.3) * 0.1;
            const price = basePrice * (1 + factor * 0.2 + randomFactor);
            
            result.push({
              date: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
              timestamp: Math.floor(date.getTime() / 1000),
              close: price
            });
          }
          
          return result;
        };
        
        // Function to get real-time data from CoinGecko
        const getRealPriceData = async (coinId: string, count: number = 30): Promise<any[]> => {
          try {
            // Calculate date range (days ago from now)
            const now = Math.floor(Date.now() / 1000);
            const daysAgo = now - (count * 86400);
            
            // Use CoinGecko's market chart endpoint to get historical data
            const response = await fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${daysAgo}&to=${now}`
            );
            
            if (!response.ok) {
              throw new Error(`CoinGecko API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process the data into the format we need
            return data.prices.map((item: [number, number]) => {
              const date = new Date(item[0]);
              return {
                date: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
                timestamp: Math.floor(date.getTime() / 1000),
                close: item[1]
              };
            });
          } catch (error) {
            console.error(`Error fetching price data for ${coinId}:`, error);
            throw error;
          }
        };
        
        // Fetch price data for BTC, ETH, and SOL
        // We'll use Promise.allSettled to handle individual API failures
        const [
          btcResult, 
          ethResult, 
          solResult, 
          tokensResult, 
          sentimentResult
        ] = await Promise.allSettled([
          getBitcoinPriceData({ limit: 30, timeframe: '1d' }).catch(() => getRealPriceData('bitcoin')),
          getEthereumPriceData({ limit: 30, timeframe: '1d' }).catch(() => getRealPriceData('ethereum')),
          getSolanaPriceData({ limit: 30, timeframe: '1d' }).catch(() => getRealPriceData('solana')),
          getTopTokens(5).catch(() => [
            { symbol: 'BTC', name: 'Bitcoin', marketCap: '1200000000000' },
            { symbol: 'ETH', name: 'Ethereum', marketCap: '500000000000' },
            { symbol: 'SOL', name: 'Solana', marketCap: '80000000000' },
            { symbol: 'BNB', name: 'Binance Coin', marketCap: '70000000000' },
            { symbol: 'ADA', name: 'Cardano', marketCap: '30000000000' }
          ]),
          getSentimentData().catch(() => [
            { subject: "Reddit", score: 75, fullMark: 100 },
            { subject: "Twitter", score: 80, fullMark: 100 },
            { subject: "News", score: 65, fullMark: 100 },
            { subject: "Blogs", score: 70, fullMark: 100 },
            { subject: "Forums", score: 60, fullMark: 100 }
          ]),
        ]);
        
        // Process BTC, ETH, SOL data for the line chart
        let btcData, ethData, solData;
        
        try {
          btcData = btcResult.status === 'fulfilled' ? btcResult.value : await getRealPriceData('bitcoin');
        } catch (error) {
          console.error("Failed to get Bitcoin data, using fallback:", error);
          btcData = generateMockPriceData(40000);
        }
        
        try {
          ethData = ethResult.status === 'fulfilled' ? ethResult.value : await getRealPriceData('ethereum');
        } catch (error) {
          console.error("Failed to get Ethereum data, using fallback:", error);
          ethData = generateMockPriceData(2500);
        }
        
        try {
          solData = solResult.status === 'fulfilled' ? solResult.value : await getRealPriceData('solana');
        } catch (error) {
          console.error("Failed to get Solana data, using fallback:", error);
          solData = generateMockPriceData(100);
        }
        
        // Create a combined dataset for all tokens
        const combinedData: MarketDataPoint[] = btcData.map((btcPoint, index) => {
          // Make sure we have data for all three tokens at this index
          const ethPoint = index < ethData.length ? ethData[index] : { close: 0 };
          const solPoint = index < solData.length ? solData[index] : { close: 0 };
          
          return {
            name: btcPoint.date || `Day ${index + 1}`,
            timestamp: btcPoint.timestamp || Math.floor(Date.now() / 1000) - (30 - index) * 86400,
            btc: btcPoint.close || 0,
            eth: ethPoint.close || 0,
            sol: solPoint.close || 0,
          };
        });
        
        if (combinedData.length) {
          setMarketData(combinedData);
        } else {
          // Set fallback data if we couldn't get any data
          setMarketData(Array.from({ length: 30 }, (_, i) => ({
            name: `Day ${i + 1}`,
            btc: 40000 * (1 + i * 0.01),
            eth: 2500 * (1 + i * 0.015),
            sol: 100 * (1 + i * 0.02),
            timestamp: Math.floor(Date.now() / 1000) - (30 - i) * 86400
          })));
        }
        
        // Process top tokens data for the portfolio allocation chart
        if (tokensResult.status === 'fulfilled' && tokensResult.value.length) {
          const tokens = tokensResult.value;
          const distributionData = tokens.map(token => ({
            name: token.symbol || 'Unknown',
            value: parseFloat(token.marketCap) || 0
          }));
          
          setPortfolioDistribution(distributionData);
        } else {
          // Fallback data
          setPortfolioDistribution([
            { name: 'BTC', value: 1200000000000 },
            { name: 'ETH', value: 500000000000 },
            { name: 'SOL', value: 80000000000 },
            { name: 'BNB', value: 70000000000 },
            { name: 'ADA', value: 30000000000 }
          ]);
        }
        
        // Update sentiment data if available
        if (sentimentResult.status === 'fulfilled' && sentimentResult.value.length) {
          setSentimentData(sentimentResult.value);
        } else {
          // Fallback sentiment data
          setSentimentData([
            { subject: "Reddit", score: 75, fullMark: 100 },
            { subject: "Twitter", score: 80, fullMark: 100 },
            { subject: "News", score: 65, fullMark: 100 },
            { subject: "Blogs", score: 70, fullMark: 100 },
            { subject: "Forums", score: 60, fullMark: 100 }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        // Set fallback data even when there's an error
        setMarketData(Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          btc: 40000 * (1 + i * 0.01),
          eth: 2500 * (1 + i * 0.015),
          sol: 100 * (1 + i * 0.02),
          timestamp: Math.floor(Date.now() / 1000) - (30 - i) * 86400
        })));
        
        setPortfolioDistribution([
          { name: 'BTC', value: 1200000000000 },
          { name: 'ETH', value: 500000000000 },
          { name: 'SOL', value: 80000000000 },
          { name: 'BNB', value: 70000000000 },
          { name: 'ADA', value: 30000000000 }
        ]);
        
        setSentimentData([
          { subject: "Reddit", score: 75, fullMark: 100 },
          { subject: "Twitter", score: 80, fullMark: 100 },
          { subject: "News", score: 65, fullMark: 100 },
          { subject: "Blogs", score: 70, fullMark: 100 },
          { subject: "Forums", score: 60, fullMark: 100 }
        ]);
        
        setError('Data shown is simulated due to API connection issues');
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