"use client";

import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Privacy } from "@/components/landing/privacy";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { FadeIn } from "@/components/motion/fade-in";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Privacy />
        <CTA />
      </main>
      <FadeIn direction="none">
        <Footer />
      </FadeIn>
    </div>
  );
}
