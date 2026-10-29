import { useRef, useState } from "react";
import { Check, Dumbbell, UserRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Hex } from "@/components/ui/hex";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { benefits } from "@/data/landingContent";
import { cn } from "@/lib/utils";

const audiences = [
  { key: "owners", label: "For gym owners", icon: Dumbbell },
  { key: "members", label: "For members", icon: UserRound },
];

// The grace period, drawn to scale: [flex weight, label]
const graceTimeline = [
  { weight: 3, label: "Plan active", className: "bg-foreground" },
  { weight: 1, label: "10-day grace", className: "bg-stripes border-l border-foreground text-foreground/70" },
  { weight: 1, label: "Portal paused", className: "border-l border-foreground" },
];

export function Benefits() {
  const [audience, setAudience] = useState("owners");
  const tabRefs = useRef([]);

  // Arrow keys, Home and End move between the tabs.
  const handleKeyDown = (event, index) => {
    const last = audiences.length - 1;
    let next = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    }

    if (next === null) return;

    event.preventDefault();
    setAudience(audiences[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          id="benefits-heading"
          title={["Built for both sides", "of the front desk."]}
          description="Gymio saves owners hours every week and gives members the clarity they keep asking for."
        />

        <div className="mt-14 lg:mt-20 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 xl:gap-24">
          {/* Left: the switch, then the grace period drawn to scale */}
          <div>
            <div
              role="tablist"
              aria-label="Choose audience"
              className="grid grid-cols-2 border-2 border-foreground"
            >
              {audiences.map(({ key, label, icon: Icon }, index) => {
                const isActive = audience === key;

                return (
                  <button
                    key={key}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`benefits-tab-${key}`}
                    aria-selected={isActive}
                    aria-controls="benefits-panel"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setAudience(key)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className={cn(
                      "flex min-h-16 items-center gap-3 px-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5",
                      index > 0 && "border-l-2 border-foreground",
                      isActive
                        ? "bg-foreground text-background"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="font-display text-xl font-extrabold uppercase leading-none sm:text-2xl">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Reveal delay={0.1} className="mt-8">
              <Card className="shadow-hard ring-2 ring-foreground">
                <CardHeader>
                  <CardTitle className="text-2xl">Renewal grace period</CardTitle>
                  <CardDescription className="mt-2 leading-relaxed">
                    Members get 10 days to renew after expiry (you can change
                    this). After that, portal access pauses until a renewal is
                    recorded.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div aria-hidden="true" className="flex h-9 border border-foreground">
                    {graceTimeline.map((part) => (
                      <div
                        key={part.label}
                        className={part.className}
                        style={{ flex: part.weight }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 flex text-xs text-muted-foreground sm:text-sm">
                    {graceTimeline.map((part) => (
                      <li key={part.label} style={{ flex: part.weight }} className="pr-2">
                        {part.label}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {/* Right: the benefits, as plain rows */}
          <div
            id="benefits-panel"
            role="tabpanel"
            aria-labelledby={`benefits-tab-${audience}`}
            tabIndex={0}
            className="mt-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:mt-0"
          >
            <ul className="border-t-2 border-foreground">
              {benefits[audience].map((benefit, index) => (
                <li
                  key={`${audience}-${benefit.title}`}
                  className="animate-fade-up grid gap-3 border-b border-border py-6 sm:grid-cols-[1fr_1fr] sm:gap-8 sm:py-8"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <Hex className="mt-0.5 size-6">
                      <Check className="size-3.5" aria-hidden="true" />
                    </Hex>
                    <h3 className="font-display text-3xl font-extrabold uppercase leading-none">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {benefit.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}