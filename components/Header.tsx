'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';

// Dynamically import the WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function Header() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function getBalance() {
      if (!publicKey || !connection || isLoading) return;

      setIsLoading(true);
      let retries = 3;

      while (retries > 0) {
        try {
          const accountInfo = await connection.getAccountInfo(publicKey, 'confirmed');
          
          if (!mounted) return;
          
          setBalance(accountInfo ? accountInfo.lamports / LAMPORTS_PER_SOL : 0);
          setError(null);
          break;
        } catch (err) {
          console.warn(`Balance fetch attempt failed, ${retries - 1} retries left:`, err);
          retries--;
          
          if (retries === 0) {
            if (mounted) {
              console.error('Failed to get balance after all retries:', err);
              setError('Failed to load balance');
              setBalance(null);
            }
          } else {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (mounted) {
        setIsLoading(false);
        timeoutId = setTimeout(getBalance, 10000);
      }
    }

    getBalance();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [publicKey, connection, isLoading]);

  return (
    <header 
      className={`fixed top-0 w-full border-b bg-background/60 backdrop-blur-xl transition-transform duration-300 h-16 z-50 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container flex h-full items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-lg">Sol Crusher</span>
        </Link>
        <div className="flex items-center gap-6">
          {balance !== null && !error && (
            <div className="flex items-center gap-2 bg-background/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Image src="/sol.svg" alt="SOL" width={20} height={20} />
              <span className="font-mono">{balance.toFixed(2)} SOL</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}
          <div suppressHydrationWarning>
            <WalletMultiButton className="!bg-[#2A2D3A] hover:!bg-[#3A3D4A] !h-8 !rounded-full !text-sm !px-4 !py-0" />
          </div>
          <Link
            href="https://t.me/Commit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity text-purple-400 hover:text-purple-300"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 