import { Metadata } from "next";
import { Suspense, ReactNode } from "react";

import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Problem from "@/components/Problem";
import Testimonials3 from "@/components/Testimonials3";

// Add metadata for SEO
export const metadata: Metadata = {
  title: "FeNAgO - Agentic AI SaaS Platform Template",
  description:
    "The complete platform for building agentic AI-powered SaaS products—ideal for students, developers, startups, and entrepreneurs looking to innovate rapidly. In the near future, every traditional SaaS application will inevitably be surpassed by an Agentic SaaS solution, redefining the competitive landscape.",
  keywords:
    "agentic AI, SaaS template, AI platform, DrLee, AI development, FeNAgO, AI startup",
};

export default function Home(): JSX.Element {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main>
        {/* FeNAgO - The complete platform for building agentic AI-powered SaaS products */}
        <Hero />
        <Problem />
        <FeaturesAccordion />
        <Pricing />
        <Testimonials3 />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
