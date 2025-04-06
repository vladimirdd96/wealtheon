import React from "react";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { DataVisualization } from "@/components/sections/DataVisualization";
import { SubscriptionTiers } from "@/components/sections/SubscriptionTiers";
import { CallToAction } from "@/components/sections/CallToAction";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Real-Time Market Data
            </h2>
            <p className="text-xl text-gray-400">
              Stay ahead with our accurate and real-time crypto market analysis
            </p>
            <div className="mt-8">
              <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Try AI Dashboard
              </Link>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <DataVisualization />
          </div>
        </div>
      </section>
      <SubscriptionTiers />
      <CallToAction />
    </>
  );
}
