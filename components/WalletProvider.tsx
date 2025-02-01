'use client';

import { FC, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import '../app/wallet.css';

type Props = {
  children: ReactNode;
};

// List of backup RPC endpoints for devnet
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  'https://api.devnet.solana.com',
  'https://devnet.helius-rpc.com/?api-key=15319bf4-5b40-4958-ac8d-6313aa55eb92',
  clusterApiUrl('devnet'),
].filter(Boolean) as string[];

const connectionConfig = {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  httpHeaders: {
    'Content-Type': 'application/json',
  },
};

const WalletProviderComponent: FC<Props> = ({ children }) => {
  const [endpoint, setEndpoint] = useState(RPC_ENDPOINTS[0]);

  // Test and set working endpoint
  useEffect(() => {
    async function testEndpoints() {
      for (const rpc of RPC_ENDPOINTS) {
        try {
          const conn = new Connection(rpc, connectionConfig);
          await conn.getSlot();
          setEndpoint(rpc);
          console.log('Connected to:', rpc);
          return;
        } catch (err) {
          console.warn(`Failed to connect to ${rpc}:`, err);
        }
      }
    }
    testEndpoints();
  }, []);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Handle wallet errors
  const onError = useCallback((error: Error | null) => {
    if (error?.message?.includes('User rejected')) {
      // User cancelled - no need to show error
      return;
    }
    
    toast.error(
      error instanceof Error ? error.message : 'Failed to connect wallet'
    );
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false} // Disable auto-connect
        onError={onError}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const SolanaWalletProvider = dynamic(
  () => Promise.resolve(WalletProviderComponent),
  {
    ssr: false,
  }
);

export default SolanaWalletProvider; 