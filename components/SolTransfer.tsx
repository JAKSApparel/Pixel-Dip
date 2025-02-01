'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Commitment } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';

// Configuration
const TX_TIMEOUT = 120000; // 120 seconds
const COMMITMENT: Commitment = 'confirmed';
const MAX_RETRIES = 40; // More retries with shorter intervals
const RETRY_INTERVAL = 2000; // 2 seconds between retries
const PLATFORM_ADDRESS = new PublicKey(process.env.NEXT_PUBLIC_FEE_COLLECTOR || '11111111111111111111111111111111');
const PLATFORM_FEE = 0.001 * LAMPORTS_PER_SOL;

export const SolTransfer: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isValidRecipient, setIsValidRecipient] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        console.log('Connected to network:', genesisHash);
        // Mainnet genesis hash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'
        // Devnet genesis hash: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
      } catch (error) {
        console.error('Failed to check network:', error);
      }
    };
    
    if (publicKey) {
      checkNetwork();
    }
  }, [connection, publicKey]);

  const validateRecipientAddress = useCallback(async (address: string) => {
    try {
      const pubkey = new PublicKey(address);
      setIsValidRecipient(true);
      return true;
    } catch {
      setIsValidRecipient(false);
      return false;
    }
  }, []);

  const confirmTransaction = async (signature: string): Promise<boolean> => {
    let retries = 0;
    const startTime = Date.now();
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await connection.getSignatureStatus(signature);
        
        const confirmation = response.value;
        if (confirmation?.confirmationStatus === COMMITMENT) {
          return true;
        }
        
        if (confirmation?.err) {
          throw new Error('Transaction failed: ' + JSON.stringify(confirmation.err));
        }

        // Check for timeout
        if (Date.now() - startTime > TX_TIMEOUT) {
          throw new Error('Transaction confirmation timeout');
        }

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        retries++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          throw error;
        }
        console.warn(`Retry ${retries + 1}/${MAX_RETRIES}:`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        retries++;
      }
    }
    
    // After all retries, check one last time
    const finalStatus = await connection.getSignatureStatus(signature);
    if (finalStatus.value?.confirmationStatus === COMMITMENT) {
      return true;
    }

    throw new Error(`Transaction not confirmed after ${MAX_RETRIES} retries. Please check explorer: https://explorer.solana.com/tx/${signature}`);
  };

  const handleSolTransfer = async () => {
    if (!publicKey || !amount || !recipientAddress) {
      toast.error('Please provide amount and recipient address');
      return;
    }

    setLoading(true);
    let signature = '';
    
    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      // Check balance with retries
      let balance = 0;
      try {
        balance = await connection.getBalance(publicKey, COMMITMENT);
        console.log('Current balance:', balance / LAMPORTS_PER_SOL, 'SOL');
      } catch (balanceError) {
        console.error('Failed to get balance:', balanceError);
        throw new Error('Unable to fetch wallet balance. Please try again.');
      }

      const totalCost = lamports + PLATFORM_FEE;
      
      if (balance < totalCost) {
        throw new Error(
          `Insufficient balance. You have ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL, ` +
          `need ${(totalCost / LAMPORTS_PER_SOL).toFixed(4)} SOL (including ${(PLATFORM_FEE / LAMPORTS_PER_SOL).toFixed(3)} SOL fee)`
        );
      }

      // Get recent blockhash with retries
      let latestBlockhash;
      try {
        latestBlockhash = await connection.getLatestBlockhash('confirmed');
      } catch (blockHashError) {
        console.error('Failed to get blockhash:', blockHashError);
        throw new Error('Network error. Please try again.');
      }

      const transaction = new Transaction({
        feePayer: publicKey,
        ...latestBlockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      ).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PLATFORM_ADDRESS,
          lamports: PLATFORM_FEE,
        })
      );

      // Add recentBlockhash and sign the transaction
      transaction.recentBlockhash = latestBlockhash.blockhash;
      
      // Send transaction
      signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: COMMITMENT,
        maxRetries: 3,
      });

      // Show pending toast
      toast.loading(
        <div>
          Transaction pending...{' '}
          <a 
            href={`https://explorer.solana.com/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View in Explorer
          </a>
        </div>,
        { duration: Infinity }
      );

      // Wait for confirmation
      await confirmTransaction(signature);

      // Dismiss loading toast
      toast.dismiss();

      // Success toast
      toast.success(
        <div>
          Successfully sent {amount} SOL!{' '}
          <a 
            href={`https://explorer.solana.com/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View in Explorer
          </a>
        </div>
      );

      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error('SOL transfer failed:', error);
      
      // Dismiss any pending loading toasts
      toast.dismiss();
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error(
            <div>
              Transaction may be pending. Please check{' '}
              <a 
                href={`https://explorer.solana.com/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Explorer
              </a>
            </div>
          );
        } else if (error.message.includes('Insufficient balance')) {
          toast.error(error.message);
        } else if (error.message.includes('User rejected')) {
          toast.error('Transaction cancelled by user');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Transfer failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="glass-card p-8 rounded-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient font-space-grotesk mb-2">
            SOL Transfer
          </h2>
          <p className="text-gray-400">Send SOL to any wallet</p>
        </div>

        <div className="space-y-6">
          {!publicKey ? (
            <div className="flex justify-center mb-6">
              <WalletMultiButton className="!bg-[#2A2D3A]/80 hover:!bg-[#3A3D4A] !h-12 !rounded-xl animate-glow" />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (SOL)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter SOL amount"
                  min="0"
                  step="any"
                />
              </div>

              <div>
                <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Wallet Address
                </label>
                <input
                  id="recipientAddress"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    validateRecipientAddress(e.target.value);
                  }}
                  className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter recipient's Solana address"
                />
                {recipientAddress && (
                  <p className={`mt-2 text-sm ${isValidRecipient ? 'text-green-400' : 'text-red-400'}`}>
                    {isValidRecipient ? '✓ Valid address' : '✗ Invalid address'}
                  </p>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-400">
                <p>Platform fee: {PLATFORM_FEE / LAMPORTS_PER_SOL} SOL per transaction</p>
              </div>

              <button
                onClick={handleSolTransfer}
                disabled={loading || !amount || !isValidRecipient}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium 
                  hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                  animate-glow font-space-grotesk"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Send ${amount} SOL`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 