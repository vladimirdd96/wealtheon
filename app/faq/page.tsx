import { Metadata } from "next";
import { FAQPageContent } from "@/components/sections/FAQPageContent";

export const metadata: Metadata = {
  title: "FAQ - Wealtheon",
  description: "Frequently asked questions about Wealtheon's AI-powered investment platform.",
};

export default function FAQPage() {
  return <FAQPageContent />;
} 