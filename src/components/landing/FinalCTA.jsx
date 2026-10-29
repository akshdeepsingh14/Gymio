import { Link, useNavigate } from "react-router";
import { Check } from "lucide-react";

import { Hex } from "@/components/ui/hex";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";

const reassurance = ["100% free", "No credit card", "Set up in minutes"];

// Same viewfinder corners as the hero, so the page ends where it began
const corner = "absolute size-5 border-foreground sm:size-7";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="cta-heading"
      className="tone-invert px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-12 sm:py-20 lg:px-20 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className={cn(corner, "left-0 top-0 border-l-2 border-t-2")} />
          <span className={cn(corner, "right-0 top-0 border-r-2 border-t-2")} />
          <span className={cn(corner, "bottom-0 left-0 border-b-2 border-l-2")} />
          <span className={cn(corner, "bottom-0 right-0 border-b-2 border-r-2")} />
        </div>

        <h2
          id="cta-heading"
          className="font-display text-[clamp(2.75rem,9vw,7.5rem)] font-extrabold uppercase leading-[0.88]"
        >
          Your gym deserves
          <span className="block sm:pl-[10%]">better than a register.</span>
        </h2>

        <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Set up Gymio in minutes and give your members a portal they will
          actually use.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
          <InteractiveHoverButton
            onClick={() => navigate("/sign-up")}
            className="h-14 px-8 text-lg sm:w-auto"
          >
            Create your gym
          </InteractiveHoverButton>

          <Link
            to="/member"
            className="py-2 text-center text-base font-medium underline decoration-2 underline-offset-8 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Already a member? Open your portal
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          {reassurance.map((item) => (
            <li key={item} className="inline-flex items-center gap-2">
              <Hex className="size-5">
                <Check className="size-3" aria-hidden="true" />
              </Hex>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}