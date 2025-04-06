"use client";
import React, { useState, useEffect } from "react";
import { CallToAction } from "@/components/sections/CallToAction";
import { FAQSearch } from "@/components/sections/FAQSearch";
import Link from "next/link";
import { motion } from "framer-motion";

export function FAQPageContent() {
  const [searchTerm, setSearchTerm] = useState("");

  // Add scroll padding to the document when component mounts
  useEffect(() => {
    // Add scroll-padding-top to account for the fixed navbar
    document.documentElement.style.scrollPaddingTop = "90px"; // Adjust this value based on navbar height plus extra padding
    
    return () => {
      // Clean up when component unmounts
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, []);

  // Scroll to section with offset
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 90; // Navbar height + extra padding
      const sectionPosition = section.getBoundingClientRect().top;
      const offsetPosition = sectionPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Filter FAQs based on search term
  const filteredFaqs = searchTerm
    ? faqs.filter(
        faq =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : faqs;

  // Count FAQs by category for the filtered set
  const faqCountByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredFaqs.filter(faq => faq.category === category.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Find answers to common questions about Wealtheon's AI-powered investment platform
            </p>
            
            {/* Search Component */}
            <FAQSearch onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* FAQ Categories */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {categories.map((category, index) => (
                faqCountByCategory[category.id] > 0 && (
                  <motion.a 
                    key={index} 
                    href={`#${category.id}`}
                    onClick={(e) => scrollToSection(e, category.id)}
                    className="py-2 px-4 bg-gray-800/50 hover:bg-violet-900/30 rounded-lg text-gray-300 hover:text-white transition-colors border border-gray-700/50 hover:border-violet-500/50"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {category.name} 
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-gray-700/50 rounded-full text-xs">
                      {faqCountByCategory[category.id]}
                    </span>
                  </motion.a>
                )
              ))}
            </div>

            {/* Search results summary */}
            {searchTerm && (
              <div className="mb-8 text-center">
                <p className="text-gray-400">
                  {filteredFaqs.length === 0 
                    ? `No results found for "${searchTerm}"`
                    : `Found ${filteredFaqs.length} result${filteredFaqs.length !== 1 ? 's' : ''} for "${searchTerm}"`}
                </p>
                {filteredFaqs.length === 0 && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* FAQ Sections by Category */}
            {categories.map((category, catIndex) => {
              const categoryFaqs = filteredFaqs.filter(faq => faq.category === category.id);
              
              if (categoryFaqs.length === 0) return null;
              
              return (
                <motion.div 
                  key={catIndex} 
                  className="mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * catIndex }}
                >
                  <h2 
                    id={category.id}
                    className="text-2xl md:text-3xl font-bold text-white mb-8 pb-2 border-b border-gray-800"
                  >
                    {category.name}
                  </h2>
                  <div className="space-y-6">
                    {categoryFaqs.map((faq, index) => (
                      <motion.div 
                        key={index} 
                        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-violet-500/30 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                      >
                        <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                        <div className="text-gray-400">
                          {faq.answer}
                          {faq.linkText && faq.linkUrl && (
                            <p className="mt-2">
                              <Link href={faq.linkUrl} className="text-violet-400 hover:text-violet-300 transition-colors">
                                {faq.linkText} →
                              </Link>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            <motion.div 
              className="mt-12 p-6 bg-gray-800/20 border border-gray-700/30 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-center text-gray-400">
                Can't find what you're looking for?{" "}
                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Contact our support team
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <CallToAction />
    </>
  );
}

// Categories for FAQ organization
const categories = [
  { id: "general", name: "General" },
  { id: "membership", name: "Membership & Pricing" },
  { id: "platform", name: "Platform Features" },
  { id: "technical", name: "Technical" },
  { id: "security", name: "Security & Privacy" }
];

// FAQ type
interface FAQ {
  question: string;
  answer: string | React.ReactNode;
  category: string;
  linkText?: string;
  linkUrl?: string;
}

// Expanded FAQ data
const faqs: FAQ[] = [
  // General
  {
    question: "What is Wealtheon?",
    answer: "Wealtheon is an AI-powered investment platform that provides personalized insights and market forecasts for cryptocurrency, NFTs, and DeFi investments. Our platform combines advanced artificial intelligence with blockchain technology to help investors make informed decisions.",
    category: "general"
  },
  {
    question: "How does Wealtheon differ from other crypto investment platforms?",
    answer: "Wealtheon combines advanced AI analysis with blockchain technology to provide truly personalized investment insights. Our NFT-based membership model ensures exclusive access to features while providing members with a digital asset that may appreciate in value over time.",
    category: "general"
  },
  {
    question: "Who can use Wealtheon?",
    answer: "Wealtheon is designed for both beginner and experienced crypto investors. Whether you're just starting your journey in the crypto space or you're a seasoned trader looking for advanced analytics, our platform offers valuable insights tailored to your level of expertise.",
    category: "general",
    linkText: "Learn more about our membership tiers",
    linkUrl: "/pricing"
  },

  // Membership & Pricing
  {
    question: "What are the benefits of higher-tier memberships?",
    answer: "Higher-tier memberships provide access to more advanced AI analysis, personalized investment recommendations, early insights on market trends, NFT rarity analysis, and DeFi yield optimization tools. You'll also receive more frequent updates and detailed reports tailored to your portfolio.",
    category: "membership",
    linkText: "View our pricing page for detailed comparisons",
    linkUrl: "/pricing"
  },
  {
    question: "How do I upgrade my membership tier?",
    answer: "You can upgrade your membership by minting a higher-tier NFT directly on our platform. The NFT serves as your membership token and grants immediate access to all associated features once it's in your wallet.",
    category: "membership"
  },
  {
    question: "Are there any additional fees beyond the NFT purchase?",
    answer: "No, the NFT purchase is a one-time cost that grants you lifetime access to the tier's features. There are no monthly or hidden fees. Future platform updates and enhancements will be available to all existing members within their respective tiers.",
    category: "membership"
  },
  {
    question: "Can I transfer my membership NFT to another wallet?",
    answer: "Yes, as an NFT-based membership, you can transfer it to any wallet you control. If you decide to sell it, the new owner will gain access to the membership benefits. This provides flexibility and potential value appreciation for your membership.",
    category: "membership"
  },
  {
    question: "What happens if I lose access to my wallet?",
    answer: "Since your membership is tied to your NFT in your wallet, losing access to your wallet means losing access to your membership. We strongly recommend implementing proper security measures for your wallet, such as using hardware wallets and securely storing your seed phrases.",
    category: "membership"
  },

  // Platform Features
  {
    question: "What kind of investment insights does Wealtheon provide?",
    answer: "Wealtheon provides market trend analysis, token valuations, personalized portfolio recommendations, risk assessments, and investment opportunity identification. The specific insights you receive depend on your membership tier.",
    category: "platform"
  },
  {
    question: "How accurate are Wealtheon's AI predictions?",
    answer: "While no prediction system is perfect, Wealtheon's AI models are trained on vast amounts of historical data and continuously improved using advanced machine learning techniques. Our system aims to identify patterns and trends rather than making precise price predictions, helping you make more informed decisions.",
    category: "platform"
  },
  {
    question: "Can Wealtheon analyze my existing portfolio?",
    answer: "Yes, Wealtheon can analyze your on-chain portfolio to provide personalized insights, risk assessments, and optimization recommendations. This feature is available to all members, with more detailed analysis for higher tier memberships.",
    category: "platform"
  },
  {
    question: "Does Wealtheon support DeFi protocols?",
    answer: "Yes, Wealtheon provides analytics for major DeFi protocols, including yield farming opportunities, liquidity pool analysis, and risk assessments. Premium members receive detailed yield optimization strategies across multiple DeFi platforms.",
    category: "platform"
  },

  // Technical
  {
    question: "Which blockchains does Wealtheon support?",
    answer: "Currently, Wealtheon supports Ethereum and Solana blockchains. We plan to expand support to additional blockchains in the future based on community feedback and market demand.",
    category: "technical"
  },
  {
    question: "Which wallets are compatible with Wealtheon?",
    answer: "Wealtheon is compatible with most major Web3 wallets, including MetaMask, Phantom, Solflare, and WalletConnect-supported wallets. This allows for a seamless connection experience regardless of your preferred wallet provider.",
    category: "technical"
  },
  {
    question: "Is Wealtheon available on mobile devices?",
    answer: "Yes, Wealtheon is fully responsive and works on mobile browsers. For the best experience, we recommend using desktop for detailed analytics views, but all core features are accessible on mobile devices.",
    category: "technical"
  },

  // Security & Privacy
  {
    question: "How does Wealtheon protect my data?",
    answer: "Wealtheon prioritizes your privacy and security. We only access on-chain data with your permission and never store your private keys. All sensitive data is encrypted, and we implement industry-standard security practices to protect our platform.",
    category: "security"
  },
  {
    question: "Do I need to share my private keys with Wealtheon?",
    answer: "Absolutely not. Wealtheon never asks for or stores your private keys or seed phrases. We use standard Web3 wallet connection methods that only request permission to view your public address and relevant on-chain data.",
    category: "security"
  },
  {
    question: "Is my investment data shared with third parties?",
    answer: "No, your personal investment data is not shared with third parties. We only use aggregated, anonymized data to improve our AI models and platform features. You maintain full control over your data privacy settings within your account.",
    category: "security"
  }
]; 