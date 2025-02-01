'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { useWalletOperations } from '@/hooks/useWalletOperations';

export const Cleanup: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [emptyAccounts, setEmptyAccounts] = useState<{ pubkey: PublicKey, lamports: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecoverable, setTotalRecoverable] = useState(0);
  const { closeEmptyTokenAccounts } = useWalletOperations();

  const findEmptyAccounts = useCallback(async () => {
    if (!publicKey || !connection) return;

    setIsLoading(true);
    try {
      // Get all token accounts
      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      // Filter for empty accounts
      const emptyOnes = accounts.value.filter(acc => {
        const amount = acc.account.data.parsed.info.tokenAmount.amount;
        return amount === '0';
      }).map(acc => ({
        pubkey: acc.pubkey,
        lamports: acc.account.lamports,
      }));

      setEmptyAccounts(emptyOnes);
      const total = emptyOnes.reduce((sum, acc) => sum + acc.lamports, 0);
      setTotalRecoverable(total / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to find empty accounts:', error);
      toast.error('Failed to scan for empty accounts');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    findEmptyAccounts();
  }, [findEmptyAccounts]);

  const handleCleanup = async () => {
    if (!emptyAccounts.length) {
      toast.info('No empty accounts to clean up');
      return;
    }

    try {
      const result = await closeEmptyTokenAccounts(emptyAccounts);
      if (result.signature) {
        toast.success(
          <div>
            Successfully cleaned up {emptyAccounts.length} accounts!{' '}
            <a 
              href={`https://explorer.solana.com/tx/${result.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View in Explorer
            </a>
          </div>
        );
        // Refresh the list
        findEmptyAccounts();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to clean up accounts');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10">
      <div className="glass-card p-8 rounded-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient font-space-grotesk mb-2">
            Cleanup
          </h2>
          <p className="text-gray-400">Reclaim SOL from empty token accounts</p>
        </div>

        <div className="space-y-6">
          {!publicKey ? (
            <div className="flex justify-center mb-6">
              <WalletMultiButton className="!bg-[#2A2D3A]/80 hover:!bg-[#3A3D4A] !h-12 !rounded-xl animate-glow" />
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Scanning for empty accounts...</p>
                </div>
              ) : emptyAccounts.length > 0 ? (
                <>
                  <div className="bg-[#2A2D3A]/50 rounded-xl p-4">
                    <p className="text-lg mb-2">Found {emptyAccounts.length} empty account{emptyAccounts.length === 1 ? '' : 's'}</p>
                    <p className="text-sm text-gray-400">
                      Recoverable SOL: {totalRecoverable.toFixed(4)} SOL
                    </p>
                  </div>
                  <button
                    onClick={handleCleanup}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium 
                      hover:from-green-700 hover:to-emerald-700 transition-all duration-200 animate-glow"
                  >
                    Clean Up & Reclaim SOL
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No empty accounts found to clean up
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 