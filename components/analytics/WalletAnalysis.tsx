"use client";

import React, { useState } from "react";
import Moralis from "moralis";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowRightIcon, CurrencyDollarIcon, WalletIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';

// Define interfaces for typing
interface TokenMetadata {
  name?: string;
  symbol?: string;
  decimals?: number | string;
  logo?: string;
}

interface TokenHolding {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  logo?: string;
  address: string;
}

interface WalletInfo {
  address: string;
  solBalance: number;
  tokenCount: number;
  totalValue: number;
}

// Type for pie chart data
interface ChartData {
  name: string;
  value: number;
  color: string;
}

// Helper function to format currency values
const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

// Generate colors for pie chart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];

const WalletAnalysis = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [totalValue, setTotalValue] = useState(0);

  // Data for pie chart
  const getChartData = (): ChartData[] => {
    // Only include tokens with value > 0
    const filteredTokens = tokenHoldings.filter(token => token.value > 0);
    
    // Sort by value, descending
    const sortedTokens = [...filteredTokens].sort((a, b) => b.value - a.value);
    
    // Get top tokens and add an "Other" category for the rest
    const topTokens = sortedTokens.slice(0, 8);
    const otherTokens = sortedTokens.slice(8);
    
    const chartData = topTokens.map((token, index) => ({
      name: token.symbol,
      value: token.value,
      color: COLORS[index % COLORS.length]
    }));
    
    // Add "Other" category if needed
    if (otherTokens.length > 0) {
      const otherValue = otherTokens.reduce((sum, token) => sum + token.value, 0);
      chartData.push({
        name: 'Other',
        value: otherValue,
        color: COLORS[8 % COLORS.length]
      });
    }
    
    return chartData;
  };
  
  // Get token price from CoinGecko
  const getTokenPrice = async (symbol: string): Promise<number> => {
    try {
      // Map common token symbols to CoinGecko IDs
      const tokenIdMap: {[key: string]: string} = {
        'SOL': 'solana',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'BONK': 'bonk',
        'JTO': 'jito-dao',
        'PYTH': 'pyth-network',
        'RNDR': 'render-token',
        'JUP': 'jupiter',
        'WIF': 'dogwifhat'
      };
      
      // Default to a small value for unknown tokens
      if (!tokenIdMap[symbol]) {
        return 0.01;
      }
      
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIdMap[symbol]}&vs_currencies=usd`);
      
      if (!response.ok) {
        console.error(`Failed to get price for ${symbol}`);
        return 0.01; // Fallback value
      }
      
      const data = await response.json();
      return data[tokenIdMap[symbol]]?.usd || 0.01;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0.01; // Fallback value
    }
  };
  
  const handleAnalyze = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }

    setLoading(true);
    setError("");
    setTokenHoldings([]);
    setWalletInfo(null);
    
    try {
      // Fetch SPL tokens
      const response = await Moralis.SolApi.account.getSPL({
        network: "mainnet",
        address: walletAddress
      });
      
      // Fetch SOL balance
      const balanceResponse = await Moralis.SolApi.account.getBalance({
        network: "mainnet",
        address: walletAddress
      });
      
      // Calculate SOL balance as a number
      const solBalance = Number(balanceResponse.result.solana);
      
      // Get current SOL price from CoinGecko
      const solPrice = await getTokenPrice('SOL');
      const solValue = solBalance * solPrice;
      
      // Create holdings array, starting with SOL
      const holdings: TokenHolding[] = [{
        name: "Solana",
        symbol: "SOL",
        amount: solBalance.toFixed(9),
        value: solValue,
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        address: "So11111111111111111111111111111111111111112" // Native SOL wrapped address
      }];
      
      let totalWalletValue = solValue;
      
      // Process other tokens
      for (const token of response.result) {
        try {
          // Get token metadata
          const mintAddress = String(token.mint);
          
          // Skip tokens with 0 balance
          if (Number(token.amount) === 0) continue;
          
          const tokenResponse = await Moralis.SolApi.token.getTokenMetadata({
            network: "mainnet",
            address: mintAddress
          });
          
          // Get token metadata
          const metadata = tokenResponse.result as unknown as TokenMetadata;
          const symbol = metadata?.symbol || 'UNKNOWN';
          const decimals = Number(metadata?.decimals || 0);
          const tokenAmount = Number(token.amount) / (10 ** decimals);
          
          // Get real token price from CoinGecko if possible
          const tokenPrice = await getTokenPrice(symbol);
          
          // Calculate value
          const tokenValue = tokenAmount * tokenPrice;
          totalWalletValue += tokenValue;
          
          // Add to holdings
          holdings.push({
            name: metadata?.name || 'Unknown Token',
            symbol: symbol,
            amount: tokenAmount.toFixed(decimals > 9 ? 9 : decimals),
            value: tokenValue,
            logo: metadata?.logo,
            address: mintAddress
          });
        } catch (error) {
          console.error(`Error processing token ${token.mint}:`, error);
        }
      }
      
      // Sort by value (descending)
      holdings.sort((a, b) => b.value - a.value);
      
      // Set state
      setTokenHoldings(holdings);
      setTotalValue(totalWalletValue);
      setWalletInfo({
        address: walletAddress,
        solBalance: solBalance,
        tokenCount: holdings.length,
        totalValue: totalWalletValue
      });
      
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setError('Failed to analyze wallet. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Wallet Analysis</h2>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-400 mb-1">
              Wallet Address
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`flex items-center justify-center p-3 px-6 rounded-lg font-medium ${
                loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center">
                  Analyze Wallet <ArrowRightIcon className="ml-2 h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} suggestion="Check your wallet address and ensure it's a valid Solana address." />}
      
      {loading && <LoadingSpinner message="Analyzing wallet data..." />}

      {!loading && !error && !walletInfo && (
        <EmptyState 
          title="No Wallet Data"
          description="Enter a Solana wallet address to view portfolio analytics and holdings."
          icon={WalletIcon}
          actionButton={
            <button
              onClick={() => setWalletAddress('9SgVoGj2QLMrMy9CQg5wgRXJXSUXMNXwKvEf6WB9tbG3')} // Example Solana wallet
              className="text-violet-400 border border-violet-400/30 hover:bg-violet-400/10 rounded-md px-4 py-2 text-sm font-medium"
            >
              Try Example Wallet
            </button>
          }
        />
      )}
      
      {walletInfo && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Wallet Overview</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Wallet Address</p>
                    <p className="font-mono text-sm truncate">{walletInfo.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Value</p>
                      <p className="text-2xl font-bold">{formatValue(walletInfo.totalValue)}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm">SOL Balance</p>
                      <p className="text-2xl font-bold">{walletInfo.solBalance.toFixed(4)}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm">Token Count</p>
                      <p className="text-2xl font-bold">{walletInfo.tokenCount}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {tokenHoldings.length > 1 && (
                <div className="bg-gray-800 rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Portfolio Distribution</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatValue(value as number), "Value"]}
                          contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Token Holdings</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {tokenHoldings.map((token, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                                {token.logo ? (
                                  <img src={token.logo} alt={token.symbol} className="h-6 w-6 object-contain" />
                                ) : (
                                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{token.symbol}</div>
                                <div className="text-xs text-gray-400">{token.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="font-medium">{token.amount}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="font-medium">{formatValue(token.value)}</div>
                            <div className="text-xs text-gray-400">
                              {((token.value / totalValue) * 100).toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletAnalysis; 