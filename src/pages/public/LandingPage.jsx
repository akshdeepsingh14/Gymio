import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Tape } from "@/components/landing/Tape";
import { Footer } from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { scrollToSection } from "@/lib/scroll";

// Everything under the hero is a separate chunk, so the first screen paints fast.
const BelowFold = lazy(() => import("@/components/landing/BelowFold"));

/** Holds the space while the lower sections load, so the footer doesn't jump. */
function BelowFoldFallback() {
  return (
    <div aria-hidden="true" className="min-h-[100svh] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-24 w-3/4 sm:h-32" />
        <Skeleton className="h-72 w-full sm:h-96" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { hash } = useLocation();
  const [sectionsReady, setSectionsReady] = useState(false);
  const [loadBelow, setLoadBelow] = useState(Boolean(hash));
  const handleReady = useCallback(() => setSectionsReady(true), []);

  // Let the hero paint and settle first, then fetch the rest while the browser is idle.
  // Links like /#pricing skip the wait, because that section is needed right away.
  useEffect(() => {
    if (loadBelow) return;

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setLoadBelow(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(() => setLoadBelow(true), 300);
    return () => window.clearTimeout(timer);
  }, [loadBelow]);

  // Support links like /#pricing. The sections load lazily, so wait for them.
  useEffect(() => {
    if (!hash || !sectionsReady) return;
    const timer = window.setTimeout(() => scrollToSection(hash.slice(1)), 100);
    return () => window.clearTimeout(timer);
  }, [hash, sectionsReady]);

  return (
    <div className="min-h-svh overflow-x-clip">
      {/* React 19 hoists this into <head> */}
      <title>Gymio — Free Gym Management Software</title>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Navbar sectionsReady={sectionsReady} />

      <main id="main-content">
        <Hero />
        <Tape />
        {loadBelow ? (
          <Suspense fallback={<BelowFoldFallback />}>
            <BelowFold onReady={handleReady} />
          </Suspense>
        ) : (
          <BelowFoldFallback />
        )}
      </main>

      <Footer />
    </div>
  );
}