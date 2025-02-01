'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is Sol Crusher?',
    answer: 'Sol Crusher is a tool that helps you clean up your Solana wallet by burning unwanted tokens, NFTs, and cleaning up old LP positions and Serum accounts.',
  },
  {
    question: 'Is it safe to use?',
    answer: 'Yes, Sol Crusher is open source and all transactions are signed by your wallet. You have full control over what gets burned or cleaned up.',
  },
  {
    question: 'Can I recover burned tokens?',
    answer: 'No, once tokens are burned, they cannot be recovered. Please make sure you want to burn them before proceeding.',
  },
  {
    question: 'What wallets are supported?',
    answer: 'Sol Crusher supports all major Solana wallets including Phantom, Solflare, and more.',
  },
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
            {faqs.map((faq, index) => (
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