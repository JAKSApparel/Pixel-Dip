'use client';

import { MessageCircle, Home, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { usePathname } from 'next/navigation';

// Dynamically import the WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function Header() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
  const previousBalance = useRef<number | null>(null);

  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const getBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      console.log('No wallet connected or no connection');
      setBalance(null);
      previousBalance.current = null;
      return;
    }

    setIsLoading(true);
    try {
      // Get multiple confirmations of the balance
      const [balance, confirmedBalance] = await Promise.all([
        connection.getBalance(publicKey, 'finalized'),
        connection.getBalance(publicKey, 'confirmed')
      ]);

      // Use the most recent confirmed balance
      const finalBalance = Math.max(balance, confirmedBalance) / LAMPORTS_PER_SOL;
      
      console.log({
        address: publicKey.toString(),
        finalizedBalance: balance / LAMPORTS_PER_SOL,
        confirmedBalance: confirmedBalance / LAMPORTS_PER_SOL,
        usingBalance: finalBalance
      });

      // Update state only if component is still mounted
      if (previousBalance.current !== null) {
        setIsIncreasing(finalBalance > previousBalance.current);
      }
      previousBalance.current = finalBalance;
      setBalance(finalBalance);

    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsIncreasing(null), 1000);
    }
  }, [connection, publicKey]);

  // Add network check on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (connection) {
        try {
          const version = await connection.getVersion();
          console.log('Solana connection version:', version);
          const slot = await connection.getSlot();
          console.log('Current slot:', slot);
        } catch (error) {
          console.error('Connection check failed:', error);
        }
      }
    };
    
    checkConnection();
  }, [connection]);

  // Add network check and balance subscription
  useEffect(() => {
    if (!connection || !publicKey) return;

    getBalance();

    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
        if (previousBalance.current !== null) {
          setIsIncreasing(newBalance > previousBalance.current);
        }
        previousBalance.current = newBalance;
        setBalance(newBalance);
      },
      'confirmed'
    );

    // Poll for balance changes as backup
    const intervalId = setInterval(getBalance, 20000);

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
      clearInterval(intervalId);
    };
  }, [connection, publicKey, getBalance]);

  return (
    <header 
      className={`fixed top-0 w-full border-b bg-background/60 backdrop-blur-xl transition-transform duration-300 h-16 z-50 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container flex h-full items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl font-space-grotesk text-gradient">SolCrush</span>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              href="/airdrop" 
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/airdrop' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Mass Transfer</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          {publicKey && (
            <div className="flex items-center gap-2 bg-[#2A2D3A]/80 px-4 py-1.5 rounded-full text-sm">
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : balance !== null ? (
                <>
                  <Image 
                    src="/sol.svg" 
                    alt="SOL" 
                    width={16} 
                    height={16} 
                    className="opacity-80" 
                  />
                  <span 
                    className={`font-medium transition-all duration-300 ${
                      isIncreasing === null 
                        ? '' 
                        : isIncreasing 
                          ? 'text-green-400 scale-110' 
                          : 'text-red-400 scale-110'
                    }`}
                  >
                    {balance.toFixed(4)}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Error loading balance</span>
              )}
            </div>
          )}
          <div suppressHydrationWarning>
            <WalletMultiButton className="!bg-[#2A2D3A]/80 hover:!bg-[#3A3D4A] !h-8 !rounded-full !text-sm !px-4 !py-0" />
          </div>
          <Link
            href="https://t.me/Commit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity text-purple-400 hover:text-purple-300"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
} 