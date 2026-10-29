import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import { SectionHeading } from "@/components/ui/section-heading";
import { steps } from "@/data/landingContent";
import { cn } from "@/lib/utils";

/**
 * The only section on the page with numbers, because the steps really are a sequence.
 * The steps sit on one line like plates on a barbell: a hex node per step,
 * joined by a rule (horizontal on tablet and up, vertical on phones).
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="tone-invert scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          id="how-heading"
          title={["Three steps.", "Then you're set up."]}
          description="No installation and no training sessions. If you can use WhatsApp, you can use Gymio."
        />

        <ol className="relative mt-16 md:grid md:grid-cols-3 md:gap-8 lg:mt-24">
          {/* The bar the plates sit on */}
          <span
            aria-hidden="true"
            className="absolute bottom-7 left-7 top-7 w-0.5 bg-foreground/40 md:inset-x-0 md:bottom-auto md:left-0 md:top-7 md:h-0.5 md:w-auto"
          />

          {steps.map((step) => (
            <li
              key={step.number}
              className="relative min-w-0 pb-12 pl-20 last:pb-0 md:pb-0 md:pl-0 md:pt-24"
            >
              <Hex className="absolute left-0 top-0 size-14 font-display text-2xl font-extrabold">
                {step.number}
              </Hex>

              <h3 className="font-display text-3xl font-extrabold uppercase leading-none sm:text-4xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        {/* End of the line */}
        <div className="mt-16 flex flex-col gap-6 border-t-2 border-foreground pt-8 sm:flex-row sm:items-center sm:justify-between lg:mt-24">
          <p className="font-display text-3xl font-extrabold uppercase leading-none sm:text-5xl">
            You&apos;re live. Your members can join.
          </p>

          <Link
            to="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "group h-12 shrink-0 gap-2 px-6 text-base")}
          >
            Start free
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}