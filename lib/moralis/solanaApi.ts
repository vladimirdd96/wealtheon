/**
 * Utility functions for interfacing with Moralis Solana API
 */

// Helper to get the base URL for API calls
// This helps ensure that both client and server-side code work correctly
function getBaseUrl() {
  // Check if we're running on the server or client
  if (typeof window === 'undefined') {
    // Server-side: we need a full URL
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }
  // Client-side: relative URLs are fine
  return '';
}

// Function to fetch a Solana wallet's native balance
export async function getSolanaBalance(address: string) {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/moralis/account/${address}/balance?network=mainnet&chain=solana`);
    
    if (!response.ok) {
      console.error(`Failed to fetch balance: ${response.status}`);
      return { solana: "0" }; // Return a safe default
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return { solana: "0" }; // Return a safe default
  }
}

// Function to fetch NFTs owned by a Solana wallet
export async function getSolanaNFTs(address: string, limit = 20) {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/moralis/account/${address}/nft?chain=solana&network=mainnet&limit=${limit}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch NFTs: ${response.status}`);
      return { result: [] }; // Return a safe default
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana NFTs:', error);
    return { result: [] }; // Return a safe default
  }
}

// Function to fetch token balances for a Solana wallet
export async function getSolanaTokens(address: string) {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/moralis/account/${address}/tokens?chain=solana&network=mainnet`);
    
    if (!response.ok) {
      console.error(`Failed to fetch tokens: ${response.status}`);
      return { tokens: [] }; // Return a safe default
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana tokens:', error);
    return { tokens: [] }; // Return a safe default
  }
}

// Function to fetch portfolio value (requires price data)
export async function getSolanaPortfolioValue(address: string) {
  try {
    // Get token balances
    const tokens = await getSolanaTokens(address);
    
    // Get token prices (this would need to be implemented based on Moralis API capabilities)
    // For now, we return a basic structure
    return {
      address,
      tokens: tokens.tokens || [],
      totalValue: 0, // This would be calculated with price data
    };
  } catch (error) {
    console.error('Error fetching Solana portfolio value:', error);
    throw error;
  }
}

// Function to fetch transaction history
export async function getSolanaTransactions(address: string, limit = 20) {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/moralis/sol/account/${address}/transfers?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana transactions:', error);
    throw error;
  }
} 