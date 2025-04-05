import React from "react";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { DataVisualization } from "@/components/sections/DataVisualization";
import { SubscriptionTiers } from "@/components/sections/SubscriptionTiers";
import { CallToAction } from "@/components/sections/CallToAction";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <DataVisualization />
      <SubscriptionTiers />
      <CallToAction />
    </>
  );
}
