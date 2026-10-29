import { useEffect } from "react";

import { DashboardPreview } from "./DashboardPreview";
import { ProductFacts } from "./ProductFacts";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Benefits } from "./Benefits";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";

/**
 * Everything under the hero, in one lazy-loaded chunk.
 * The hero and navbar paint first; this loads right behind them.
 * Most sections alternate between paper and ink to give the page a rhythm.
 */
export default function BelowFold({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <>
      <DashboardPreview />
      <ProductFacts />
      <Features />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}