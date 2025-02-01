import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from '@/components/WalletProvider';
import { Toaster } from "@/components/Toaster";
import { Space_Grotesk } from 'next/font/google';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Suspense } from 'react';
import Loading from './loading';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "SolCrush | Your Solana Companion",
  description: "Clean up and manage your Solana assets with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased dark`}>
      <body className="min-h-screen bg-gradient-background flex flex-col" suppressHydrationWarning>
        <SolanaWalletProvider>
          <Header />
          <Suspense fallback={<Loading />}>
            <main className="flex-grow pt-16">
              {children}
            </main>
          </Suspense>
          <Footer />
        </SolanaWalletProvider>
        <Toaster />
      </body>
    </html>
  );
}
