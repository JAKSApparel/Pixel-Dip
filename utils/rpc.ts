import { Connection, Cluster } from '@solana/web3.js';

const FALLBACK_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com'
];

let currentEndpointIndex = 0;
let currentConnection: Connection | null = null;

export const getConnection = async (cluster: Cluster = 'mainnet-beta'): Promise<Connection> => {
  // If we have a working connection, return it
  if (currentConnection) {
    try {
      await currentConnection.getVersion();
      return currentConnection;
    } catch {
      // Connection failed, will try next endpoint
      currentConnection = null;
    }
  }

  // Try custom RPC first if available
  if (process.env.NEXT_PUBLIC_RPC_URL) {
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL, 'confirmed');
      await connection.getVersion();
      currentConnection = connection;
      return connection;
    } catch {
      console.warn('Custom RPC failed, falling back to public endpoints');
    }
  }

  // Try fallback endpoints
  while (currentEndpointIndex < FALLBACK_ENDPOINTS.length) {
    try {
      const connection = new Connection(FALLBACK_ENDPOINTS[currentEndpointIndex], 'confirmed');
      await connection.getVersion();
      currentConnection = connection;
      return connection;
    } catch {
      currentEndpointIndex = (currentEndpointIndex + 1) % FALLBACK_ENDPOINTS.length;
    }
  }

  throw new Error('All RPC endpoints failed');
};

export const resetConnection = () => {
  currentConnection = null;
  currentEndpointIndex = 0;
};

// RPC health check
export const checkRPCHealth = async (connection: Connection): Promise<boolean> => {
  try {
    const version = await connection.getVersion();
    return version['solana-core'] !== undefined;
  } catch {
    return false;
  }
}; 