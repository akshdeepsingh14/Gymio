import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { freePlanFeatures } from "@/data/landingContent";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="cv-auto scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-24">
        {/* Left: copy */}
        <div>
          <SectionHeading
            id="pricing-heading"
            layout="stack"
            title={["The bill is ₹0.", "Check for yourself."]}
            description="Gymio is free for every gym owner. No trials, no tiers, no credit card. It's built for independent gyms, studios, CrossFit boxes and personal trainers."
          >
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to="/sign-up"
                className={cn(buttonVariants({ size: "lg" }), "group h-12 gap-2 px-6 text-base")}
              >
                Create your gym
                <ArrowRight
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hex className="size-4">
                  <Check className="size-2.5" aria-hidden="true" />
                </Hex>
                No credit card needed
              </p>
            </div>
          </SectionHeading>
        </div>

        {/* Right: the receipt. The outer layer is the 2px outline, the inner layer is the paper. */}
        <Reveal delay={0.1} className="mt-14 lg:mt-0">
          <div className="mx-auto max-w-md drop-shadow-[8px_8px_0_var(--rule)] lg:max-w-none">
            <div className="cut-corner bg-foreground p-0.5">
              <div className="relative bg-card text-card-foreground [clip-path:polygon(0_0,calc(100%-17px)_0,100%_17px,100%_100%,0_100%)]">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 pb-5 sm:p-8 sm:pb-6">
                  <div>
                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                      Receipt no. 0001
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold uppercase leading-none">
                      Gymio Free
                    </p>
                  </div>
                  <Badge className="mt-1 h-7 gap-1.5 px-2.5">
                    <Check aria-hidden="true" />
                    Paid in full
                  </Badge>
                </div>

                {/* Divider with ticket notches (they match the page behind the receipt) */}
                <div className="relative" aria-hidden="true">
                  <div className="mx-6 border-t-2 border-dashed border-foreground/30 sm:mx-8" />
                  <span className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />
                  <span className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />
                </div>

                {/* Line items */}
                <ul className="space-y-3 p-6 pb-5 sm:p-8 sm:pb-6">
                  {freePlanFeatures.map((feature) => (
                    <li key={feature} className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0">{feature}</span>
                      <span
                        aria-hidden="true"
                        className="min-w-4 flex-1 -translate-y-[3px] border-b-2 border-dotted border-foreground/30"
                      />
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-muted-foreground">
                        ₹0
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Total */}
                <div className="mx-6 flex items-end justify-between border-t-2 border-foreground py-5 sm:mx-8 sm:py-6">
                  <p className="font-mono text-sm font-semibold">Total due</p>
                  <p className="flex items-end gap-2">
                    <span className="font-display text-7xl font-extrabold leading-[0.8] tabular-nums sm:text-8xl">
                      ₹0
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">/ forever</span>
                  </p>
                </div>

                <p className="px-6 pb-6 text-center font-mono text-xs text-muted-foreground sm:px-8 sm:pb-8">
                  Thank you for running a better gym
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}