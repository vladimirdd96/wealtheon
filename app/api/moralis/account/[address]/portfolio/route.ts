import { NextRequest } from 'next/server';
import Moralis from 'moralis';
import { getSolanaBalance, getSolanaTokens } from '@/lib/moralis/solanaApi';

// Initialize Moralis
const initMoralis = async () => {
  if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
    throw new Error('Moralis API key not found');
  }
  
  try {
    // Check if Moralis is already initialized before trying to start it
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
      });
    }
  } catch (error) {
    console.error("Moralis initialization error:", error);
    
    // If there's an error about already being initialized, just continue
    if (error instanceof Error && error.message.includes('Modules are started already')) {
      console.log("Moralis is already initialized, continuing...");
    } else {
      throw error;
    }
  }
};

// Simplified route handler with only one parameter
export async function GET(request: NextRequest) {
  try {
    // Initialize Moralis
    await initMoralis();
    
    // Get the URL and extract address from the path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // For path /api/moralis/account/[address]/portfolio, the address will be at position 4
    const address = pathParts[4];
    const network = url.searchParams.get('network') || 'mainnet';
    const chain = url.searchParams.get('chain') || 'solana';
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch wallet data using Moralis
    try {
      // Get native balance (SOL)
      let nativeBalanceData;
      let tokensData;

      try {
        nativeBalanceData = await Moralis.SolApi.account.getBalance({
          network,
          address,
        });
      } catch (error: any) {
        console.error("Error fetching Solana balance:", error);
        
        // Provide fallback data if we get a 404
        if (error.message && (error.message.includes('404') || error.details?.status === 404)) {
          nativeBalanceData = { 
            toJSON: () => ({ 
              lamports: "0" 
            })
          };
        } else {
          throw error;
        }
      }
      
      // Get SPL tokens
      try {
        tokensData = await Moralis.SolApi.account.getSPL({
          network,
          address,
        });
      } catch (error: any) {
        console.error("Error fetching Solana tokens:", error);
        
        // Provide fallback data if we get a 404
        if (error.message && (error.message.includes('404') || error.details?.status === 404)) {
          tokensData = { 
            toJSON: () => ({ 
              result: [] 
            })
          };
        } else {
          throw error;
        }
      }
      
      // Get portfolio value
      const portfolio = await calculatePortfolioValue(nativeBalanceData.toJSON(), tokensData.toJSON());
      
      // Generate historical portfolio value (for demonstration)
      const portfolioHistory = await getHistoricalPortfolioValue(address, portfolio);
      
      // Get asset performance data
      const assetPerformance = await getAssetPerformance(portfolio.tokens);
      
      // Calculate risk score based on real allocation
      const riskScore = calculateRiskScore(portfolio.currentAllocation);
      
      // Combine all data
      const portfolioData = {
        totalValue: portfolio.totalValue,
        currentAllocation: portfolio.currentAllocation,
        portfolioHistory,
        assetPerformance,
        tokens: portfolio.tokens,
        riskScore
      };
      
      return new Response(
        JSON.stringify(portfolioData),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (walletError: any) {
      console.error("Error fetching wallet data from Moralis:", walletError);
      return new Response(
        JSON.stringify({ error: `Error fetching wallet data: ${walletError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error("Error in portfolio API route:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch portfolio data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to get price data from CoinGecko
async function getTokenPrice(symbol: string) {
  try {
    const coingeckoId = getCoingeckoId(symbol);
    if (!coingeckoId) return null;
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data[coingeckoId]?.usd || null;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return null;
  }
}

// Map token symbols to CoinGecko IDs
function getCoingeckoId(symbol: string): string | null {
  const mapping: Record<string, string> = {
    'sol': 'solana',
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdc': 'usd-coin',
    'usdt': 'tether',
    'bnb': 'binancecoin',
    'ada': 'cardano',
    'dot': 'polkadot',
    'doge': 'dogecoin',
    'xrp': 'ripple',
    'uni': 'uniswap',
    'link': 'chainlink',
    'luna': 'terra-luna',
    'avax': 'avalanche-2',
    'matic': 'matic-network',
    'aave': 'aave',
    'cake': 'pancakeswap-token',
    'sushi': 'sushi',
    'ftx': 'ftx-token',
    'crv': 'curve-dao-token',
    'comp': 'compound-governance-token',
    'snx': 'havven',
    'yfi': 'yearn-finance',
    'mkr': 'maker',
    'dai': 'dai',
  };
  
  const lowerSymbol = symbol.toLowerCase();
  return mapping[lowerSymbol] || null;
}

// Calculate portfolio value from data
async function calculatePortfolioValue(balanceData: any, tokensData: any) {
  let totalValue = 0;
  let allocation: any[] = [];
  const tokensList: any[] = [];
  const categoryValues: Record<string, number> = {
    "Stablecoins": 0,
    "Major Cryptos": 0,
    "DeFi Tokens": 0,
    "NFTs": 0,
    "Cash": 0,
    "Other Tokens": 0
  };
  
  try {
    // Process native SOL
    const solBalance = balanceData && balanceData.lamports 
      ? parseFloat(balanceData.lamports) / 1e9 
      : 0;
    
    // Get SOL price from CoinGecko
    let solPrice = await getTokenPrice('sol') || 0;
    
    // If we couldn't get the price, use a reasonable default
    if (!solPrice) {
      solPrice = 100; // Default SOL price
    }
    
    const solValue = solBalance * solPrice;
    totalValue += solValue;
    
    // Only add token to the list if balance is non-zero
    if (solBalance > 0) {
      tokensList.push({
        name: 'Solana',
        symbol: 'SOL',
        address: 'native',
        balance: solBalance,
        price: solPrice,
        value: solValue
      });
      
      // Add SOL to Major Cryptos category
      categoryValues["Major Cryptos"] += solValue;
    }
    
    // Process SPL tokens
    if (tokensData && tokensData.result && tokensData.result.length > 0) {
      // For all tokens
      for (const token of tokensData.result) {
        try {
          // Skip tokens without amount
          if (!token.amount) continue;
          
          // Get token symbol in lowercase for comparison
          const symbol = token.symbol?.toLowerCase() || '';
          
          // Try to determine token price from CoinGecko
          let tokenPrice = await getTokenPrice(symbol) || 0;
          
          // For stablecoins, assume $1
          if (symbol.includes('usd') || symbol === 'usdt' || symbol === 'usdc' || symbol === 'dai') {
            tokenPrice = 1;
          } 
          // For unknown tokens, use a small default value
          else if (!tokenPrice) {
            tokenPrice = 0.01;
          }
          
          // Calculate token value
          const decimals = token.decimals || 0;
          const balance = parseFloat(token.amount) / Math.pow(10, decimals);
          const value = balance * tokenPrice;
          
          // Only include tokens with real value
          if (value > 0 && balance > 0) {
            tokensList.push({
              name: token.name || token.symbol,
              symbol: token.symbol,
              address: token.address,
              balance: balance,
              price: tokenPrice,
              value: value
            });
            
            totalValue += value;
            
            // Categorize token
            let category = "Other Tokens";
            const upperSymbol = token.symbol?.toUpperCase() || '';
            
            if (upperSymbol.includes('USD') || upperSymbol === 'USDT' || upperSymbol === 'USDC' || upperSymbol === 'DAI') {
              category = "Stablecoins";
            } else if (['BTC', 'ETH', 'SOL', 'MSOL', 'BNB', 'ADA', 'DOT', 'AVAX'].includes(upperSymbol)) {
              category = "Major Cryptos";
            } else if (['AAVE', 'UNI', 'COMP', 'SUSHI', 'CRV', 'MKR', 'YFI', 'SNX', 'LINK', 'CAKE'].includes(upperSymbol)) {
              category = "DeFi Tokens";
            }
            
            // Add to category total
            categoryValues[category] += value;
          }
        } catch (tokenError) {
          console.error(`Error processing token ${token.symbol}:`, tokenError);
          continue;
        }
      }
    }
    
    // Convert category values to allocation array with percentages
    const categoryColors: Record<string, string> = {
      "Stablecoins": "#8884d8",
      "Major Cryptos": "#82ca9d",
      "DeFi Tokens": "#ffc658",
      "NFTs": "#ff8042",
      "Cash": "#0088fe",
      "Other Tokens": "#ba68c8"
    };
    
    for (const [category, value] of Object.entries(categoryValues)) {
      if (value > 0 || category === "Major Cryptos" || category === "Stablecoins") {
        allocation.push({
          name: category,
          value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
          absoluteValue: value,
          color: categoryColors[category]
        });
      }
    }
    
    return {
      totalValue,
      currentAllocation: allocation,
      tokens: tokensList
    };
  } catch (error) {
    console.error("Error calculating portfolio value:", error);
    throw error;
  }
}

// Generate historical portfolio value
async function getHistoricalPortfolioValue(address: string, portfolio: any) {
  try {
    // For demonstration, generate based on BTC historical performance
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${Math.floor(sixMonthsAgo.getTime()/1000)}&to=${Math.floor(today.getTime()/1000)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical price data');
      }
      
      const data = await response.json();
      
      // Process to monthly data
      const monthlyData = processHistoricalDataToMonthly(data.prices);
      
      // Create portfolio history based on BTC performance with the current total value
      const portfolioHistory = monthlyData.map(point => {
        const monthDate = new Date(point.timestamp);
        return {
          name: monthDate.toLocaleString('default', { month: 'short' }),
          value: simulatePortfolioValue(point.price, portfolio.totalValue)
        };
      });
      
      return portfolioHistory;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      
      // Fallback to simulated data
      return generateSimulatedHistory(portfolio.totalValue);
    }
  } catch (error) {
    console.error("Error generating historical portfolio value:", error);
    return generateSimulatedHistory(portfolio.totalValue);
  }
}

// Process historical price data to monthly data points
function processHistoricalDataToMonthly(priceData: [number, number][]) {
  const monthlyData: { timestamp: number; price: number }[] = [];
  const months: { [key: string]: { timestamp: number; price: number } } = {};
  
  // Group by month
  priceData.forEach(([timestamp, price]) => {
    const date = new Date(timestamp);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!months[monthKey] || date.getDate() === 15) { // Use mid-month price
      months[monthKey] = { timestamp, price };
    }
  });
  
  // Convert to array and sort
  Object.values(months).forEach(data => {
    monthlyData.push(data);
  });
  
  // Sort by timestamp
  monthlyData.sort((a, b) => a.timestamp - b.timestamp);
  
  // Take the most recent 6 months (or whatever is available)
  return monthlyData.slice(-6);
}

// Simulate portfolio value based on BTC price
function simulatePortfolioValue(btcPrice: number, currentTotalValue: number) {
  // Get the current BTC price
  const currentBtcPrice = 65000; // Approximate current BTC price
  
  // Scale the portfolio value based on BTC price ratio
  return Math.round(currentTotalValue * (btcPrice / currentBtcPrice));
}

// Generate simulated portfolio history when API fails
function generateSimulatedHistory(currentValue: number) {
  const today = new Date();
  const history = [];
  
  // Generate 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = monthDate.toLocaleString('default', { month: 'short' });
    
    // Start with 70% of current value 6 months ago and gradually increase
    const factor = 0.7 + (0.3 * (5 - i) / 5);
    // Add some randomness for realism
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    history.push({
      name: monthName,
      value: Math.round(currentValue * factor * randomFactor)
    });
  }
  
  return history;
}

// Get asset performance data
async function getAssetPerformance(tokens: any[]): Promise<{ name: string; performance: number }[]> {
  try {
    // Get market data from CoinGecko for major tokens
    const symbols = tokens.map(token => token.symbol.toLowerCase()).slice(0, 10);
    const uniqueSymbols = Array.from(new Set(symbols));
    
    const coingeckoIds = uniqueSymbols
      .map(symbol => getCoingeckoId(symbol))
      .filter(id => id !== null) as string[];
    
    if (coingeckoIds.length === 0) {
      return generateSimulatedPerformance(tokens);
    }
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coingeckoIds.join(',')}&price_change_percentage=30d`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const marketData = await response.json();
      
      // Match tokens to their performance
      const performanceData = tokens
        .slice(0, 5) // Limit to top 5 tokens by value
        .map(token => {
          const coingeckoId = getCoingeckoId(token.symbol.toLowerCase());
          const marketInfo = marketData.find((coin: any) => coin.id === coingeckoId);
          
          return {
            name: token.symbol.toUpperCase(),
            performance: marketInfo?.price_change_percentage_30d_in_currency !== null && marketInfo?.price_change_percentage_30d_in_currency !== undefined
              ? parseFloat(marketInfo.price_change_percentage_30d_in_currency.toFixed(1))
              : generateSimulatedPerformance([token])[0].performance
          };
        });
      
      return performanceData;
    } catch (error) {
      console.error("Error fetching market data:", error);
      return generateSimulatedPerformance(tokens);
    }
  } catch (error) {
    console.error("Error getting asset performance:", error);
    return generateSimulatedPerformance(tokens);
  }
}

// Generate simulated performance data when API fails
function generateSimulatedPerformance(tokens: any[]): { name: string; performance: number }[] {
  return tokens
    .slice(0, 5)
    .map(token => ({
      name: token.symbol.toUpperCase(),
      performance: parseFloat((Math.random() * 40 - 20).toFixed(1)) // Between -20% and +20%
    }));
}

// Get color for a specific category
function getColorForCategory(category: string): string {
  const colors: Record<string, string> = {
    "Stablecoins": "#8884d8",
    "Major Cryptos": "#82ca9d",
    "DeFi Tokens": "#ffc658",
    "NFTs": "#ff8042",
    "Cash": "#0088fe",
    "Other Tokens": "#ba68c8"
  };
  
  return colors[category] || "#9c9c9c";
}

// Calculate risk score
function calculateRiskScore(allocation: any[]): number {
  // Risk factors for each category (0-100 scale)
  const riskFactors: Record<string, number> = {
    "Stablecoins": 20,
    "Major Cryptos": 60,
    "DeFi Tokens": 80,
    "NFTs": 90,
    "Cash": 10,
    "Other Tokens": 70
  };
  
  // Calculate weighted risk score
  let weightedRiskScore = 0;
  let totalWeight = 0;
  
  allocation.forEach(asset => {
    const riskFactor = riskFactors[asset.name] || 50;
    const weight = asset.value;
    
    weightedRiskScore += weight * riskFactor;
    totalWeight += weight;
  });
  
  // Normalize to 0-100 scale
  const normalizedScore = totalWeight > 0 ? Math.round(weightedRiskScore / totalWeight) : 50;
  
  // Keep within boundaries
  return Math.min(Math.max(normalizedScore, 10), 90);
} 