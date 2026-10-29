import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { sampleTestimonials } from "@/data/landingContent";

const GAP = 16; // matches gap-4

export function Testimonials() {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const total = sampleTestimonials.length;

  const getStep = () => {
    const first = scrollerRef.current?.children[0];
    return first ? first.getBoundingClientRect().width + GAP : 0;
  };

  // Work out which card is at the start, throttled with requestAnimationFrame.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let ticking = false;

    const update = () => {
      const step = getStep();
      if (step) {
        const next = Math.round(scroller.scrollLeft / step);
        setIndex(Math.min(Math.max(next, 0), total - 1));
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [total]);

  const scrollByCard = useCallback((direction) => {
    scrollerRef.current?.scrollBy({
      left: direction * getStep(),
      behavior: "smooth",
    });
  }, []);

  const atStart = index <= 0;
  const atEnd = index >= total - 1;
  const progress = (index + 1) / total;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="tone-invert cv-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          id="testimonials-heading"
          title={["A day with Gymio", "feels like this."]}
          description="These are illustrative examples written for this demo. They are not reviews from real customers."
        />

        {/* Scroll-snap track */}
        <Reveal delay={0.1} className="mt-14 lg:mt-20">
          <div
            ref={scrollerRef}
            role="region"
            aria-label="Sample testimonials, scroll sideways to read more"
            tabIndex={0}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {sampleTestimonials.map((t, i) => (
              <figure
                key={`${t.initials}-${i}`}
                className="flex min-h-[21rem] w-[84%] shrink-0 snap-start flex-col justify-between border-2 border-foreground bg-card p-6 text-card-foreground sm:w-[26rem] sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Hex className="size-14 font-display text-xl font-extrabold">
                      {t.initials}
                    </Hex>
                    <Badge variant="outline">Sample</Badge>
                  </div>

                  <blockquote className="mt-6 text-balance text-xl leading-snug sm:text-2xl">
                    {t.quote}
                  </blockquote>
                </div>

                <figcaption className="mt-8 border-t-2 border-foreground pt-4">
                  <p className="font-semibold">{t.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.context}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Progress and arrows */}
          <div className="mt-6 flex items-center gap-4">
            <p
              className="shrink-0 font-mono text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              {index + 1} of {total}
            </p>

            <div className="h-1 flex-1 overflow-hidden bg-border" aria-hidden="true">
              <div
                className="h-full origin-left bg-foreground transition-transform duration-300 ease-out"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 border-2 disabled:border-border"
                aria-label="Previous testimonial"
                onClick={() => scrollByCard(-1)}
                disabled={atStart}
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 border-2 disabled:border-border"
                aria-label="Next testimonial"
                onClick={() => scrollByCard(1)}
                disabled={atEnd}
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}