'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createBurnCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createCloseAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { Flame, Coins, Trash2, ArrowRight } from 'lucide-react';
import { BurnType, TokenInfo, TokenAccount } from '@/types';
import { getTokenInfo, getTokenAccounts } from '@/utils/token';
import { useWalletOperations } from '@/hooks/useWalletOperations';
import { toast } from 'sonner';
import { TokenCard, TokenCardSkeleton } from '@/components/TokenCard';

const BURN_FEE = 0.001; // 0.001 SOL

type ActionType = 'burn' | 'transfer' | 'sol';

export const Incinerator: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [actionType, setActionType] = useState<ActionType>('burn');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [showNFTs, setShowNFTs] = useState(false);
  const [showTokens, setShowTokens] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isValidRecipient, setIsValidRecipient] = useState(false);
  const [isBurnAddress, setIsBurnAddress] = useState(false);

  const { handleBurnToken } = useWalletOperations();

  const handleTokenAddressChange = async (address: string) => {
    setTokenAddress(address);
    if (address.length === 44 || address.length === 43) {
      try {
        const connection = new Connection(
          process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
        );
        const mintPubkey = new PublicKey(address);
        const tokenAccountInfo = await connection.getParsedAccountInfo(mintPubkey);
        
        if (tokenAccountInfo.value) {
          const info = (tokenAccountInfo.value.data as any).parsed.info;
          const supply = info.supply ? Number(info.supply) : undefined;
          const isNFT = supply === 1 && info.decimals === 0;
          
          setTokenInfo({
            mint: address,
            decimals: info.decimals,
            supply,
            isNFT
          });

          // Auto-switch to NFT mode if detected
          if (isNFT) {
            setActionType('burn');
            setAmount('1');
          }
        }
      } catch (error) {
        console.error('Invalid token address:', error);
        setTokenInfo(null);
      }
    } else {
      setTokenInfo(null);
    }
  };

  const handleCleanup = async () => {
    if (!publicKey || (!amount && actionType !== 'serum') || (!tokenAddress && actionType !== 'serum')) {
      toast.error('Please connect wallet and provide required information');
      return;
    }
    
    setLoading(true);
    try {
      switch (actionType) {
        case 'token':
        case 'nft': {
          const mintPubkey = new PublicKey(tokenAddress);
          const amountToSend = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenInfo?.decimals || 0)));
          
          const selectedToken = tokenAccounts.find(t => t.mint === tokenAddress);
          if (!selectedToken) {
            throw new Error('Token not found in wallet');
          }

          const result = await handleBurnToken(
            selectedToken.tokenAccount,
            mintPubkey,
            amountToSend,
            selectedToken.decimals
          );

          if (result.error) {
            throw new Error(result.error);
          }

          toast.success(`Successfully burned tokens! Signature: ${result.signature}`);
          break;
        }
        
        case 'lp': {
          const lpPubkey = new PublicKey(tokenAddress);
          const associatedTokenAddress = await getAssociatedTokenAddress(lpPubkey, publicKey);

          // Remove liquidity first (you'll need to implement this based on the specific DEX)
          // transaction.add(removeLiquidityInstruction(...));

          // Then close the LP token account
          const transaction = new Transaction();
          transaction.add(
            createCloseAccountInstruction(
              associatedTokenAddress,
              publicKey,
              publicKey
            )
          );

          const signature = await sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, 'confirmed');
          break;
        }

        case 'serum': {
          // Close open orders accounts
          // You'll need to implement this based on the specific market
          // transaction.add(closeOpenOrdersInstruction(...));
          break;
        }
      }

      setAmount('');
      setTokenAddress('');
      setTokenInfo(null);
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

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

  const handleTransfer = async () => {
    if (!publicKey || !amount || !tokenAddress || !recipientAddress) {
      toast.error('Please provide all required information');
      return;
    }

    setLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const mintPubkey = new PublicKey(tokenAddress);
      const amountToSend = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenInfo?.decimals || 0)));
      
      const selectedToken = tokenAccounts.find(t => t.mint === tokenAddress);
      if (!selectedToken) {
        throw new Error('Token not found in wallet');
      }

      // Get or create recipient's associated token account
      const recipientATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
      
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          selectedToken.tokenAccount,
          recipientATA,
          publicKey,
          amountToSend
        )
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success(`Successfully transferred tokens! Signature: ${signature}`);
      setAmount('');
      setTokenAddress('');
      setTokenInfo(null);
      setRecipientAddress('');
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(error instanceof Error ? error.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSolTransfer = async () => {
    if (!publicKey || !amount || !recipientAddress) {
      toast.error('Please provide amount and recipient address');
      return;
    }

    setLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success(`Successfully transferred ${amount} SOL! Signature: ${signature}`);
      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error('SOL transfer failed:', error);
      toast.error(error instanceof Error ? error.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchTokenAccounts() {
      if (!publicKey) {
        setTokenAccounts([]);
        return;
      }

      setIsLoadingTokens(true);
      try {
        const tokens = await getTokenAccounts(connection, publicKey);
        const enhancedTokens = await Promise.all(
          tokens.map(token => getEnhancedTokenMetadata(connection, token))
        );
        setTokenAccounts(enhancedTokens);
      } catch (error) {
        console.error('Error fetching token accounts:', error);
        toast.error('Failed to load tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchTokenAccounts();
  }, [publicKey, connection]);

  const handleTokenSelect = (token: EnhancedTokenMetadata) => {
    setTokenAddress(token.mint);
    setAmount(token.uiAmount.toString());
    setActionType(token.isNFT ? 'burn' : 'token');
    setTokenInfo({
      mint: token.mint,
      decimals: token.decimals,
      supply: token.amount,
      isNFT: token.isNFT
    });
  };

  const estimateRentReclaim = async (token: TokenAccount) => {
    if (!connection || !publicKey) return 0;
    try {
      const accountInfo = await connection.getAccountInfo(token.tokenAccount);
      return accountInfo?.lamports || 0;
    } catch (error) {
      console.error('Failed to estimate rent:', error);
      return 0;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="glass-card p-8 rounded-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient font-space-grotesk mb-2">
            Soul Crusher
          </h2>
          <p className="text-gray-400">Obliterate or transfer unwanted tokens</p>
        </div>

        <div className="space-y-6">
          {!publicKey && (
            <div className="flex justify-center mb-6">
              <WalletMultiButton className="!bg-[#2A2D3A]/80 hover:!bg-[#3A3D4A] !h-12 !rounded-xl animate-glow" />
            </div>
          )}
          
          {publicKey && (
            <>
              {/* Action Type Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setActionType('burn')}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    actionType === 'burn' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-[#2A2D3A] text-gray-400 hover:bg-[#3A3D4A]'
                  }`}
                >
                  <Flame className="w-6 h-6 mx-auto mb-2" />
                  <span>Burn Tokens</span>
                </button>
                <button
                  onClick={() => setActionType('transfer')}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    actionType === 'transfer' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-[#2A2D3A] text-gray-400 hover:bg-[#3A3D4A]'
                  }`}
                >
                  <ArrowRight className="w-6 h-6 mx-auto mb-2" />
                  <span>Transfer Tokens</span>
                </button>
                <button
                  onClick={() => setActionType('sol')}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    actionType === 'sol' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-[#2A2D3A] text-gray-400 hover:bg-[#3A3D4A]'
                  }`}
                >
                  <Coins className="w-6 h-6 mx-auto mb-2" />
                  <span>Transfer SOL</span>
                </button>
              </div>

              {actionType !== 'serum' && (
                <div>
                  <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-300 mb-2">
                    {actionType === 'lp' ? 'LP Token Address' : `${actionType.toUpperCase()} Address`}
                  </label>
                  <input
                    id="tokenAddress"
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => handleTokenAddressChange(e.target.value)}
                    className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Enter ${actionType.toUpperCase()} address`}
                  />
                  {tokenInfo && (
                    <p className="mt-2 text-sm text-green-400">
                      ✓ Valid {tokenInfo.isNFT ? 'NFT' : 'token'} 
                      {tokenInfo.decimals !== undefined && !tokenInfo.isNFT && ` with ${tokenInfo.decimals} decimals`}
                    </p>
                  )}
                </div>
              )}

              {actionType !== 'serum' && actionType !== 'nft' && (
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Burn
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter amount"
                    min="0"
                    max={tokenAccounts.find(t => t.mint === tokenAddress)?.uiAmount || 0}
                    step="any"
                  />
                </div>
              )}
              
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Your Assets</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNFTs(prev => !prev)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showNFTs ? 'bg-purple-600 text-white' : 'bg-[#2A2D3A] text-gray-400'
                      }`}
                    >
                      NFTs
                    </button>
                    <button
                      onClick={() => setShowTokens(prev => !prev)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showTokens ? 'bg-purple-600 text-white' : 'bg-[#2A2D3A] text-gray-400'
                      }`}
                    >
                      Tokens
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto rounded-lg">
                  {isLoadingTokens ? (
                    Array(3).fill(0).map((_, i) => (
                      <TokenCardSkeleton key={i} />
                    ))
                  ) : tokenAccounts.length > 0 ? (
                    tokenAccounts
                      .filter(token => (showNFTs ? token.isNFT : !token.isNFT))
                      .map((token) => {
                        const rentEstimate = estimateRentReclaim(token);
                        const userShare = rentEstimate * (1 - PLATFORM_FEE_SHARE);
                        
                        return (
                          <TokenCard
                            key={token.mint}
                            token={token}
                            isSelected={token.mint === tokenAddress}
                            onSelect={handleTokenSelect}
                            rentInfo={
                              <div className="text-xs text-gray-400 mt-2">
                                <p>Estimated SOL to reclaim: {(userShare / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
                                <p className="text-xs opacity-75">
                                  (Platform fee: {PLATFORM_FEE/LAMPORTS_PER_SOL} SOL + {(PLATFORM_FEE_SHARE * 100)}% of rent)
                                </p>
                              </div>
                            }
                          />
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No {showNFTs ? 'NFTs' : 'tokens'} found in wallet
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                <p>Fee: {BURN_FEE} SOL per transaction</p>
              </div>

              {actionType === 'transfer' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="burnAddress"
                      checked={isBurnAddress}
                      onChange={(e) => {
                        setIsBurnAddress(e.target.checked);
                        if (e.target.checked) {
                          setRecipientAddress(BURN_ADDRESSES.BLACK_HOLE.toString());
                          setIsValidRecipient(true);
                        } else {
                          setRecipientAddress('');
                          setIsValidRecipient(false);
                        }
                      }}
                      className="rounded border-gray-700 bg-[#2A2D3A] text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="burnAddress" className="text-sm text-gray-300">
                      Use burn address (permanently destroys tokens)
                    </label>
                  </div>
                  
                  {!isBurnAddress && (
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
                  )}
                </div>
              )}

              {actionType === 'sol' && (
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
                </>
              )}

              <button
                onClick={
                  actionType === 'burn' 
                    ? handleCleanup 
                    : actionType === 'sol' 
                      ? handleSolTransfer 
                      : handleTransfer
                }
                disabled={loading || !amount || (actionType !== 'sol' && !tokenAddress) || (actionType !== 'burn' && !isValidRecipient)}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium 
                  hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
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
                  actionType === 'sol' 
                    ? `Send ${amount} SOL`
                    : `${actionType === 'burn' ? 'Burn' : 'Transfer'} ${amount} ${tokenInfo?.isNFT ? 'NFT' : 'tokens'}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 