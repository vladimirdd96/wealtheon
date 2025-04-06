import React from "react";
import { SubscriptionTiers } from "@/components/sections/SubscriptionTiers";
import { CallToAction } from "@/components/sections/CallToAction";
import Link from "next/link";

export const metadata = {
  title: "Pricing - Wealtheon",
  description: "Choose the perfect membership tier for your investment needs on Wealtheon.",
};

export default function PricingPage() {
  return (
    <>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Investment Path
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Unlock premium AI-powered insights and personalized investment recommendations with our NFT-based membership tiers.
            </p>
          </div>
        </div>
      </section>

      <SubscriptionTiers />

      <section id="compare-features" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Compare Membership Features
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-4 px-6 text-left text-lg font-medium text-gray-300">Features</th>
                    <th className="py-4 px-6 text-center text-lg font-medium text-gray-300">Basic</th>
                    <th className="py-4 px-6 text-center text-lg font-medium text-purple-400">Advanced</th>
                    <th className="py-4 px-6 text-center text-lg font-medium text-indigo-400">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((feature, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                      <td className="py-4 px-6 text-left text-gray-300">{feature.name}</td>
                      <td className="py-4 px-6 text-center">
                        {renderFeatureAvailability(feature.basic)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {renderFeatureAvailability(feature.advanced)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {renderFeatureAvailability(feature.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-violet-500/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link 
                href="/faq" 
                className="inline-flex items-center text-violet-400 hover:text-violet-300 transition-colors"
              >
                <span className="font-medium">View all frequently asked questions</span>
                <svg 
                  className="ml-2 w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CallToAction />
    </>
  );
}

// Function to render feature availability indicators
function renderFeatureAvailability(value: boolean | string) {
  if (typeof value === 'string') {
    return <span className="text-gray-300">{value}</span>;
  }
  
  return value ? (
    <svg className="w-6 h-6 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
  ) : (
    <svg className="w-6 h-6 mx-auto text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
    </svg>
  );
}

// Feature comparison type
interface FeatureComparison {
  name: string;
  basic: boolean | string;
  advanced: boolean | string;
  premium: boolean | string;
}

// Feature comparison data
const featureComparison: FeatureComparison[] = [
  {
    name: "Market Insights",
    basic: "Basic",
    advanced: "Advanced",
    premium: "Elite"
  },
  {
    name: "Portfolio Tracking",
    basic: true,
    advanced: true,
    premium: true
  },
  {
    name: "Personalized Recommendations",
    basic: false,
    advanced: true,
    premium: true
  },
  {
    name: "Market Predictions",
    basic: "Limited",
    advanced: "Detailed",
    premium: "Premium"
  },
  {
    name: "AI-Powered Analysis",
    basic: false,
    advanced: true,
    premium: true
  },
  {
    name: "NFT Analysis & Valuations",
    basic: false,
    advanced: false,
    premium: true
  },
  {
    name: "DeFi Yield Optimization",
    basic: false,
    advanced: false,
    premium: true
  },
  {
    name: "Trading Signal Alerts",
    basic: false,
    advanced: "Basic",
    premium: "Advanced"
  },
  {
    name: "Community Forum Access",
    basic: true,
    advanced: true,
    premium: true
  },
  {
    name: "1-on-1 Financial Coaching",
    basic: false,
    advanced: false,
    premium: true
  }
];

// FAQ type
interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What are the benefits of higher-tier memberships?",
    answer: "Higher-tier memberships provide access to more advanced AI analysis, personalized investment recommendations, early insights on market trends, NFT rarity analysis, and DeFi yield optimization tools. You'll also receive more frequent updates and detailed reports tailored to your portfolio."
  },
  {
    question: "How do I upgrade my membership tier?",
    answer: "You can upgrade your membership by minting a higher-tier NFT directly on our platform. The NFT serves as your membership token and grants immediate access to all associated features once it's in your wallet."
  },
  {
    question: "Are there any additional fees beyond the NFT purchase?",
    answer: "No, the NFT purchase is a one-time cost that grants you lifetime access to the tier's features. There are no monthly or hidden fees. Future platform updates and enhancements will be available to all existing members within their respective tiers."
  },
  {
    question: "Can I transfer my membership NFT to another wallet?",
    answer: "Yes, as an NFT-based membership, you can transfer it to any wallet you control. If you decide to sell it, the new owner will gain access to the membership benefits. This provides flexibility and potential value appreciation for your membership."
  },
  {
    question: "How is Wealtheon different from other crypto investment platforms?",
    answer: "Wealtheon combines advanced AI analysis with blockchain technology to provide truly personalized investment insights. Our NFT-based membership model ensures exclusive access to features while providing members with a digital asset that may appreciate in value over time."
  }
] 