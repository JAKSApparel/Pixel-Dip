'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQ_ITEMS = [
  {
    question: "What does SolCrush do?",
    answer: `SolCrush helps you clean up your Solana wallet by:
    • Closing empty token accounts to reclaim rent (~0.002 SOL each)
    • Burning unwanted tokens and NFTs
    • Transferring tokens in bulk
    • Managing compressed NFTs
    The app shows you exactly what will happen before any transaction is made.`
  },
  {
    question: "Is it safe to burn tokens?",
    answer: `Burning tokens is an irreversible process - the tokens will be permanently destroyed. 
    However, SolCrush will:
    • Show you exactly what will be burned before any transaction
    • Never burn tokens without your explicit confirmation
    • Allow you to recover rent from empty token accounts without burning any assets`
  },
  {
    question: "What are Empty Token Accounts?",
    answer: `When you receive tokens or NFTs, Solana creates an account to store them, which costs rent in SOL.
    When you transfer or sell all tokens from an account, the empty account remains and continues to cost rent.
    You can safely close these empty accounts to reclaim the rent (~0.002 SOL each).
    This doesn't affect your ability to receive future airdrops or tokens.`
  },
  {
    question: "What about Compressed NFTs?",
    answer: `Compressed NFTs (cNFTs) are stored differently than regular NFTs and don't have associated token accounts.
    While you can't reclaim rent from cNFTs, you can still:
    • View your compressed NFTs
    • Transfer them to other wallets
    • Burn them if desired (irreversible)`
  },
  {
    question: "How much SOL can I reclaim?",
    answer: `The amount depends on how many empty token accounts you have:
    • Each empty token account: ~0.002 SOL
    • The app will show you the total recoverable amount before any transaction
    • Platform fee: 0.001 SOL + 5% of reclaimed rent`
  },
  {
    question: "Why do I need to pay a fee?",
    answer: `The fee helps cover:
    • Transaction costs
    • Platform maintenance
    • Development of new features
    You'll always see the exact fee amount before confirming any transaction.`
  }
];

export function FAQ() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 animate-gradient" />
      <div className="container relative">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          Frequently Asked Questions
        </h2>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible>
            {FAQ_ITEMS.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}