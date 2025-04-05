/**
 * Utility functions for interfacing with Moralis Solana API
 */

// Function to fetch a Solana wallet's native balance
export async function getSolanaBalance(address: string) {
  try {
    const response = await fetch(`/api/moralis/sol/account/${address}/balance`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    throw error;
  }
}

// Function to fetch NFTs owned by a Solana wallet
export async function getSolanaNFTs(address: string, limit = 20) {
  try {
    const response = await fetch(`/api/moralis/sol/account/${address}/nft?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch NFTs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana NFTs:', error);
    throw error;
  }
}

// Function to fetch token balances for a Solana wallet
export async function getSolanaTokens(address: string) {
  try {
    const response = await fetch(`/api/moralis/sol/account/${address}/tokens`);
    if (!response.ok) throw new Error('Failed to fetch tokens');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana tokens:', error);
    throw error;
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
    const response = await fetch(`/api/moralis/sol/account/${address}/transfers?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Solana transactions:', error);
    throw error;
  }
} 