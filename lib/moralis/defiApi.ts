/**
 * Moralis DeFi API Functions
 * 
 * This file contains functions to interact with the Moralis DeFi API endpoints
 * for fetching DeFi protocol data, positions, and other DeFi-related information.
 */

const API_BASE_URL = '/api/moralis';

/**
 * Fetches a summary of DeFi protocols used by a wallet address
 */
export async function getWalletDefiSummary(address: string) {
  try {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    const response = await fetch(`${API_BASE_URL}/wallets/${address}/defi/summary`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch DeFi protocols summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching DeFi protocols summary:', error);
    throw error;
  }
}

/**
 * Fetches DeFi positions for a wallet address
 */
export async function getWalletDefiPositions(address: string) {
  try {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    const response = await fetch(`${API_BASE_URL}/wallets/${address}/defi/positions`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch DeFi positions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching DeFi positions:', error);
    throw error;
  }
}

/**
 * Fetches detailed DeFi positions for a specific protocol by wallet address
 */
export async function getWalletDefiPositionsByProtocol(address: string, protocol: string) {
  try {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    if (!protocol) {
      throw new Error('Protocol is required');
    }

    const response = await fetch(`${API_BASE_URL}/wallets/${address}/defi/${protocol}/positions`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch ${protocol} positions`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${protocol} positions:`, error);
    throw error;
  }
}

/**
 * Formats a DeFi position value to a readable format
 */
export function formatDefiPositionValue(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Calculates risk level based on protocol and position
 */
export function calculateRiskLevel(protocol: string, positionValue: number): 'Low' | 'Medium' | 'High' {
  // Risk assessment based on protocol and position size
  const lowRiskProtocols = ['aave', 'compound', 'lido', 'curve'];
  const highRiskProtocols = ['gmx', 'pancakeswap', 'uniswap'];
  
  if (lowRiskProtocols.includes(protocol.toLowerCase())) {
    return 'Low';
  } else if (highRiskProtocols.includes(protocol.toLowerCase())) {
    return positionValue > 10000 ? 'High' : 'Medium';
  } else {
    return 'Medium';
  }
}

/**
 * Estimates APY for a DeFi position based on protocol and token
 */
export function estimatePositionAPY(protocol: string, token: string): number {
  // These would be based on real data from the protocol in a production app
  const apyRanges: Record<string, Record<string, [number, number]>> = {
    'aave': {
      'default': [2, 4],
      'usdc': [3, 5],
      'eth': [1, 3],
      'dai': [3, 5],
    },
    'compound': {
      'default': [2, 5],
      'usdc': [3, 6],
      'eth': [1, 3],
    },
    'curve': {
      'default': [3, 8],
    },
    'uniswap': {
      'default': [5, 20],
    },
  };

  const protocolRange = apyRanges[protocol.toLowerCase()] || { 'default': [2, 10] };
  const tokenRange = protocolRange[token.toLowerCase()] || protocolRange['default'];
  
  // Realistic random value within the expected range for this protocol/token
  return tokenRange[0] + Math.random() * (tokenRange[1] - tokenRange[0]);
} 