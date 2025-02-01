import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from '@/components/WalletProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from "@/components/Toaster";
import { Space_Grotesk } from 'next/font/google';

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
  title: "Sol Crusher",
  description: "Clean up your Solana wallet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}>
      <head />
      <body 
        className="min-h-screen bg-gradient-background"
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="dark">
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
